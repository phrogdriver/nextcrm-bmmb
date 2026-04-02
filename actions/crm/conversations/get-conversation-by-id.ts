"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getActivitiesByEntity, type ActivityCursor, type ActivityWithLinks } from "@/actions/crm/activities/get-activities-by-entity";

export type ConversationDetail = {
  id: string;
  phoneNumber: string | null;
  subject: string | null;
  status: "open" | "closed";
  twilioConversationSid: string | null;
  lastActivityAt: Date;
  createdAt: Date;
  contactId: string | null;
  leadId: string | null;
  contact: { id: string; first_name: string | null; last_name: string; office_phone: string | null; mobile_phone: string | null } | null;
  lead: { id: string; firstName: string | null; lastName: string; phone: string | null } | null;
  created_by_user: { id: string; name: string | null; avatar: string | null } | null;
};

export const getConversationById = async (
  id: string,
  activityCursor?: ActivityCursor
): Promise<{
  conversation: ConversationDetail | null;
  activities: ActivityWithLinks[];
  nextActivityCursor: ActivityCursor | null;
}> => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { conversation: null, activities: [], nextActivityCursor: null };

    const conversation = await (prismadb as any).crm_Conversations.findUnique({
      where: { id, deletedAt: null },
      include: {
        contact: {
          select: { id: true, first_name: true, last_name: true, office_phone: true, mobile_phone: true },
        },
        lead: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        created_by_user: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (!conversation) {
      return { conversation: null, activities: [], nextActivityCursor: null };
    }

    const { data: activities, nextCursor } = await getActivitiesByEntity(
      "conversation",
      id,
      activityCursor
    );

    return {
      conversation: conversation as ConversationDetail,
      activities,
      nextActivityCursor: nextCursor,
    };
  } catch (error) {
    console.error("getConversationById error:", error);
    return { conversation: null, activities: [], nextActivityCursor: null };
  }
};
