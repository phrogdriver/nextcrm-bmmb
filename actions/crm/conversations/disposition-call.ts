"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Disposition a call activity. Auto-closes the parent conversation.
 *
 * Call disposition is required before a conversation can be closed.
 * Dispositioning a call = closing the interaction cycle.
 */
export const dispositionCall = async (data: {
  activityId: string;
  disposition: "booked" | "not_interested" | "wrong_number" | "spam" | "existing_customer" | "no_response";
  note?: string;
}) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { error: "Unauthorized" };

    // Update the call activity with disposition
    const activity = await (prismadb as any).crm_Activities.update({
      where: { id: data.activityId },
      data: {
        disposition: data.disposition,
        dispositionNote: data.note || undefined,
        dispositionAt: new Date(),
        dispositionBy: session.user.id,
      },
      include: {
        links: { select: { entityType: true, entityId: true } },
      },
    });

    // Find the linked conversation and close it
    const convLink = (activity.links as Array<{ entityType: string; entityId: string }>)
      .find((l) => l.entityType === "conversation");

    if (convLink) {
      await (prismadb as any).crm_Conversations.update({
        where: { id: convLink.entityId },
        data: {
          status: "closed",
          lastActivityAt: new Date(),
        },
      });
    }

    revalidatePath("/[locale]/(routes)/conversations", "page");
    return { data: activity };
  } catch (error) {
    console.error("dispositionCall error:", error);
    return { error: "Failed to disposition call" };
  }
};
