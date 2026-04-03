import { NextResponse } from "next/server";
import twilio from "twilio";
import { prismadb } from "@/lib/prisma";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: Request) {
  const formData = await request.formData();
  const body = Object.fromEntries(formData.entries()) as Record<string, string>;

  console.log("[voice/status] Twilio params:", JSON.stringify(body));

  const callSid = body.CallSid;
  const from = body.From ?? body.Caller ?? "";
  const to = body.To ?? body.Called ?? "";
  const direction = body.Direction === "outbound-api" || from.startsWith("client:") ? "outbound" : "inbound";

  // Enqueue action sends QueueResult; Dial action sends DialCallStatus
  const queueResult = body.QueueResult; // "bridged", "queue-full", "error", "hangup", "leave", "system-error"
  const dialStatus = body.DialCallStatus ?? body.CallStatus ?? "completed";
  const dialDuration = (body.DialCallDuration ?? body.CallDuration)
    ? parseInt(body.DialCallDuration ?? body.CallDuration, 10)
    : null;
  const recordingUrl = body.RecordingUrl ?? null;

  // If TaskRouter couldn't find an agent, send to voicemail
  if (queueResult && queueResult !== "bridged" && queueResult !== "hangup") {
    console.log("[voice/status] Queue result:", queueResult, "— sending to voicemail");
    const twiml = new VoiceResponse();
    twiml.say(
      { voice: "Polly.Joanna" },
      "We're sorry, all of our representatives are currently unavailable. Please leave a message after the beep and we'll return your call as soon as possible."
    );
    twiml.record({
      maxLength: 120,
      transcribe: true,
      transcribeCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice/voicemail`,
      action: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice/voicemail`,
      method: "POST",
      playBeep: true,
    });
    twiml.say({ voice: "Polly.Joanna" }, "We did not receive a recording. Goodbye.");

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Find conversation: try exact CallSid match first, then fall back to phone number
  const customerPhone = direction === "inbound" ? from : to;

  let conversation = await (prismadb as any).crm_Conversations.findFirst({
    where: { twilioCallSid: callSid },
  });

  if (!conversation) {
    conversation = await (prismadb as any).crm_Conversations.findFirst({
      where: {
        phoneNumber: customerPhone,
        status: "open",
        deletedAt: null,
      },
      orderBy: { lastActivityAt: "desc" },
    });
  }

  const outcome = queueResult === "bridged" ? (dialStatus || "completed") : dialStatus;
  console.log("[voice/status] Conversation:", conversation?.id, "direction:", direction, "status:", outcome, "duration:", dialDuration);

  if (conversation) {
    const activity = await (prismadb as any).crm_Activities.create({
      data: {
        type: "call",
        title: `${direction === "inbound" ? "Inbound" : "Outbound"} call — ${outcome}`,
        date: new Date(),
        duration: dialDuration,
        outcome,
        status: "completed",
        metadata: {
          direction,
          twilioCallSid: callSid,
          recordingUrl,
        },
      },
    });

    const links: Array<{ activityId: string; entityType: string; entityId: string }> = [
      { activityId: activity.id, entityType: "conversation", entityId: conversation.id },
    ];
    if (conversation.contactId) {
      links.push({ activityId: activity.id, entityType: "contact", entityId: conversation.contactId });
    }
    if (conversation.leadId) {
      links.push({ activityId: activity.id, entityType: "lead", entityId: conversation.leadId });
    }

    await (prismadb as any).crm_ActivityLinks.createMany({ data: links });

    await (prismadb as any).crm_Conversations.update({
      where: { id: conversation.id },
      data: { lastActivityAt: new Date() },
    });

    console.log("[voice/status] Activity created:", activity.id);
  } else {
    console.log("[voice/status] No conversation found for:", customerPhone);
  }

  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>',
    { headers: { "Content-Type": "text/xml" } }
  );
}
