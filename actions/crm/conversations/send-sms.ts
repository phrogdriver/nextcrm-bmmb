"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { twilioClient } from "@/lib/twilio/client";
import { revalidatePath } from "next/cache";

/**
 * Send an outbound SMS. The "from" number is determined by priority:
 * 1. The number the customer last called/texted (from the most recent inbound message)
 * 2. User-selected override (data.fromNumber)
 * 3. TWILIO_DEFAULT_NUMBER
 */
export const sendSms = async (data: {
  conversationId: string;
  body: string;
  fromNumber?: string; // optional user override
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

    // Priority 1: last Twilio number the customer contacted
    let fromNumber: string | null = null;

    const lastInbound = await (prismadb as any).crm_Messages.findFirst({
      where: {
        conversationId: data.conversationId,
        direction: "inbound",
        twilioFrom: { not: null },
      },
      orderBy: { createdAt: "desc" },
      select: { twilioFrom: true },
    });

    if (lastInbound?.twilioFrom) {
      fromNumber = lastInbound.twilioFrom;
    }

    // Priority 2: user-selected override
    if (data.fromNumber) {
      fromNumber = data.fromNumber;
    }

    // Priority 3: tracking number on conversation
    if (!fromNumber && conversation.trackingNumber?.phoneNumber) {
      fromNumber = conversation.trackingNumber.phoneNumber;
    }

    // Priority 4: default number
    if (!fromNumber) {
      fromNumber = process.env.TWILIO_DEFAULT_NUMBER ?? null;
    }

    if (!fromNumber) return { error: "No from number available" };

    // Send via Twilio — use messaging service if available for A2P compliance
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    const twilioMessage = await twilioClient.messages.create({
      body: data.body,
      to: conversation.phoneNumber,
      ...(messagingServiceSid
        ? { messagingServiceSid, from: fromNumber }
        : { from: fromNumber }),
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
        twilioFrom: fromNumber,
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
