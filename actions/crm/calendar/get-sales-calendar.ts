"use server";

import { prismadb } from "@/lib/prisma";

/**
 * Fetch users taking leads and their appointments for the sales availability view.
 */
export const getSalesCalendarData = async (
  rangeStart: Date,
  rangeEnd: Date
) => {
  const users = await (prismadb as any).users.findMany({
    where: {
      userStatus: "ACTIVE",
      takingLeads: true,
    },
    select: {
      id: true,
      name: true,
      first_name: true,
      last_name: true,
      avatar: true,
      role: true,
    },
    orderBy: { name: "asc" },
  });

  const userIds = users.map((u: { id: string }) => u.id);

  const appointments = await (prismadb as any).crm_Appointments.findMany({
    where: {
      deletedAt: null,
      status: { not: "CANCELLED" },
      start_date: { gte: rangeStart, lt: rangeEnd },
      assigned_to: { in: userIds },
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
  });

  return { users, appointments };
};
