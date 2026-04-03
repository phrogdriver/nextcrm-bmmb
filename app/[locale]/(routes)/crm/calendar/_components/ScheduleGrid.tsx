"use client";

import { useMemo } from "react";
import {
  format,
  startOfWeek,
  eachDayOfInterval,
  addDays,
  isSameDay,
} from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AppointmentBlock } from "./AppointmentBlock";
import {
  DAY_START_HOUR,
  TOTAL_HOURS,
  getUserDisplayName,
  getUserInitials,
  groupByUser,
  getTimePosition,
  getHourLabels,
} from "./grid-helpers";
import type { CalendarData, CalendarUser, CalendarAppointment } from "./types";

interface ScheduleGridProps {
  data: CalendarData;
  selectedDate: Date;
  viewMode: "day" | "week";
  isPending: boolean;
}

function DayGrid({ data, isPending }: { data: CalendarData; isPending: boolean }) {
  const byUser = useMemo(() => groupByUser(data.appointments), [data.appointments]);
  const totalCols = TOTAL_HOURS * 2;
  const hourLabels = getHourLabels();

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
      <div className="min-w-[900px]">
        <div className="flex">
          <div className="w-40 shrink-0" />
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${TOTAL_HOURS}, 1fr)` }}>
            {hourLabels.map((label) => (
              <div key={label} className="text-[10px] text-muted-foreground text-center border-l border-border py-1">
                {label}
              </div>
            ))}
          </div>
        </div>

        {rows.map((row) => (
          <div key={row.user?.id ?? "unassigned"} className="flex border-t border-border">
            <div className="w-40 shrink-0 flex items-center gap-2 px-3 py-2 border-r border-border">
              {row.user ? (
                <>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={row.user.avatar ?? undefined} />
                    <AvatarFallback className="text-[10px]">{getUserInitials(row.user)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium truncate">{getUserDisplayName(row.user)}</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground italic">Unassigned</span>
              )}
            </div>
            <div className="flex-1 grid relative min-h-[36px]" style={{ gridTemplateColumns: `repeat(${totalCols}, 1fr)` }}>
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div key={i} className="border-l border-border" style={{ gridColumnStart: i * 2 + 1, gridColumnEnd: i * 2 + 1, gridRow: 1 }} />
              ))}
              {row.appointments.map((appt) => {
                const pos = getTimePosition(appt);
                return (
                  <div key={appt.id} className="py-0.5" style={{ gridColumnStart: pos.colStart, gridColumnEnd: pos.colStart + pos.colSpan, gridRow: 1 }}>
                    <AppointmentBlock appointment={appt} variant="day" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No appointments scheduled for this day.</div>
        )}
      </div>
    </div>
  );
}

function WeekGrid({ data, selectedDate, isPending }: { data: CalendarData; selectedDate: Date; isPending: boolean }) {
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
        <div className="flex">
          <div className="w-40 shrink-0" />
          <div className="flex-1 grid grid-cols-7">
            {days.map((day) => (
              <div key={day.toISOString()} className={cn("text-center text-xs font-medium py-2 border-l border-border", isSameDay(day, new Date()) && "bg-primary/5")}>
                <div className="text-muted-foreground">{format(day, "EEE")}</div>
                <div className={cn("text-sm", isSameDay(day, new Date()) && "text-primary font-bold")}>{format(day, "d")}</div>
              </div>
            ))}
          </div>
        </div>

        {rows.map((row) => (
          <div key={row.user?.id ?? "unassigned"} className="flex border-t border-border">
            <div className="w-40 shrink-0 flex items-center gap-2 px-3 py-2 border-r border-border">
              {row.user ? (
                <>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={row.user.avatar ?? undefined} />
                    <AvatarFallback className="text-[10px]">{getUserInitials(row.user)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium truncate">{getUserDisplayName(row.user)}</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground italic">Unassigned</span>
              )}
            </div>
            <div className="flex-1 grid grid-cols-7">
              {days.map((day) => {
                const dayAppts = row.appointments.filter((a) => isSameDay(new Date(a.start_date), day));
                return (
                  <div key={day.toISOString()} className={cn("border-l border-border p-1 min-h-[48px]", isSameDay(day, new Date()) && "bg-primary/5")}>
                    {dayAppts.map((appt) => (
                      <AppointmentBlock key={appt.id} appointment={appt} variant="week" />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No appointments scheduled for this week.</div>
        )}
      </div>
    </div>
  );
}

export function ScheduleGrid({ data, selectedDate, viewMode, isPending }: ScheduleGridProps) {
  if (viewMode === "day") return <DayGrid data={data} isPending={isPending} />;
  return <WeekGrid data={data} selectedDate={selectedDate} isPending={isPending} />;
}
