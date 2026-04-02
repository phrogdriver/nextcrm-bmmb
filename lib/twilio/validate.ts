import twilio from "twilio";
import { headers } from "next/headers";

export async function validateTwilioRequest(
  request: Request,
  body: Record<string, string>
): Promise<boolean> {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const headersList = await headers();
  const signature = headersList.get("x-twilio-signature") ?? "";
  const url = request.url;

  return twilio.validateRequest(authToken, signature, url, body);
}
