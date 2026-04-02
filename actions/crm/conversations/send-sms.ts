"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { twilioClient, TWILIO_DEFAULT_NUMBER } from "@/lib/twilio/client";
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

    // Use the tracking number that originated this conversation, or fall back to default
    const fromNumber = conversation.trackingNumber?.phoneNumber ?? TWILIO_DEFAULT_NUMBER;

    // Send via Twilio
    const twilioMessage = await twilioClient.messages.create({
      body: data.body,
      to: conversation.phoneNumber,
      from: fromNumber,
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
