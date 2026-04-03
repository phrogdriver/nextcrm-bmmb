import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Proxy Twilio recording audio through our API so the browser
 * doesn't need Twilio credentials.
 *
 * Usage: /api/twilio/recording?url=https://api.twilio.com/...
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const recordingUrl = searchParams.get("url");

  if (!recordingUrl || !recordingUrl.includes("twilio.com")) {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const apiKeySid = process.env.TWILIO_API_KEY_SID!;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET!;

  // Fetch the recording from Twilio with auth
  const response = await fetch(recordingUrl, {
    headers: {
      Authorization: "Basic " + Buffer.from(`${apiKeySid}:${apiKeySecret}`).toString("base64"),
    },
  });

  if (!response.ok) {
    return new NextResponse("Failed to fetch recording", { status: response.status });
  }

  const audioBuffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") || "audio/wav";

  return new NextResponse(audioBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
