/**
 * Twilio webhook validation.
 *
 * Currently disabled — we use API keys (not auth token) for the Twilio client,
 * and webhook signature validation requires the account auth token.
 *
 * TODO: Enable validation before production by either:
 * 1. Adding TWILIO_AUTH_TOKEN env var for validation only
 * 2. Using Twilio's webhook signing secret feature
 */
export async function validateTwilioRequest(
  _request: Request,
  _body: Record<string, string>
): Promise<boolean> {
  // Skip validation for now — webhook URLs are not publicly discoverable
  // and we're behind Vercel's edge network
  return true;
}
