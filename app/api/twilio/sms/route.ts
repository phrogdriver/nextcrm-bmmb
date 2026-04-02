import { NextResponse } from "next/server";
import twilio from "twilio";
import { prismadb } from "@/lib/prisma";
import { validateTwilioRequest } from "@/lib/twilio/validate";

const MessagingResponse = twilio.twiml.MessagingResponse;

export async function POST(request: Request) {
  const formData = await request.formData();
  const body = Object.fromEntries(formData.entries()) as Record<string, string>;

  const isValid = await validateTwilioRequest(request, body);
  if (!isValid && process.env.NODE_ENV === "production") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const from = body.From;         // sender's number
  const to = body.To;             // tracking number that received the SMS
  const messageBody = body.Body ?? "";
  const messageSid = body.MessageSid;
  const numMedia = parseInt(body.NumMedia ?? "0", 10);

  // Collect media URLs if any (MMS)
  const mediaUrls: string[] = [];
  for (let i = 0; i < numMedia; i++) {
    const url = body[`MediaUrl${i}`];
    if (url) mediaUrls.push(url);
  }

  // Look up tracking number
  const trackingNumber = await (prismadb as any).crm_Tracking_Numbers.findUnique({
    where: { phoneNumber: to },
  });

  // Find any open conversation for this phone number (regardless of channel)
  let conversation = await (prismadb as any).crm_Conversations.findFirst({
    where: {
      phoneNumber: from,
      status: "open",
      deletedAt: null,
    },
    orderBy: { lastActivityAt: "desc" },
  });

  if (!conversation) {
    // Look up if this number matches a contact or lead
    const digits = from.replace(/\D/g, "").slice(-10);
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
        phoneNumber: from,
        status: "open",
        trackingNumberId: trackingNumber?.id ?? undefined,
        contactId: contact?.id ?? undefined,
        leadId: lead?.id ?? undefined,
      },
    });
  }

  // Store the message (twilioFrom = the Twilio number they texted)
  await (prismadb as any).crm_Messages.create({
    data: {
      conversationId: conversation.id,
      direction: "inbound",
      body: messageBody,
      mediaUrls,
      twilioMessageSid: messageSid,
      twilioStatus: "received",
      twilioFrom: to,
    },
  });

  // Update conversation timestamp
  await (prismadb as any).crm_Conversations.update({
    where: { id: conversation.id },
    data: { lastActivityAt: new Date() },
  });

  // Return empty TwiML (no auto-reply for now)
  const twiml = new MessagingResponse();
  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
