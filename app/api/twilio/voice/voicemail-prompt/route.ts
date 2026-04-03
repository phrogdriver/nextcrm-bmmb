import { NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * Voicemail prompt — played when the call is redirected here after
 * TaskRouter workflow timeout (no agent available).
 * Plays the voicemail message and records.
 */
export async function POST() {
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
