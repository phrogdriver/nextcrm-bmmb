"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { twilioClient } from "@/lib/twilio/client";
import { revalidatePath } from "next/cache";

export const sendSms = async (data: {
  conversationId: string;
  body: string;
}) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { error: "Unauthorized" };

    const conversation = await (prismadb as any).crm_Conversations.findUnique({
      where: { id: data.conversationId, deletedAt: null },
      include: { trackingNumber: true },
    });
    if (!conversation) return { error: "Conversation not found" };
    if (!conversation.phoneNumber) return { error: "No phone number on conversation" };

    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    if (!messagingServiceSid) return { error: "Messaging service not configured" };

    // Send via Twilio Messaging Service (handles A2P compliance and number selection)
    const twilioMessage = await twilioClient.messages.create({
      body: data.body,
      to: conversation.phoneNumber,
      messagingServiceSid,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/sms/status`,
    });

    // Store the message
    const message = await (prismadb as any).crm_Messages.create({
      data: {
        conversationId: data.conversationId,
        direction: "outbound",
        body: data.body,
        twilioMessageSid: twilioMessage.sid,
        twilioStatus: twilioMessage.status,
        sentBy: session.user.id,
      },
    });

    // Update conversation timestamp
    await (prismadb as any).crm_Conversations.update({
      where: { id: data.conversationId },
      data: { lastActivityAt: new Date() },
    });

    revalidatePath("/[locale]/(routes)/conversations", "page");
    return { data: message };
  } catch (error) {
    console.error("sendSms error:", error);
    return { error: "Failed to send SMS" };
  }
};
