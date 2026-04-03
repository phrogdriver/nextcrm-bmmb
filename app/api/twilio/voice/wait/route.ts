import { NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * Queue wait URL — played to the caller while TaskRouter finds an available agent.
 * After the message, plays hold music on loop.
 * If no agent is found (workflow timeout), Enqueue ends and the next TwiML verb
 * in the parent (voicemail Record) executes.
 */
export async function POST() {
  const twiml = new VoiceResponse();

  twiml.say(
    { voice: "Polly.Joanna" },
    "Thank you for calling Integrity Roofing. Please hold while we connect you with the next available representative."
  );
  twiml.play({ loop: 0 }, "http://com.twilio.sounds.music.s3.amazonaws.com/ClockworkWaltz.mp3");

  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
