"use server";

import { prismadb } from "@/lib/prisma";

/**
 * Fetch all active users and non-cancelled appointments for a date range.
 * Used by the company calendar grid view.
 */
export const getCalendarData = async (
  rangeStart: Date,
  rangeEnd: Date
) => {
  const [users, appointments] = await Promise.all([
    (prismadb as any).users.findMany({
      where: { userStatus: "ACTIVE" },
      select: {
        id: true,
        name: true,
        first_name: true,
        last_name: true,
        avatar: true,
        role: true,
      },
      orderBy: { name: "asc" },
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

  return { users, appointments };
};
