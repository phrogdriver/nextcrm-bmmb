import { getHours, getMinutes, differenceInMinutes } from "date-fns";
import type { CalendarUser, CalendarAppointment } from "./types";

export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 20;
export const TOTAL_HOURS = DAY_END_HOUR - DAY_START_HOUR;

export function getUserDisplayName(user: CalendarUser) {
  if (user.first_name || user.last_name) {
    return [user.first_name, user.last_name].filter(Boolean).join(" ");
  }
  return user.name ?? "Unknown";
}

export function getUserInitials(user: CalendarUser) {
  const name = getUserDisplayName(user);
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function groupByUser(appointments: CalendarAppointment[]) {
  const map = new Map<string, CalendarAppointment[]>();
  for (const appt of appointments) {
    const key = appt.assigned_to ?? "unassigned";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(appt);
  }
  return map;
}

export function getTimePosition(appt: { start_date: string; end_date?: string | null; all_day?: boolean }) {
  const start = new Date(appt.start_date);
  const end = appt.end_date ? new Date(appt.end_date) : null;

  if (appt.all_day) {
    return { colStart: 1, colSpan: TOTAL_HOURS * 2 };
  }

  const startHour = getHours(start) + getMinutes(start) / 60;
  const clampedStart = Math.max(startHour, DAY_START_HOUR);

  let durationHours: number;
  if (end) {
    const mins = differenceInMinutes(end, start);
    durationHours = Math.max(mins / 60, 0.5);
  } else {
    durationHours = 1;
  }

  const colStart = Math.round((clampedStart - DAY_START_HOUR) * 2) / 2;
  const colSpan = Math.max(Math.round(durationHours * 2) / 2, 0.5);
  const clampedSpan = Math.min(colSpan, TOTAL_HOURS - colStart);

  return {
    colStart: Math.floor(colStart * 2) + 1,
    colSpan: Math.max(Math.ceil(clampedSpan * 2), 1),
  };
}

export function getHourLabels() {
  return Array.from({ length: TOTAL_HOURS }, (_, i) => {
    const hour = DAY_START_HOUR + i;
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${h}${ampm}`;
  });
}

/** Get time position for a PO (uses scheduled_date as start, assumes 1-hour block). */
export function getPOTimePosition(scheduledDate: string) {
  return getTimePosition({ start_date: scheduledDate, end_date: null, all_day: true });
}
