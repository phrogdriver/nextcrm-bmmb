import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { validateTwilioRequest } from "@/lib/twilio/validate";

export async function POST(request: Request) {
  const formData = await request.formData();
  const body = Object.fromEntries(formData.entries()) as Record<string, string>;

  const isValid = await validateTwilioRequest(request, body);
  if (!isValid && process.env.NODE_ENV === "production") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const callSid = body.CallSid;
  const callStatus = body.CallStatus; // completed, no-answer, busy, failed, canceled
  const callDuration = body.CallDuration ? parseInt(body.CallDuration, 10) : null;
  const recordingUrl = body.RecordingUrl ?? null;

  if (!callSid) {
    return new NextResponse("Missing CallSid", { status: 400 });
  }

  // Update the conversation with final call status
  const conversation = await (prismadb as any).crm_Conversations.findFirst({
    where: { twilioCallSid: callSid },
  });

  if (conversation) {
    await (prismadb as any).crm_Conversations.update({
      where: { id: conversation.id },
      data: {
        twilioCallStatus: callStatus,
        callDuration,
        twilioRecordingUrl: recordingUrl,
        lastActivityAt: new Date(),
      },
    });

    // Auto-create an activity record for the completed call
    if (callStatus === "completed" || callStatus === "no-answer" || callStatus === "busy") {
      const activity = await (prismadb as any).crm_Activities.create({
        data: {
          type: "call",
          title: `${conversation.callDirection === "inbound" ? "Inbound" : "Outbound"} call — ${callStatus}`,
          date: new Date(),
          duration: callDuration,
          outcome: callStatus,
          status: "completed",
          metadata: {
            direction: conversation.callDirection,
            twilioCallSid: callSid,
            recordingUrl,
          },
        },
      });

      // Link to conversation + contact/lead
      const links = [
        { activityId: activity.id, entityType: "conversation", entityId: conversation.id },
      ];
      if (conversation.contactId) {
        links.push({ activityId: activity.id, entityType: "contact", entityId: conversation.contactId });
      }
      if (conversation.leadId) {
        links.push({ activityId: activity.id, entityType: "lead", entityId: conversation.leadId });
      }

      await (prismadb as any).crm_ActivityLinks.createMany({ data: links });
    }
  }

  // Return valid TwiML — Twilio may call this as an action URL
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>',
    { headers: { "Content-Type": "text/xml" } }
  );
}
