"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";

/**
 * Full booking flow from conversations:
 * 1. Create a lead
 * 2. Optionally create a job (opportunity) + appointment
 * 3. Link to conversation
 * 4. Link existing activities
 */
export const bookLead = async (data: {
  // Lead info
  firstName?: string;
  lastName: string;
  phone?: string;
  request?: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  leadSourceId?: string;
  // Conversation link
  conversationId: string;
  // Scheduling (optional — skip to create lead only)
  schedule?: {
    assignedTo: string; // PM user ID
    startDate: string;  // ISO date string
    startTime: string;  // HH:mm
    timezone?: string;  // IANA timezone (default: America/Denver)
    notes?: string;
  };
}) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { error: "Unauthorized" };
    const userId = session.user.id;

    const result = await prismadb.$transaction(async (tx) => {
      // 1. Create lead
      const lead = await (tx as any).crm_Leads.create({
        data: {
          v: 1,
          createdBy: userId,
          updatedBy: userId,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          request: data.request,
          property_address: data.propertyAddress,
          property_city: data.propertyCity,
          property_state: data.propertyState,
          property_zip: data.propertyZip,
          // Only pass lead_source_id if it looks like a valid UUID
          lead_source_id: data.leadSourceId && data.leadSourceId.includes("-") ? data.leadSourceId : undefined,
          assigned_to: data.schedule?.assignedTo || userId,
        },
      });

      // 2. Link conversation to lead
      await (tx as any).crm_Conversations.update({
        where: { id: data.conversationId },
        data: { leadId: lead.id },
      });

      // 3. Link existing activities to lead
      const existingLinks = await (tx as any).crm_ActivityLinks.findMany({
        where: { entityType: "conversation", entityId: data.conversationId },
        select: { activityId: true },
      });
      const activityIds = (existingLinks as Array<{ activityId: string }>).map((l) => l.activityId);
      if (activityIds.length > 0) {
        await (tx as any).crm_ActivityLinks.createMany({
          data: activityIds.map((activityId) => ({
            activityId,
            entityType: "lead",
            entityId: lead.id,
          })),
        });
      }

      // 4. Create contact from lead data
      const contact = await (tx as any).crm_Contacts.create({
        data: {
          v: 0,
          first_name: data.firstName,
          last_name: data.lastName,
          mobile_phone: data.phone,
          createdBy: userId,
          updatedBy: userId,
          assigned_to: data.schedule?.assignedTo || userId,
        },
      });

      // Link conversation to contact too
      await (tx as any).crm_Conversations.update({
        where: { id: data.conversationId },
        data: { contactId: contact.id },
      });

      // Link activities to contact
      if (activityIds.length > 0) {
        await (tx as any).crm_ActivityLinks.createMany({
          data: activityIds.map((activityId) => ({
            activityId,
            entityType: "contact",
            entityId: contact.id,
          })),
        });
      }

      let job: any = null;
      let appointment: any = null;

      // 5. Create job (opportunity) + appointment
      if (data.schedule) {
        // Client sends timezone (e.g., "America/Denver"), date, and time separately.
        // We construct the correct UTC timestamp using the timezone.
        const tz = data.schedule.timezone || "America/Denver";
        const naive = `${data.schedule.startDate}T${data.schedule.startTime}:00`;
        // Use a formatter to find the UTC offset for this date in this timezone
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          hour12: false, timeZoneName: "longOffset",
        });
        // Parse: get the offset from a reference date near our target
        const refDate = new Date(naive + "Z");
        const formatted = formatter.format(refDate);
        const offsetMatch = formatted.match(/GMT([+-]\d{2}:\d{2})/);
        const offset = offsetMatch ? offsetMatch[1] : "-06:00";
        const startDateTime = new Date(`${naive}${offset}`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour default

        job = await (tx as any).crm_Opportunities.create({
          data: {
            v: 1,
            name: `${data.firstName || ""} ${data.lastName} — Inspection`.trim(),
            description: data.request,
            budget: 0,
            close_date: startDateTime,
            assigned_to: data.schedule.assignedTo,
            created_by: userId,
            createdBy: userId,
            updatedBy: userId,
            contact: contact.id,
          },
        });

        // Link activities to job
        if (activityIds.length > 0) {
          await (tx as any).crm_ActivityLinks.createMany({
            data: activityIds.map((activityId) => ({
              activityId,
              entityType: "opportunity",
              entityId: job.id,
            })),
          });
        }

        appointment = await (tx as any).crm_Appointments.create({
          data: {
            job_id: job.id,
            title: `Inspection — ${data.firstName || ""} ${data.lastName}`.trim(),
            type: "INSPECTION",
            start_date: startDateTime,
            end_date: endDateTime,
            assigned_to: data.schedule.assignedTo,
            notes: data.schedule.notes,
            createdBy: userId,
          },
        });

        // Update lead with conversion tracking
        await (tx as any).crm_Leads.update({
          where: { id: lead.id },
          data: {
            converted_at: new Date(),
            converted_to_contact: contact.id,
            converted_to_job: job.id,
          },
        });
      } else {
        // No scheduling — still mark conversion to contact
        await (tx as any).crm_Leads.update({
          where: { id: lead.id },
          data: {
            converted_at: new Date(),
            converted_to_contact: contact.id,
          },
        });
      }

      return { lead, contact, job, appointment };
    });

    await writeAuditLog({
      entityType: "lead",
      entityId: result.lead.id,
      action: "created",
      changes: null,
      userId: session.user.id,
    });

    revalidatePath("/[locale]/(routes)/conversations", "page");
    revalidatePath("/[locale]/(routes)/crm/leads", "page");
    return { data: result };
  } catch (error) {
    console.error("bookLead error:", error);
    return { error: "Failed to book lead" };
  }
};

/**
 * Get active users with PM role for the scheduling picker.
 */
export const getProjectManagers = async (): Promise<Array<{ id: string; name: string | null }>> => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    const users = await prismadb.users.findMany({
      where: { userStatus: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return users;
  } catch {
    return [];
  }
};
