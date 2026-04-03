import { NextResponse } from "next/server";
import twilio from "twilio";
import { prismadb } from "@/lib/prisma";

const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * Voicemail handler — called in two scenarios:
 * 1. Record action URL (immediately after recording) — creates the activity
 * 2. Transcription callback (later, async) — updates existing activity with transcription
 *
 * We distinguish them by checking for TranscriptionStatus.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const body = Object.fromEntries(formData.entries()) as Record<string, string>;

  console.log("[voicemail] Params:", JSON.stringify(body));

  const callSid = body.CallSid;
  const from = body.From ?? body.Caller ?? "";
  const recordingUrl = body.RecordingUrl ?? null;
  const recordingDuration = body.RecordingDuration ? parseInt(body.RecordingDuration, 10) : null;
  const transcriptionText = body.TranscriptionText ?? null;
  const isTranscriptionCallback = !!body.TranscriptionStatus;

  // Find the conversation for this call
  let conversation = await (prismadb as any).crm_Conversations.findFirst({
    where: { twilioCallSid: callSid },
  });

  if (!conversation) {
    const digits = from.replace(/\D/g, "").slice(-10);
    conversation = await (prismadb as any).crm_Conversations.findFirst({
      where: {
        phoneNumber: { contains: digits },
        status: "open",
        deletedAt: null,
      },
      orderBy: { lastActivityAt: "desc" },
    });
  }

  if (isTranscriptionCallback && transcriptionText && conversation) {
    // Transcription callback — find and update existing voicemail activity
    const existingLink = await (prismadb as any).crm_ActivityLinks.findFirst({
      where: { entityType: "conversation", entityId: conversation.id },
      include: { activity: true },
      orderBy: { activity: { createdAt: "desc" } },
    });

    if (existingLink?.activity?.type === "voicemail") {
      await (prismadb as any).crm_Activities.update({
        where: { id: existingLink.activity.id },
        data: {
          description: transcriptionText,
          metadata: {
            ...(existingLink.activity.metadata as any),
            transcriptionText,
          },
        },
      });
      console.log("[voicemail] Updated transcription on activity:", existingLink.activity.id);
    }

    return NextResponse.json({ ok: true });
  }

  // Record action — create the voicemail activity
  if (conversation && recordingUrl) {
    const activity = await (prismadb as any).crm_Activities.create({
      data: {
        type: "voicemail",
        title: `Voicemail from ${from}`,
        description: transcriptionText,
        date: new Date(),
        duration: recordingDuration,
        outcome: "voicemail",
        status: "completed",
        metadata: {
          direction: "inbound",
          twilioCallSid: callSid,
          recordingUrl,
          transcriptionText,
        },
      },
    });

    const links: Array<{ activityId: string; entityType: string; entityId: string }> = [
      { activityId: activity.id, entityType: "conversation", entityId: conversation.id },
    ];
    if (conversation.contactId) {
      links.push({ activityId: activity.id, entityType: "contact", entityId: conversation.contactId });

      const contactOpps = await (prismadb as any).contactsToOpportunities.findMany({
        where: { contact_id: conversation.contactId },
        select: { opportunity_id: true },
      });
      for (const co of contactOpps) {
        links.push({ activityId: activity.id, entityType: "opportunity", entityId: co.opportunity_id });
      }
    }
    if (conversation.leadId) {
      links.push({ activityId: activity.id, entityType: "lead", entityId: conversation.leadId });
    }

    await (prismadb as any).crm_ActivityLinks.createMany({ data: links });

    await (prismadb as any).crm_Conversations.update({
      where: { id: conversation.id },
      data: { lastActivityAt: new Date() },
    });

    console.log("[voicemail] Activity created:", activity.id, "recording:", recordingUrl);
  } else {
    console.log("[voicemail] No conversation or no recording for:", from);
  }

  // End the call
  const twiml = new VoiceResponse();
  twiml.say({ voice: "Polly.Joanna" }, "Thank you. Goodbye.");
  twiml.hangup();

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
