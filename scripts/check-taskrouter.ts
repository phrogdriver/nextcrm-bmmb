import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_API_KEY_SID!,
  process.env.TWILIO_API_KEY_SECRET!,
  { accountSid: process.env.TWILIO_ACCOUNT_SID! }
);

async function main() {
  const wsSid = process.env.TWILIO_WORKSPACE_SID!;
  const wfSid = process.env.TWILIO_WORKFLOW_SID!;

  const wf = await client.taskrouter.v1.workspaces(wsSid).workflows(wfSid).fetch();
  console.log("Assignment URL:", wf.assignmentCallbackUrl);
  console.log("Fallback URL:", wf.fallbackAssignmentCallbackUrl);
  console.log("Timeout:", wf.taskReservationTimeout);
  console.log("Config:", wf.configuration);

  const workers = await client.taskrouter.v1.workspaces(wsSid).workers.list();
  for (const w of workers) {
    console.log(`Worker: ${w.friendlyName} | Activity: ${w.activityName} | SID: ${w.sid}`);
  }
}

main().catch(console.error);
