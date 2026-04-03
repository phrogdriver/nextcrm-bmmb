import { NextResponse } from "next/server";
import { twilioClient } from "@/lib/twilio/client";

/**
 * TaskRouter Event Callback
 *
 * Key event: workflow.timeout — no agent answered within the workflow timeout.
 * We redirect the caller to voicemail by updating the call via REST API,
 * because <Enqueue> doesn't automatically end when TaskRouter times out.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const body = Object.fromEntries(formData.entries()) as Record<string, string>;

  const eventType = body.EventType;
  console.log("[taskrouter/events]", eventType);

  if (eventType === "workflow.timeout") {
    // Task timed out — no agent was available. Redirect caller to voicemail.
    const taskAttributes = JSON.parse(body.TaskAttributes || "{}");
    const callSid = taskAttributes.call_sid;

    if (callSid) {
      try {
        const voicemailUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice/voicemail-prompt`;
        await twilioClient.calls(callSid).update({
          url: voicemailUrl,
          method: "POST",
        });
        console.log("[taskrouter/events] Redirected call to voicemail:", callSid);
      } catch (err) {
        console.error("[taskrouter/events] Failed to redirect to voicemail:", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
