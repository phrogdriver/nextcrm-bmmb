/**
 * One-time setup script for Twilio TaskRouter.
 *
 * Creates: Workspace, Activities, TaskQueue, Workflow, Workers (one per active user).
 * Stores worker SIDs on User records.
 *
 * Usage:
 *   npx tsx scripts/setup-taskrouter.ts
 *
 * Required env vars (already in .env.local):
 *   TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET
 *   NEXT_PUBLIC_APP_URL (for callback URLs)
 *
 * After running, add the printed env vars to .env.local:
 *   TWILIO_WORKSPACE_SID, TWILIO_WORKFLOW_SID
 */

import twilio from "twilio";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const apiKeySid = process.env.TWILIO_API_KEY_SID!;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET!;
const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
const databaseUrl = process.env.DATABASE_URL!;

if (!accountSid || !apiKeySid || !apiKeySecret || !appUrl || !databaseUrl) {
  console.error("Missing required env vars. Ensure .env.local has TWILIO_*, NEXT_PUBLIC_APP_URL, DATABASE_URL");
  process.exit(1);
}

const client = twilio(apiKeySid, apiKeySecret, { accountSid });
const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function findOrCreateActivity(
  ws: ReturnType<typeof client.taskrouter.v1.workspaces>,
  name: string,
  isAvailable: boolean,
) {
  const activities = await ws.activities.list();
  const existing = activities.find((a) => a.friendlyName === name);
  if (existing) return existing;
  return ws.activities.create({ friendlyName: name, available: isAvailable });
}

async function main() {
  // 1. Find or create Workspace
  console.log("Checking for existing workspace...");
  const workspaces = await client.taskrouter.v1.workspaces.list();
  let wsSid: string;
  if (workspaces.length > 0) {
    wsSid = workspaces[0].sid;
    console.log(`  Using existing workspace: ${wsSid}`);
    // Update callback URL
    await client.taskrouter.v1.workspaces(wsSid).update({
      eventCallbackUrl: `${appUrl}/api/twilio/taskrouter/events`,
    });
  } else {
    const workspace = await client.taskrouter.v1.workspaces.create({
      friendlyName: "BurgerMeister Contact Center",
      eventCallbackUrl: `${appUrl}/api/twilio/taskrouter/events`,
    });
    wsSid = workspace.sid;
    console.log(`  Created workspace: ${wsSid}`);
  }

  const ws = client.taskrouter.v1.workspaces(wsSid);

  // 2. Find or create Activities
  console.log("Setting up activities...");
  const available = await findOrCreateActivity(ws, "Available", true);
  const unavailable = await findOrCreateActivity(ws, "Unavailable", false);
  const offline = await findOrCreateActivity(ws, "Offline", false);
  const onCall = await findOrCreateActivity(ws, "On Call", false);
  console.log(`  Available: ${available.sid}`);
  console.log(`  Unavailable: ${unavailable.sid}`);
  console.log(`  Offline: ${offline.sid}`);
  console.log(`  On Call: ${onCall.sid}`);

  // 3. Create TaskQueues
  console.log("Creating task queues...");
  const defaultQueue = await ws.taskQueues.create({
    friendlyName: "Default",
    targetWorkers: "1==1", // all workers
    reservationActivitySid: onCall.sid,
    assignmentActivitySid: onCall.sid,
  });
  console.log(`  Default Queue: ${defaultQueue.sid}`);

  // 4. Create Workflow
  // Try default queue for 20s, then fall through to voicemail
  console.log("Creating workflow...");
  const workflowConfig = {
    task_routing: {
      filters: [
        {
          filter_friendly_name: "Default Routing",
          expression: "1==1",
          targets: [
            {
              queue: defaultQueue.sid,
              timeout: 20,
            },
          ],
        },
      ],
      default_filter: {
        queue: defaultQueue.sid,
        timeout: 20,
      },
    },
  };

  const workflow = await ws.workflows.create({
    friendlyName: "Inbound Call Routing",
    configuration: JSON.stringify(workflowConfig),
    assignmentCallbackUrl: `${appUrl}/api/twilio/taskrouter/assignment`,
    fallbackAssignmentCallbackUrl: `${appUrl}/api/twilio/taskrouter/assignment`,
    taskReservationTimeout: 20,
  });
  console.log(`  Workflow: ${workflow.sid}`);

  // 5. Create Workers for each active user
  console.log("Creating workers...");
  const users = await prisma.users.findMany({
    where: { userStatus: "ACTIVE" },
    select: { id: true, name: true, email: true, skills: true, twilioWorkerSid: true },
  });

  for (const user of users) {
    if (user.twilioWorkerSid) {
      console.log(`  Skipping ${user.name} — already has worker ${user.twilioWorkerSid}`);
      continue;
    }

    const identity = `agent-${user.id}`;
    const attributes = JSON.stringify({
      skills: user.skills || [],
      contact_uri: `client:${identity}`,
      user_id: user.id,
      name: user.name,
      email: user.email,
    });

    const worker = await ws.workers.create({
      friendlyName: user.name || user.email,
      attributes,
      activitySid: offline.sid, // start offline
    });

    await prisma.users.update({
      where: { id: user.id },
      data: { twilioWorkerSid: worker.sid },
    });

    console.log(`  ${user.name}: ${worker.sid} (identity: ${identity})`);
  }

  // Print env vars to add
  console.log("\n========================================");
  console.log("Add these to your .env.local:");
  console.log("========================================");
  console.log(`TWILIO_WORKSPACE_SID=${wsSid}`);
  console.log(`TWILIO_WORKFLOW_SID=${workflow.sid}`);
  console.log(`TWILIO_ACTIVITY_AVAILABLE=${available.sid}`);
  console.log(`TWILIO_ACTIVITY_UNAVAILABLE=${unavailable.sid}`);
  console.log(`TWILIO_ACTIVITY_OFFLINE=${offline.sid}`);
  console.log(`TWILIO_ACTIVITY_ON_CALL=${onCall.sid}`);
  console.log("========================================");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
