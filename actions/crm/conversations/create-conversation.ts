"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";

export const createConversation = async (data: {
  channel: "phone" | "sms" | "chat";
  phoneNumber?: string;
  subject?: string;
  contactId?: string;
  leadId?: string;
}) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { error: "Unauthorized" };

    const conversation = await (prismadb as any).crm_Conversations.create({
      data: {
        channel: data.channel,
        phoneNumber: data.phoneNumber || undefined,
        subject: data.subject || undefined,
        contactId: data.contactId || undefined,
        leadId: data.leadId || undefined,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
      include: {
        contact: { select: { id: true, first_name: true, last_name: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
        created_by_user: { select: { id: true, name: true, avatar: true } },
      },
    });

    await writeAuditLog({
      entityType: "conversation",
      entityId: conversation.id,
      action: "created",
      changes: null,
      userId: session.user.id,
    });

    revalidatePath("/[locale]/(routes)/conversations", "page");
    return { data: conversation };
  } catch (error) {
    console.error("createConversation error:", error);
    return { error: "Failed to create conversation" };
  }
};
