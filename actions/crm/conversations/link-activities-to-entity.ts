"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

/**
 * Links all activities in a conversation to a newly created lead or contact.
 * Called after creating a lead/contact from the conversations page so
 * existing call activities appear on the lead/contact detail page too.
 */
export const linkActivitiesToEntity = async (data: {
  conversationId: string;
  entityType: "lead" | "contact";
  entityId: string;
}) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { error: "Unauthorized" };

    // Find all activity links for this conversation
    const existingLinks = await (prismadb as any).crm_ActivityLinks.findMany({
      where: {
        entityType: "conversation",
        entityId: data.conversationId,
      },
      select: { activityId: true },
    });

    const activityIds = (existingLinks as Array<{ activityId: string }>).map((l) => l.activityId);
    if (activityIds.length === 0) return { data: { linked: 0 } };

    // Check which activities already have a link to this entity (avoid duplicates)
    const alreadyLinked = await (prismadb as any).crm_ActivityLinks.findMany({
      where: {
        entityType: data.entityType,
        entityId: data.entityId,
        activityId: { in: activityIds },
      },
      select: { activityId: true },
    });

    const alreadyLinkedIds = new Set((alreadyLinked as Array<{ activityId: string }>).map((l) => l.activityId));
    const toLink = activityIds.filter((id) => !alreadyLinkedIds.has(id));

    if (toLink.length > 0) {
      await (prismadb as any).crm_ActivityLinks.createMany({
        data: toLink.map((activityId) => ({
          activityId,
          entityType: data.entityType,
          entityId: data.entityId,
        })),
      });
    }

    return { data: { linked: toLink.length } };
  } catch (error) {
    console.error("linkActivitiesToEntity error:", error);
    return { error: "Failed to link activities" };
  }
};
