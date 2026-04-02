"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { twilioClient } from "@/lib/twilio/client";
import { revalidatePath } from "next/cache";

/**
 * Send an outbound SMS through Twilio Conversations API.
 * Creates or reuses a Twilio Conversation, then adds a message.
 * The message is synced back to our DB via the Conversations webhook.
 */
export const sendSms = async (data: {
  conversationId: string;
  body: string;
}) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { error: "Unauthorized" };

    const serviceSid = process.env.TWILIO_CONVERSATIONS_SERVICE_SID;
    if (!serviceSid) return { error: "Conversations service not configured" };

    const conversation = await (prismadb as any).crm_Conversations.findUnique({
      where: { id: data.conversationId, deletedAt: null },
    });
    if (!conversation) return { error: "Conversation not found" };
    if (!conversation.phoneNumber) return { error: "No phone number on conversation" };

    let twilioConvSid = conversation.twilioConversationSid;

    // Create a Twilio Conversation if one doesn't exist yet
    if (!twilioConvSid) {
      const twilioConv = await twilioClient.conversations.v1
        .services(serviceSid)
        .conversations.create({
          friendlyName: `CRM: ${conversation.phoneNumber}`,
        });

      twilioConvSid = twilioConv.sid;

      // Add the customer as an SMS participant
      await twilioClient.conversations.v1
        .services(serviceSid)
        .conversations(twilioConvSid)
        .participants.create({
          "messagingBinding.address": conversation.phoneNumber,
          "messagingBinding.proxyAddress": process.env.TWILIO_DEFAULT_NUMBER!,
        });

      // Add the CRM agent as a chat participant
      await twilioClient.conversations.v1
        .services(serviceSid)
        .conversations(twilioConvSid)
        .participants.create({
          identity: "crm-agent",
        });

      // Link the Twilio Conversation to our local record
      await (prismadb as any).crm_Conversations.update({
        where: { id: data.conversationId },
        data: { twilioConversationSid: twilioConvSid },
      });
    }

    // Send the message through the Twilio Conversation
    const twilioMessage = await twilioClient.conversations.v1
      .services(serviceSid)
      .conversations(twilioConvSid)
      .messages.create({
        author: "crm-agent",
        body: data.body,
      });

    // Store locally (the webhook will also try, but we do it here for immediate UI update)
    const message = await (prismadb as any).crm_Messages.create({
      data: {
        conversationId: data.conversationId,
        direction: "outbound",
        body: data.body,
        twilioMessageSid: twilioMessage.sid,
        twilioStatus: "sent",
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
