/**
 * Cancel any stuck wrapping/pending tasks that are blocking new reservations.
 */
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_API_KEY_SID!,
  process.env.TWILIO_API_KEY_SECRET!,
  { accountSid: process.env.TWILIO_ACCOUNT_SID! }
);

async function main() {
  const wsSid = process.env.TWILIO_WORKSPACE_SID!;
  const ws = client.taskrouter.v1.workspaces(wsSid);

  const tasks = await ws.tasks.list({ limit: 20 });
  console.log(`Found ${tasks.length} tasks`);

  for (const t of tasks) {
    console.log(`  ${t.sid}: status=${t.assignmentStatus}, age=${t.age}s, channel=${t.taskChannelUniqueName}`);

    if (t.assignmentStatus === "wrapping") {
      console.log(`    → Completing stuck wrapping task...`);
      await ws.tasks(t.sid).update({
        assignmentStatus: "completed",
        reason: "Cleanup: stuck wrapping task",
      });
      console.log(`    → Completed`);
    } else if (t.assignmentStatus === "pending" || t.assignmentStatus === "reserved") {
      console.log(`    → Canceling stuck task...`);
      await ws.tasks(t.sid).update({
        assignmentStatus: "canceled",
        reason: "Cleanup: stuck task blocking new reservations",
      });
      console.log(`    → Canceled`);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
