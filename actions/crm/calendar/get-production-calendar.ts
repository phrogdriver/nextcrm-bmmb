"use server";

import { prismadb } from "@/lib/prisma";

/**
 * Fetch jobs with scheduled POs and ALL appointments
 * for the production calendar view (jobs as rows).
 */
export const getProductionCalendarData = async (
  rangeStart: Date,
  rangeEnd: Date
) => {
  const [purchaseOrders, appointments] = await Promise.all([
    (prismadb as any).crm_Purchase_Orders.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ["CANCELLED", "COMPLETED"] },
        scheduled_date: { gte: rangeStart, lt: rangeEnd },
      },
      orderBy: { scheduled_date: "asc" },
      include: {
        job: {
          select: { id: true, name: true, job_number: true },
        },
        vendor: {
          select: { id: true, name: true, phone: true },
        },
      },
    }),
    (prismadb as any).crm_Appointments.findMany({
      where: {
        deletedAt: null,
        status: { not: "CANCELLED" },
        start_date: { gte: rangeStart, lt: rangeEnd },
      },
      orderBy: { start_date: "asc" },
      include: {
        job: {
          select: { id: true, name: true, job_number: true },
        },
        assigned_user: {
          select: { id: true, name: true, avatar: true, role: true },
        },
      },
    }),
  ]);

  // Collect unique jobs from both POs and appointments
  const jobMap = new Map<string, { id: string; name: string | null; job_number: string | null }>();
  for (const po of purchaseOrders) {
    if (po.job) jobMap.set(po.job.id, po.job);
  }
  for (const appt of appointments) {
    if (appt.job) jobMap.set(appt.job.id, appt.job);
  }

  const jobs = Array.from(jobMap.values()).sort((a, b) =>
    (a.job_number ?? "").localeCompare(b.job_number ?? "")
  );

  return { purchaseOrders, appointments, jobs };
};
