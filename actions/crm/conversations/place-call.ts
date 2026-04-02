"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { normalizePhone } from "@/lib/twilio/normalize-phone";

/**
 * Creates or updates a conversation for an outbound call.
 * The actual call is placed from the browser via Twilio Client SDK —
 * this just sets up the conversation record so the webhook can find it.
 */
export const placeCall = async (data: {
  phoneNumber: string;
  conversationId?: string;
}) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { error: "Unauthorized" };

    const phone = normalizePhone(data.phoneNumber);
    let conversation;

    if (data.conversationId) {
      // Existing conversation — update it
      conversation = await (prismadb as any).crm_Conversations.update({
        where: { id: data.conversationId },
        data: {
          callDirection: "outbound",
          twilioCallStatus: "initiating",
          lastActivityAt: new Date(),
          updatedBy: session.user.id,
        },
      });
    } else {
      // New outbound conversation
      const digits = phone.replace(/\D/g, "").slice(-10);

      // Try to match a contact or lead
      const contact = await (prismadb as any).crm_Contacts.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { office_phone: { contains: digits } },
            { mobile_phone: { contains: digits } },
          ],
        },
      });

      const lead = !contact
        ? await (prismadb as any).crm_Leads.findFirst({
            where: { deletedAt: null, phone: { contains: digits } },
          })
        : null;

      conversation = await (prismadb as any).crm_Conversations.create({
        data: {
          phoneNumber: phone,
          status: "open",
          callDirection: "outbound",
          twilioCallStatus: "initiating",
          contactId: contact?.id ?? undefined,
          leadId: lead?.id ?? undefined,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        },
      });
    }

    revalidatePath("/[locale]/(routes)/conversations", "page");
    return { data: { conversationId: conversation.id } };
  } catch (error) {
    console.error("placeCall error:", error);
    return { error: "Failed to initiate call" };
  }
};
