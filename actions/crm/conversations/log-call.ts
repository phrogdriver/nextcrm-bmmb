"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const logCall = async (data: {
  conversationId: string;
  title: string;
  description?: string;
  duration?: number;
  outcome?: string;
  direction: "inbound" | "outbound";
}) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { error: "Unauthorized" };

    const conversation = await (prismadb as any).crm_Conversations.findUnique({
      where: { id: data.conversationId, deletedAt: null },
    });
    if (!conversation) return { error: "Conversation not found" };

    const result = await prismadb.$transaction(async (tx) => {
      const activity = await (tx as any).crm_Activities.create({
        data: {
          type: "call",
          title: data.title,
          description: data.description,
          date: new Date(),
          duration: data.duration,
          outcome: data.outcome,
          status: "completed",
          metadata: { direction: data.direction },
          createdBy: session.user.id,
        },
      });

      // Link to conversation
      const links = [
        { activityId: activity.id, entityType: "conversation", entityId: data.conversationId },
      ];

      // Also link to the conversation's contact or lead
      if (conversation.contactId) {
        links.push({ activityId: activity.id, entityType: "contact", entityId: conversation.contactId });
      }
      if (conversation.leadId) {
        links.push({ activityId: activity.id, entityType: "lead", entityId: conversation.leadId });
      }

      await (tx as any).crm_ActivityLinks.createMany({ data: links });

      // Update conversation lastActivityAt
      await (tx as any).crm_Conversations.update({
        where: { id: data.conversationId },
        data: { lastActivityAt: new Date(), updatedBy: session.user.id },
      });

      return activity;
    });

    const fullActivity = await (prismadb as any).crm_Activities.findUnique({
      where: { id: result.id },
      include: {
        created_by_user: { select: { id: true, name: true, avatar: true } },
        links: { select: { id: true, entityType: true, entityId: true } },
      },
    });

    revalidatePath("/[locale]/(routes)/conversations", "page");
    // Also revalidate linked entity pages
    if (conversation.contactId) {
      revalidatePath(`/[locale]/(routes)/crm/contacts/${conversation.contactId}`, "page");
    }
    if (conversation.leadId) {
      revalidatePath(`/[locale]/(routes)/crm/leads/${conversation.leadId}`, "page");
    }

    return { data: fullActivity };
  } catch (error) {
    console.error("logCall error:", error);
    return { error: "Failed to log call" };
  }
};
