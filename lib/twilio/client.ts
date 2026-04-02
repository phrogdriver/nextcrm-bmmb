import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const apiKeySid = process.env.TWILIO_API_KEY_SID!;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET!;

export const twilioClient = twilio(apiKeySid, apiKeySecret, { accountSid });

export const TWILIO_DEFAULT_NUMBER = process.env.TWILIO_DEFAULT_NUMBER!;
export const TWILIO_TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID!;
