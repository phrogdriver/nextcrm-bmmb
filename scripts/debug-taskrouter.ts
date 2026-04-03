/**
 * Debug TaskRouter — show all config to find why reservations aren't created.
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

  // Workspace
  const workspace = await ws.fetch();
  console.log("=== Workspace ===");
  console.log("  Default Activity:", workspace.defaultActivityName, workspace.defaultActivitySid);
  console.log("  Timeout Activity:", workspace.timeoutActivityName, workspace.timeoutActivitySid);
  console.log("  Multi-task:", workspace.multiTaskEnabled);
  console.log("  Prioritize Queue Order:", workspace.prioritizeQueueOrder);

  // Activities
  console.log("\n=== Activities ===");
  const activities = await ws.activities.list();
  for (const a of activities) {
    console.log(`  ${a.friendlyName}: available=${a.available}, SID=${a.sid}`);
  }

  // TaskQueues
  console.log("\n=== TaskQueues ===");
  const queues = await ws.taskQueues.list();
  for (const q of queues) {
    console.log(`  ${q.friendlyName}:`);
    console.log(`    targetWorkers: ${q.targetWorkers}`);
    console.log(`    maxReservedWorkers: ${q.maxReservedWorkers}`);
    console.log(`    reservationActivity: ${q.reservationActivitySid}`);
    console.log(`    assignmentActivity: ${q.assignmentActivitySid}`);
    console.log(`    SID: ${q.sid}`);
  }

  // Workflows
  console.log("\n=== Workflows ===");
  const workflows = await ws.workflows.list();
  for (const wf of workflows) {
    console.log(`  ${wf.friendlyName}:`);
    console.log(`    timeout: ${wf.taskReservationTimeout}`);
    console.log(`    assignment URL: ${wf.assignmentCallbackUrl}`);
    console.log(`    config: ${wf.configuration}`);
  }

  // Workers
  console.log("\n=== Workers ===");
  const workers = await ws.workers.list();
  for (const w of workers) {
    console.log(`  ${w.friendlyName}:`);
    console.log(`    activity: ${w.activityName} (${w.activitySid})`);
    console.log(`    attributes: ${w.attributes}`);
    console.log(`    available: ${w.available}`);
    console.log(`    SID: ${w.sid}`);

    const channels = await ws.workers(w.sid).workerChannels.list();
    for (const ch of channels) {
      console.log(`    channel ${ch.taskChannelUniqueName}: capacity=${ch.configuredCapacity}, available=${ch.available}`);
    }
  }

  // Recent tasks
  console.log("\n=== Recent Tasks ===");
  const tasks = await ws.tasks.list({ limit: 3, ordering: "DateCreated:desc" });
  for (const t of tasks) {
    console.log(`  Task ${t.sid}:`);
    console.log(`    status: ${t.assignmentStatus}`);
    console.log(`    channel: ${t.taskChannelUniqueName}`);
    console.log(`    age: ${t.age}s`);
    console.log(`    reason: ${t.reason}`);
  }
}

main().catch(console.error);
