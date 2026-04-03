import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_API_KEY_SID!,
  process.env.TWILIO_API_KEY_SECRET!,
  { accountSid: process.env.TWILIO_ACCOUNT_SID! }
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
if (!APP_URL) {
  console.error("NEXT_PUBLIC_APP_URL not set");
  process.exit(1);
}
console.log("Using APP_URL:", APP_URL);

async function main() {
  const wsSid = process.env.TWILIO_WORKSPACE_SID!;
  const wfSid = process.env.TWILIO_WORKFLOW_SID!;

  // Update workspace event URL
  await client.taskrouter.v1.workspaces(wsSid).update({
    eventCallbackUrl: `${APP_URL}/api/twilio/taskrouter/events`,
  });
  console.log("Workspace event URL updated");

  // Update workflow assignment URL
  await client.taskrouter.v1.workspaces(wsSid).workflows(wfSid).update({
    assignmentCallbackUrl: `${APP_URL}/api/twilio/taskrouter/assignment`,
    fallbackAssignmentCallbackUrl: `${APP_URL}/api/twilio/taskrouter/assignment`,
  });
  console.log("Workflow assignment URLs updated");

  console.log("Done — all URLs now point to", APP_URL);
}

main().catch(console.error);
