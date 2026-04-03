"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { twilioClient } from "@/lib/twilio/client";

export type AgentAvailability = "available" | "unavailable";

/**
 * Sets the agent's TaskRouter Worker activity (available/unavailable).
 * Called from the availability toggle in the UI.
 */
export async function setAvailability(status: AgentAvailability) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const workspaceSid = process.env.TWILIO_WORKSPACE_SID;
  if (!workspaceSid) return { error: "TaskRouter not configured" };

  const activitySid = status === "available"
    ? process.env.TWILIO_ACTIVITY_AVAILABLE
    : process.env.TWILIO_ACTIVITY_UNAVAILABLE;

  if (!activitySid) return { error: "Activity SIDs not configured" };

  const user = await prismadb.users.findUnique({
    where: { id: session.user.id },
    select: { twilioWorkerSid: true },
  });

  if (!user?.twilioWorkerSid) return { error: "No TaskRouter worker configured for this user" };

  try {
    await twilioClient.taskrouter.v1
      .workspaces(workspaceSid)
      .workers(user.twilioWorkerSid)
      .update({ activitySid });

    return { data: status };
  } catch (err) {
    console.error("Failed to set availability:", err);
    return { error: "Failed to update availability" };
  }
}

/**
 * Gets the current agent's TaskRouter Worker activity.
 */
export async function getAvailability(): Promise<AgentAvailability | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const workspaceSid = process.env.TWILIO_WORKSPACE_SID;
  if (!workspaceSid) return null;

  const user = await prismadb.users.findUnique({
    where: { id: session.user.id },
    select: { twilioWorkerSid: true },
  });

  if (!user?.twilioWorkerSid) return null;

  try {
    const worker = await twilioClient.taskrouter.v1
      .workspaces(workspaceSid)
      .workers(user.twilioWorkerSid)
      .fetch();

    const availableSid = process.env.TWILIO_ACTIVITY_AVAILABLE;
    return worker.activitySid === availableSid ? "available" : "unavailable";
  } catch {
    return null;
  }
}
