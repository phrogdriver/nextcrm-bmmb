"use client";

import { useMemo } from "react";
import {
  format,
  getHours,
  getMinutes,
  startOfWeek,
  eachDayOfInterval,
  addDays,
  isSameDay,
  differenceInMinutes,
} from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AppointmentBlock } from "./AppointmentBlock";
import type { CalendarData, CalendarUser, CalendarAppointment } from "./types";

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 20;
const TOTAL_HOURS = DAY_END_HOUR - DAY_START_HOUR; // 14 columns

interface ScheduleGridProps {
  data: CalendarData;
  selectedDate: Date;
  viewMode: "day" | "week";
  isPending: boolean;
}

function getUserDisplayName(user: CalendarUser) {
  if (user.first_name || user.last_name) {
    return [user.first_name, user.last_name].filter(Boolean).join(" ");
  }
  return user.name ?? "Unknown";
}

function getUserInitials(user: CalendarUser) {
  const name = getUserDisplayName(user);
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Group appointments by assigned_to user id. Unassigned go under "unassigned". */
function groupByUser(appointments: CalendarAppointment[]) {
  const map = new Map<string, CalendarAppointment[]>();
  for (const appt of appointments) {
    const key = appt.assigned_to ?? "unassigned";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(appt);
  }
  return map;
}

/** Calculate grid column position for day mode. Returns { colStart, colSpan } (1-indexed for CSS grid). */
function getTimePosition(appt: CalendarAppointment) {
  const start = new Date(appt.start_date);
  const end = appt.end_date ? new Date(appt.end_date) : null;

  if (appt.all_day) {
    return { colStart: 1, colSpan: TOTAL_HOURS };
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

  // CSS grid columns are 1-indexed. Each hour = 2 half-hour slots.
  return {
    colStart: Math.floor(colStart * 2) + 1,
    colSpan: Math.max(Math.ceil(clampedSpan * 2), 1),
  };
}

// ─── Day Mode ────────────────────────────────────────────────────────────────

function DayGrid({
  data,
  isPending,
}: {
  data: CalendarData;
  isPending: boolean;
}) {
  const byUser = useMemo(() => groupByUser(data.appointments), [data.appointments]);

  // Build row list: users with appointments first, then users without, then unassigned
  const rows = useMemo(() => {
    const withAppts: { user: CalendarUser | null; appointments: CalendarAppointment[] }[] = [];
    const withoutAppts: { user: CalendarUser; appointments: CalendarAppointment[] }[] = [];

    for (const user of data.users) {
      const appts = byUser.get(user.id);
      if (appts && appts.length > 0) {
        withAppts.push({ user, appointments: appts });
      } else {
        withoutAppts.push({ user, appointments: [] });
      }
    }

    const unassigned = byUser.get("unassigned");
    const result = [...withAppts, ...withoutAppts];
    if (unassigned && unassigned.length > 0) {
      result.push({ user: null, appointments: unassigned });
    }

    return result;
  }, [data.users, byUser]);

  const hourLabels = Array.from({ length: TOTAL_HOURS }, (_, i) => {
    const hour = DAY_START_HOUR + i;
    const ampm = hour >= 12 ? "PM" : "AM";
    const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${h}${ampm}`;
  });

  // Grid has TOTAL_HOURS * 2 half-hour columns
  const totalCols = TOTAL_HOURS * 2;

  return (
    <div className={cn("overflow-x-auto", isPending && "opacity-50 pointer-events-none")}>
      <div className="min-w-[900px]">
        {/* Time header */}
        <div className="flex">
          <div className="w-40 shrink-0" />
          <div
            className="flex-1 grid"
            style={{ gridTemplateColumns: `repeat(${TOTAL_HOURS}, 1fr)` }}
          >
            {hourLabels.map((label) => (
              <div
                key={label}
                className="text-[10px] text-muted-foreground text-center border-l border-border py-1"
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* User rows */}
        {rows.map((row) => {
          const key = row.user?.id ?? "unassigned";
          return (
            <div key={key} className="flex border-t border-border">
              {/* User label */}
              <div className="w-40 shrink-0 flex items-center gap-2 px-3 py-2 border-r border-border">
                {row.user ? (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={row.user.avatar ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {getUserInitials(row.user)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium truncate">
                      {getUserDisplayName(row.user)}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Unassigned</span>
                )}
              </div>

              {/* Appointment blocks */}
              <div
                className="flex-1 grid relative min-h-[36px]"
                style={{ gridTemplateColumns: `repeat(${totalCols}, 1fr)` }}
              >
                {/* Grid lines at each hour */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={i}
                    className="border-l border-border"
                    style={{
                      gridColumnStart: i * 2 + 1,
                      gridColumnEnd: i * 2 + 1,
                      gridRow: 1,
                    }}
                  />
                ))}

                {/* Appointment blocks */}
                {row.appointments.map((appt) => {
                  const pos = getTimePosition(appt);
                  return (
                    <div
                      key={appt.id}
                      className="py-0.5"
                      style={{
                        gridColumnStart: pos.colStart,
                        gridColumnEnd: pos.colStart + pos.colSpan,
                        gridRow: 1,
                      }}
                    >
                      <AppointmentBlock
                        appointment={appt}
                        variant="day"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No appointments scheduled for this day.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Week Mode ───────────────────────────────────────────────────────────────

function WeekGrid({
  data,
  selectedDate,
  isPending,
}: {
  data: CalendarData;
  selectedDate: Date;
  isPending: boolean;
}) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  const byUser = useMemo(() => groupByUser(data.appointments), [data.appointments]);

  const rows = useMemo(() => {
    const withAppts: { user: CalendarUser | null; appointments: CalendarAppointment[] }[] = [];
    const withoutAppts: { user: CalendarUser; appointments: CalendarAppointment[] }[] = [];

    for (const user of data.users) {
      const appts = byUser.get(user.id);
      if (appts && appts.length > 0) {
        withAppts.push({ user, appointments: appts });
      } else {
        withoutAppts.push({ user, appointments: [] });
      }
    }

    const unassigned = byUser.get("unassigned");
    const result = [...withAppts, ...withoutAppts];
    if (unassigned && unassigned.length > 0) {
      result.push({ user: null, appointments: unassigned });
    }

    return result;
  }, [data.users, byUser]);

  return (
    <div className={cn("overflow-x-auto", isPending && "opacity-50 pointer-events-none")}>
      <div className="min-w-[800px]">
        {/* Day headers */}
        <div className="flex">
          <div className="w-40 shrink-0" />
          <div className="flex-1 grid grid-cols-7">
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "text-center text-xs font-medium py-2 border-l border-border",
                  isSameDay(day, new Date()) && "bg-primary/5"
                )}
              >
                <div className="text-muted-foreground">{format(day, "EEE")}</div>
                <div className={cn(
                  "text-sm",
                  isSameDay(day, new Date()) && "text-primary font-bold"
                )}>
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User rows */}
        {rows.map((row) => {
          const key = row.user?.id ?? "unassigned";
          return (
            <div key={key} className="flex border-t border-border">
              {/* User label */}
              <div className="w-40 shrink-0 flex items-center gap-2 px-3 py-2 border-r border-border">
                {row.user ? (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={row.user.avatar ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {getUserInitials(row.user)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium truncate">
                      {getUserDisplayName(row.user)}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Unassigned</span>
                )}
              </div>

              {/* Day cells */}
              <div className="flex-1 grid grid-cols-7">
                {days.map((day) => {
                  const dayAppts = row.appointments.filter((a) =>
                    isSameDay(new Date(a.start_date), day)
                  );
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "border-l border-border p-1 min-h-[48px]",
                        isSameDay(day, new Date()) && "bg-primary/5"
                      )}
                    >
                      {dayAppts.map((appt) => (
                        <AppointmentBlock
                          key={appt.id}
                          appointment={appt}
                          variant="week"
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No appointments scheduled for this week.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ScheduleGrid({ data, selectedDate, viewMode, isPending }: ScheduleGridProps) {
  if (viewMode === "day") {
    return <DayGrid data={data} isPending={isPending} />;
  }
  return <WeekGrid data={data} selectedDate={selectedDate} isPending={isPending} />;
}
