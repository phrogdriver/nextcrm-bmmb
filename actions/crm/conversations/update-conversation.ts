"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog, diffObjects } from "@/lib/audit-log";

export const updateConversation = async (data: {
  id: string;
  status?: "open" | "closed";
  contactId?: string | null;
  leadId?: string | null;
  subject?: string;
}) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { error: "Unauthorized" };

    const before = await (prismadb as any).crm_Conversations.findUnique({
      where: { id: data.id, deletedAt: null },
    });
    if (!before) return { error: "Conversation not found" };

    const updateData: Record<string, unknown> = { updatedBy: session.user.id };
    if (data.status !== undefined) updateData.status = data.status;
    if (data.contactId !== undefined) updateData.contactId = data.contactId;
    if (data.leadId !== undefined) updateData.leadId = data.leadId;
    if (data.subject !== undefined) updateData.subject = data.subject;

    const conversation = await (prismadb as any).crm_Conversations.update({
      where: { id: data.id },
      data: updateData,
      include: {
        contact: { select: { id: true, first_name: true, last_name: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const changes = diffObjects(
      before as Record<string, unknown>,
      conversation as Record<string, unknown>
    );
    await writeAuditLog({
      entityType: "conversation",
      entityId: conversation.id,
      action: "updated",
      changes,
      userId: session.user.id,
    });

    revalidatePath("/[locale]/(routes)/conversations", "page");
    return { data: conversation };
  } catch (error) {
    console.error("updateConversation error:", error);
    return { error: "Failed to update conversation" };
  }
};
