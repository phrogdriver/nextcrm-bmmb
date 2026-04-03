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

  // Determine human-readable outcome
  // QueueResult: "bridged" (answered), "hangup" (caller hung up), "queue-full", "error", "leave", "system-error"
  // DialCallStatus: "completed", "no-answer", "busy", "failed", "canceled"
  let outcome: string;
  let callTitle: string;
  const dirLabel = direction === "inbound" ? "Inbound" : "Outbound";

  if (queueResult === "bridged") {
    // Call was answered
    outcome = dialStatus === "completed" ? "answered" : (dialStatus || "answered");
    callTitle = `${dirLabel} call — answered`;
  } else if (queueResult === "hangup") {
    // Caller hung up before anyone answered
    outcome = "missed";
    callTitle = `${dirLabel} call — missed (caller hung up)`;
  } else if (queueResult) {
    // Queue timeout or error — voicemail path handles this above, but just in case
    outcome = "no-answer";
    callTitle = `${dirLabel} call — no answer`;
  } else if (dialStatus === "completed" && dialDuration && dialDuration > 0) {
    // Direct dial (non-TaskRouter) that was answered
    outcome = "answered";
    callTitle = `${dirLabel} call — answered`;
  } else if (dialStatus === "no-answer" || dialStatus === "busy" || dialStatus === "canceled") {
    outcome = dialStatus;
    callTitle = `${dirLabel} call — ${dialStatus.replace("-", " ")}`;
  } else if (dialStatus === "completed" && (!dialDuration || dialDuration === 0)) {
    outcome = "missed";
    callTitle = `${dirLabel} call — missed`;
  } else {
    outcome = dialStatus || "unknown";
    callTitle = `${dirLabel} call — ${outcome}`;
  }

  console.log("[voice/status] Conversation:", conversation?.id, "direction:", direction, "outcome:", outcome, "queueResult:", queueResult, "dialStatus:", dialStatus, "duration:", dialDuration);

  if (conversation) {
    const activity = await (prismadb as any).crm_Activities.create({
      data: {
        type: "call",
        title: callTitle,
        date: new Date(),
        duration: dialDuration,
        outcome,
        status: "completed",
        metadata: {
          direction,
          twilioCallSid: callSid,
          recordingUrl,
          queueResult: queueResult || undefined,
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
