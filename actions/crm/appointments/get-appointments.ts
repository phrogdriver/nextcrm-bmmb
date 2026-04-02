"use server";
import { prismadb } from "@/lib/prisma";

/**
 * Get all appointments for a job, ordered by start_date.
 */
export const getAppointmentsByJob = async (jobId: string) => {
  const data = await (prismadb as any).crm_Appointments.findMany({
    where: { job_id: jobId, deletedAt: null },
    orderBy: { start_date: "asc" },
    include: {
      assigned_user: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });

  return data as Array<{
    id: string;
    job_id: string;
    title: string;
    type: string | null;
    status: string;
    start_date: Date;
    end_date: Date | null;
    all_day: boolean;
    location: string | null;
    assigned_to: string | null;
    crew_name: string | null;
    notes: string | null;
    createdAt: Date;
    assigned_user: { id: string; name: string | null; avatar: string | null } | null;
  }>;
};
