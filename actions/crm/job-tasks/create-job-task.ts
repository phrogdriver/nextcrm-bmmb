"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const createJobTask = async (data: {
  job_id: string;
  title: string;
  description?: string;
  priority?: string;
  due_date?: Date;
  assigned_to?: string;
  appointment_id?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const task = await (prismadb as any).crm_Job_Tasks.create({
      data: {
        ...data,
        createdBy: session.user.id,
      },
    });

    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return { data: task };
  } catch (error) {
    console.error("[CREATE_JOB_TASK]", error);
    return { error: "Failed to create task" };
  }
};
