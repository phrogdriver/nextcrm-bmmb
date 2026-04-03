import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { twilioClient } from "@/lib/twilio/client";

/**
 * Adds the current user as a participant to a Twilio Conversation.
 * Called by the browser when the Conversations SDK gets "Forbidden"
 * trying to subscribe to a conversation.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationSid } = await request.json();
  if (!conversationSid) {
    return NextResponse.json({ error: "Missing conversationSid" }, { status: 400 });
  }

  const serviceSid = process.env.TWILIO_CONVERSATIONS_SERVICE_SID;
  if (!serviceSid) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    await twilioClient.conversations.v1
      .services(serviceSid)
      .conversations(conversationSid)
      .participants.create({ identity: `agent-${session.user.id}` });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // 50433 = participant already exists
    if (err?.code === 50433) {
      return NextResponse.json({ ok: true });
    }
    console.error("Failed to join conversation:", err);
    return NextResponse.json({ error: "Failed to join" }, { status: 500 });
  }
}
