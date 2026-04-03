import { NextResponse } from "next/server";

/**
 * TaskRouter Event Callback
 *
 * Receives events like task.canceled, worker.activity.update, etc.
 * Used for logging and triggering side effects (e.g., voicemail on timeout).
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const body = Object.fromEntries(formData.entries()) as Record<string, string>;

  const eventType = body.EventType;
  console.log("[taskrouter/events]", eventType, JSON.stringify(body));

  // TODO: Handle specific events as needed
  // - task.canceled → no agent answered, voicemail was triggered
  // - worker.activity.update → log availability changes

  return NextResponse.json({ ok: true });
}
