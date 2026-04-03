import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import twilio from "twilio";

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
const ChatGrant = AccessToken.ChatGrant;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;
  const conversationsServiceSid = process.env.TWILIO_CONVERSATIONS_SERVICE_SID;

  if (!accountSid || !apiKeySid || !apiKeySecret) {
    return NextResponse.json({ error: "Twilio not configured" }, { status: 500 });
  }

  // Each user gets a unique identity so TaskRouter can route calls to them individually.
  // Falls back to "crm-agent" if user has no ID (shouldn't happen).
  const identity = `agent-${session.user.id}`;

  const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
    identity,
    ttl: 3600,
  });

  // Voice grant (for browser calling)
  if (twimlAppSid) {
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });
    token.addGrant(voiceGrant);
  }

  // Conversations grant (for real-time messaging)
  if (conversationsServiceSid) {
    const chatGrant = new ChatGrant({
      serviceSid: conversationsServiceSid,
    });
    token.addGrant(chatGrant);
  }

  return NextResponse.json({
    token: token.toJwt(),
    identity,
  });
}
