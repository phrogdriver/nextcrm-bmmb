"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const updateJobTask = async (
  id: string,
  fields: Record<string, unknown>
) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const task = await (prismadb as any).crm_Job_Tasks.update({
      where: { id },
      data: fields,
    });

    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return { data: task };
  } catch (error) {
    console.error("[UPDATE_JOB_TASK]", error);
    return { error: "Failed to update task" };
  }
};

export const toggleJobTask = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const existing = await (prismadb as any).crm_Job_Tasks.findUnique({
      where: { id },
    });
    if (!existing) return { error: "Task not found" };

    const isDone = existing.status === "DONE";
    const task = await (prismadb as any).crm_Job_Tasks.update({
      where: { id },
      data: {
        status: isDone ? "OPEN" : "DONE",
        completed_at: isDone ? null : new Date(),
      },
    });

    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return { data: task };
  } catch (error) {
    console.error("[TOGGLE_JOB_TASK]", error);
    return { error: "Failed to toggle task" };
  }
};

export const deleteJobTask = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_Job_Tasks.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });

    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return { data: true };
  } catch (error) {
    console.error("[DELETE_JOB_TASK]", error);
    return { error: "Failed to delete task" };
  }
};
