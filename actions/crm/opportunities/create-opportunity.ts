"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import sendEmail from "@/lib/sendmail";
import { inngest } from "@/inngest/client";
import { writeAuditLog } from "@/lib/audit-log";

/**
 * Generate the next job number, starting at 100.
 * Finds the highest existing numeric job_number and increments.
 */
async function getNextJobNumber(): Promise<string> {
  const result = await prismadb.crm_Opportunities.findMany({
    where: { job_number: { not: null } },
    select: { job_number: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  let max = 99; // start at 100
  for (const r of result) {
    const n = parseInt(r.job_number ?? "", 10);
    if (!isNaN(n) && n > max) max = n;
  }

  return String(max + 1);
}

export const createOpportunity = async (data: {
  account?: string;
  assigned_to?: string;
  budget?: string;
  campaign?: string;
  close_date?: Date;
  contact?: string;
  currency?: string;
  description?: string;
  expected_revenue?: string;
  name: string;
  next_step?: string;
  sales_stage?: string;
  type?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const userId = session.user.id;
  const {
    account,
    assigned_to,
    budget,
    campaign,
    close_date,
    contact,
    currency,
    description,
    expected_revenue,
    name,
    next_step,
    sales_stage,
    type,
  } = data;

  try {
    // Auto-assign job number
    const jobNumber = await getNextJobNumber();

    // Auto-generate job name: "JobNumber: CustomerName"
    const jobName = `${jobNumber}: ${name}`;

    const opportunity = await prismadb.crm_Opportunities.create({
      data: {
        account: account || undefined,
        assigned_to: assigned_to || userId,
        budget: budget ? Number(budget) : undefined,
        campaign: campaign || undefined,
        close_date,
        contact: contact || undefined,
        created_by: userId,
        last_activity_by: userId,
        updatedBy: userId,
        currency: currency || undefined,
        description: description || undefined,
        expected_revenue: expected_revenue ? Number(expected_revenue) : undefined,
        name: jobName,
        job_number: jobNumber,
        next_step: next_step || undefined,
        sales_stage: sales_stage || undefined,
        status: "ACTIVE",
        type: type || undefined,
      },
    });

    if (assigned_to && assigned_to !== userId) {
      const notifyRecipient = await prismadb.users.findFirst({
        where: { id: assigned_to },
      });

      if (notifyRecipient) {
        await sendEmail({
          from: process.env.EMAIL_FROM as string,
          to: notifyRecipient.email || "info@softbase.cz",
          subject:
            notifyRecipient.userLanguage === "en"
              ? `New opportunity ${jobName} has been added to the system and assigned to you.`
              : `Nová příležitost ${jobName} byla přidána do systému a přidělena vám.`,
          text:
            notifyRecipient.userLanguage === "en"
              ? `New opportunity ${jobName} has been added to the system and assigned to you. You can click here for detail: ${process.env.NEXT_PUBLIC_APP_URL}/crm/opportunities/${opportunity.id}`
              : `Nová příležitost ${jobName} byla přidána do systému a přidělena vám. Detaily naleznete zde: ${process.env.NEXT_PUBLIC_APP_URL}/crm/opportunities/${opportunity.id}`,
        });
      }
    }

    await writeAuditLog({
      entityType: "opportunity",
      entityId: opportunity.id,
      action: "created",
      changes: null,
      userId: session.user.id,
    });
    void inngest.send({ name: "crm/opportunity.saved", data: { record_id: opportunity.id } });
    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return { data: opportunity };
  } catch (error) {
    console.log("[CREATE_OPPORTUNITY]", error);
    return { error: "Failed to create opportunity" };
  }
};
