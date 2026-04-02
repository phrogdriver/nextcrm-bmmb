"use server";
import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

export async function POST(request: Request) {
  const formData = await request.formData();
  const body = Object.fromEntries(formData.entries()) as Record<string, string>;

  console.log("[voice/status] Twilio params:", JSON.stringify(body));

  const callSid = body.CallSid;
  const from = body.From ?? body.Caller ?? "";
  const to = body.To ?? body.Called ?? "";
  const direction = body.Direction === "outbound-api" || from.startsWith("client:") ? "outbound" : "inbound";

  // Dial action URL sends DialCallStatus/DialCallDuration
  const dialStatus = body.DialCallStatus ?? body.CallStatus ?? "completed";
  const dialDuration = (body.DialCallDuration ?? body.CallDuration)
    ? parseInt(body.DialCallDuration ?? body.CallDuration, 10)
    : null;
  const recordingUrl = body.RecordingUrl ?? null;

  // Find the conversation by phone number
  const customerPhone = direction === "inbound" ? from : to;
  const conversation = await (prismadb as any).crm_Conversations.findFirst({
    where: {
      phoneNumber: customerPhone,
      status: "open",
      deletedAt: null,
    },
    orderBy: { lastActivityAt: "desc" },
  });

  console.log("[voice/status] Conversation:", conversation?.id, "direction:", direction, "status:", dialStatus, "duration:", dialDuration);

  if (conversation) {
    // Create an activity record for the call
    const activity = await (prismadb as any).crm_Activities.create({
      data: {
        type: "call",
        title: `${direction === "inbound" ? "Inbound" : "Outbound"} call — ${dialStatus}`,
        date: new Date(),
        duration: dialDuration,
        outcome: dialStatus,
        status: "completed",
        metadata: {
          direction,
          twilioCallSid: callSid,
          recordingUrl,
        },
      },
    });

    // Link to conversation + contact/lead
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

    // Update conversation timestamp
    await (prismadb as any).crm_Conversations.update({
      where: { id: conversation.id },
      data: { lastActivityAt: new Date() },
    });

    console.log("[voice/status] Activity created:", activity.id);
  } else {
    console.log("[voice/status] No conversation found for:", customerPhone);
  }

  // Return TwiML to end the call (Twilio expects this from action URLs)
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>',
    { headers: { "Content-Type": "text/xml" } }
  );
}
