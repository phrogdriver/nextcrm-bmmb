import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

/**
 * Twilio Conversations webhook — handles post-events from Conversations API.
 *
 * Events:
 * - onMessageAdded: sync messages to our DB, set phone number on first message
 * - onConversationAdded: create placeholder local conversation
 * - onConversationStateUpdated: sync conversation state changes
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const body = Object.fromEntries(formData.entries()) as Record<string, string>;

  const eventType = body.EventType;

  switch (eventType) {
    case "onMessageAdded":
      await handleMessageAdded(body);
      break;
    case "onConversationAdded":
      await handleConversationAdded(body);
      break;
    case "onConversationStateUpdated":
      await handleConversationStateUpdated(body);
      break;
    default:
      console.log("Unhandled Conversations event:", eventType, body);
  }

  return new NextResponse("OK", { status: 200 });
}

async function handleMessageAdded(body: Record<string, string>) {
  const conversationSid = body.ConversationSid;
  const messageSid = body.MessageSid;
  const author = body.Author ?? "";
  const messageBody = body.Body ?? "";

  // Find our conversation by Twilio Conversation SID
  let conversation = await (prismadb as any).crm_Conversations.findFirst({
    where: { twilioConversationSid: conversationSid },
  });

  if (!conversation) {
    // Auto-create if webhook arrived before onConversationAdded
    conversation = await (prismadb as any).crm_Conversations.create({
      data: {
        twilioConversationSid: conversationSid,
        status: "open",
      },
    });
  }

  // If conversation has no phone number yet, set it from the inbound message author
  const isInbound = author.startsWith("+");
  if (isInbound && !conversation.phoneNumber) {
    const digits = author.replace(/\D/g, "").slice(-10);

    // Look up contact or lead by phone
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

    await (prismadb as any).crm_Conversations.update({
      where: { id: conversation.id },
      data: {
        phoneNumber: author,
        contactId: contact?.id ?? undefined,
        leadId: lead?.id ?? undefined,
      },
    });
  }

  // Check for duplicate message
  const existing = await (prismadb as any).crm_Messages.findFirst({
    where: { twilioMessageSid: messageSid },
  });
  if (existing) return;

  // Store the message
  const direction = isInbound ? "inbound" : "outbound";
  await (prismadb as any).crm_Messages.create({
    data: {
      conversationId: conversation.id,
      direction,
      body: messageBody,
      twilioMessageSid: messageSid,
      twilioStatus: "received",
      twilioFrom: isInbound ? author : null,
    },
  });

  // Update conversation timestamp
  await (prismadb as any).crm_Conversations.update({
    where: { id: conversation.id },
    data: { lastActivityAt: new Date() },
  });
}

async function handleConversationAdded(body: Record<string, string>) {
  const conversationSid = body.ConversationSid;

  const existing = await (prismadb as any).crm_Conversations.findFirst({
    where: { twilioConversationSid: conversationSid },
  });
  if (existing) return;

  await (prismadb as any).crm_Conversations.create({
    data: {
      twilioConversationSid: conversationSid,
      status: "open",
    },
  });
}

async function handleConversationStateUpdated(body: Record<string, string>) {
  const conversationSid = body.ConversationSid;
  const state = body.StateTo; // active, inactive, closed

  const conversation = await (prismadb as any).crm_Conversations.findFirst({
    where: { twilioConversationSid: conversationSid },
  });

  if (conversation) {
    await (prismadb as any).crm_Conversations.update({
      where: { id: conversation.id },
      data: {
        status: state === "closed" ? "closed" : "open",
        lastActivityAt: new Date(),
      },
    });
  }
}
