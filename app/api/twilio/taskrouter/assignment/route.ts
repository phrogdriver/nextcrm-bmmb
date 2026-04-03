import { NextResponse } from "next/server";

/**
 * TaskRouter Assignment Callback
 *
 * Called when TaskRouter reserves a worker for a task.
 * We respond with a "dequeue" instruction that tells Twilio
 * to connect the caller to this specific agent's browser client.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const body = Object.fromEntries(formData.entries()) as Record<string, string>;

  console.log("[taskrouter/assignment]", JSON.stringify(body));

  const workerAttributes = JSON.parse(body.WorkerAttributes || "{}");
  const taskAttributes = JSON.parse(body.TaskAttributes || "{}");
  const contactUri = workerAttributes.contact_uri; // "client:agent-<userId>"

  if (!contactUri) {
    // Reject if worker has no contact_uri — shouldn't happen
    return NextResponse.json({
      instruction: "reject",
      activity_sid: process.env.TWILIO_ACTIVITY_AVAILABLE,
    });
  }

  // Use "dequeue" to connect the queued call to this worker's browser
  return NextResponse.json({
    instruction: "dequeue",
    to: contactUri,
    from: taskAttributes.from || process.env.TWILIO_DEFAULT_NUMBER,
    post_work_activity_sid: process.env.TWILIO_ACTIVITY_AVAILABLE,
    timeout: 15,
  });
}
