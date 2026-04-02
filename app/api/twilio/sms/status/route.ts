import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { validateTwilioRequest } from "@/lib/twilio/validate";

export async function POST(request: Request) {
  const formData = await request.formData();
  const body = Object.fromEntries(formData.entries()) as Record<string, string>;

  const isValid = await validateTwilioRequest(request, body);
  if (!isValid && process.env.NODE_ENV === "production") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const messageSid = body.MessageSid;
  const messageStatus = body.MessageStatus; // sent, delivered, failed, undelivered

  if (!messageSid) {
    return new NextResponse("Missing MessageSid", { status: 400 });
  }

  // Update the message status
  const message = await (prismadb as any).crm_Messages.findUnique({
    where: { twilioMessageSid: messageSid },
  });

  if (message) {
    await (prismadb as any).crm_Messages.update({
      where: { id: message.id },
      data: { twilioStatus: messageStatus },
    });
  }

  return new NextResponse("OK", { status: 200 });
}
