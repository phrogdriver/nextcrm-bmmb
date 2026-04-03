/**
 * Fix worker channel capacity for voice tasks.
 * Workers need capacity on the "voice" channel for TaskRouter to assign calls.
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

  // List all task channels
  const channels = await ws.taskChannels.list();
  console.log("Task Channels:");
  for (const ch of channels) {
    console.log(`  ${ch.friendlyName} (${ch.uniqueName}) — SID: ${ch.sid}`);
  }

  const voiceChannel = channels.find(c => c.uniqueName === "voice");
  if (!voiceChannel) {
    console.error("No 'voice' task channel found!");
    return;
  }

  // List all workers and set their voice channel capacity to 1
  const workers = await ws.workers.list();
  for (const worker of workers) {
    console.log(`\nWorker: ${worker.friendlyName} (${worker.sid})`);

    // List current channel capacities
    const workerChannels = await ws.workers(worker.sid).workerChannels.list();
    for (const wc of workerChannels) {
      console.log(`  Channel: ${wc.taskChannelUniqueName} — capacity: ${wc.configuredCapacity}, available: ${wc.available}`);
    }

    // Update voice channel capacity
    try {
      await ws.workers(worker.sid).workerChannels(voiceChannel.sid).update({
        capacity: 1,
        available: true,
      });
      console.log(`  ✓ Set voice channel capacity to 1`);
    } catch (err: any) {
      console.error(`  ✗ Failed to set voice capacity:`, err.message);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
