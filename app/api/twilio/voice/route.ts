import { NextResponse } from "next/server";
import twilio from "twilio";
import { prismadb } from "@/lib/prisma";
import { validateTwilioRequest } from "@/lib/twilio/validate";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: Request) {
  const formData = await request.formData();
  const body = Object.fromEntries(formData.entries()) as Record<string, string>;

  const isValid = await validateTwilioRequest(request, body);
  if (!isValid && process.env.NODE_ENV === "production") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const callSid = body.CallSid;

  // If "To" is a phone number, this is an outbound call from the browser
  const toNumber = body.To;
  const isOutbound = toNumber && /^\+?\d{10,15}$/.test(toNumber.replace(/\D/g, ""));

  if (isOutbound) {
    return handleOutbound(toNumber, callSid);
  }

  return handleInbound(body, callSid);
}

async function handleOutbound(to: string, callSid: string) {
  // Update the conversation that was pre-created by placeCall action
  const conversation = await (prismadb as any).crm_Conversations.findFirst({
    where: {
      phoneNumber: to,
      callDirection: "outbound",
      twilioCallStatus: "initiating",
      deletedAt: null,
    },
    orderBy: { lastActivityAt: "desc" },
    include: { trackingNumber: true },
  });

  if (conversation) {
    await (prismadb as any).crm_Conversations.update({
      where: { id: conversation.id },
      data: { twilioCallSid: callSid, twilioCallStatus: "ringing" },
    });
  }

  // Use the tracking number from the conversation, or default
  const callerId = conversation?.trackingNumber?.phoneNumber
    ?? process.env.TWILIO_DEFAULT_NUMBER!;

  const twiml = new VoiceResponse();
  const dial = twiml.dial({
    callerId,
    timeout: 30,
  });
  dial.number(to);

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}

async function handleInbound(
  body: Record<string, string>,
  callSid: string,
) {
  const from = body.From;
  const to = body.To;

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
        twilioCallSid: callSid,
        twilioCallStatus: "ringing",
        callDirection: "inbound",
        trackingNumberId: trackingNumber?.id ?? undefined,
        contactId: contact?.id ?? undefined,
        leadId: lead?.id ?? undefined,
      },
    });
  } else {
    await (prismadb as any).crm_Conversations.update({
      where: { id: conversation.id },
      data: {
        twilioCallSid: callSid,
        twilioCallStatus: "ringing",
        callDirection: "inbound",
        lastActivityAt: new Date(),
      },
    });
  }

  // Ring browser clients
  const twiml = new VoiceResponse();
  const dial = twiml.dial({
    callerId: from,
    timeout: 30,
  });
  dial.client("crm-agent");

  // If nobody answers, say a message and hang up
  twiml.say("Sorry, no one is available to take your call. Please leave a message or try again later.");
  twiml.hangup();

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
