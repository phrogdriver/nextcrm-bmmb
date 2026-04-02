"use server";
import { prismadb } from "@/lib/prisma";

export type JobTask = {
  id: string;
  job_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: Date | null;
  completed_at: Date | null;
  assigned_to: string | null;
  appointment_id: string | null;
  createdAt: Date;
  assigned_user: { id: string; name: string | null } | null;
  appointment: { id: string; title: string; start_date: Date } | null;
};

export const getJobTasks = async (jobId: string): Promise<JobTask[]> => {
  try {
    const data = await (prismadb as any).crm_Job_Tasks.findMany({
      where: { job_id: jobId, deletedAt: null },
      orderBy: [{ status: "asc" }, { due_date: "asc" }],
      include: {
        assigned_user: {
          select: { id: true, name: true },
        },
        appointment: {
          select: { id: true, title: true, start_date: true },
        },
      },
    });
    return data as JobTask[];
  } catch (error) {
    console.error("getJobTasks error:", error);
    return [];
  }
};
