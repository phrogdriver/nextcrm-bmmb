"use client";

import { useMemo } from "react";
import {
  format,
  startOfWeek,
  eachDayOfInterval,
  addDays,
  isSameDay,
} from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AppointmentBlock } from "./AppointmentBlock";
import { POBlock } from "./POBlock";
import { TOTAL_HOURS, getHourLabels } from "./grid-helpers";
import type { ProductionCalendarData, CalendarJob, CalendarPO, CalendarAppointment } from "./types";

interface ProductionGridProps {
  data: ProductionCalendarData;
  selectedDate: Date;
  viewMode: "day" | "week";
  isPending: boolean;
  onAppointmentClick?: (appt: CalendarAppointment) => void;
}

function ProductionDayGrid({ data, isPending, onAppointmentClick }: { data: ProductionCalendarData; isPending: boolean; onAppointmentClick?: (appt: CalendarAppointment) => void }) {
  const hourLabels = getHourLabels();
  const totalCols = TOTAL_HOURS * 2;

  // Group POs and appointments by job_id
  const rows = useMemo(() => {
    const posByJob = new Map<string, CalendarPO[]>();
    for (const po of data.purchaseOrders) {
      const key = po.job_id;
      if (!posByJob.has(key)) posByJob.set(key, []);
      posByJob.get(key)!.push(po);
    }

    const apptsByJob = new Map<string, CalendarAppointment[]>();
    for (const appt of data.appointments) {
      const key = appt.job_id;
      if (!apptsByJob.has(key)) apptsByJob.set(key, []);
      apptsByJob.get(key)!.push(appt);
    }

    return data.jobs.map((job) => ({
      job,
      purchaseOrders: posByJob.get(job.id) ?? [],
      appointments: apptsByJob.get(job.id) ?? [],
    }));
  }, [data]);

  return (
    <div className={cn("overflow-x-auto", isPending && "opacity-50 pointer-events-none")}>
      <div className="min-w-[900px]">
        <div className="flex">
          <div className="w-48 shrink-0" />
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${TOTAL_HOURS}, 1fr)` }}>
            {hourLabels.map((label) => (
              <div key={label} className="text-[10px] text-muted-foreground text-center border-l border-border py-1">
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-border">
          {rows.map((row) => (
            <div key={row.job.id} className="flex border-t border-border">
              <div className="w-48 shrink-0 flex flex-col justify-center px-3 py-2 border-r border-border">
                <Link href={`/crm/opportunities/${row.job.id}`} className="hover:underline">
                  <span className="text-xs font-semibold truncate block">
                    {row.job.job_number ? `#${row.job.job_number}` : "—"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate block">
                    {row.job.name ?? "Untitled Job"}
                  </span>
                </Link>
              </div>
              <div className="flex-1 grid relative min-h-[36px]" style={{ gridTemplateColumns: `repeat(${totalCols}, 1fr)` }}>
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div key={i} className="border-l border-border" style={{ gridColumnStart: i * 2 + 1, gridColumnEnd: i * 2 + 1, gridRow: 1 }} />
                ))}
                {row.purchaseOrders.map((po) => (
                  <div key={po.id} className="py-0.5" style={{ gridColumnStart: 1, gridColumnEnd: totalCols + 1, gridRow: 1 }}>
                    <POBlock po={po} variant="day" />
                  </div>
                ))}
                {row.appointments.map((appt) => {
                  const start = new Date(appt.start_date);
                  const end = appt.end_date ? new Date(appt.end_date) : null;
                  const startHour = start.getHours() + start.getMinutes() / 60;
                  const clampedStart = Math.max(startHour, 6);
                  const duration = end ? Math.max((end.getTime() - start.getTime()) / 3600000, 0.5) : 1;
                  const colStart = Math.floor((clampedStart - 6) * 2) + 1;
                  const colSpan = Math.max(Math.ceil(duration * 2), 1);
                  return (
                    <div key={appt.id} className="py-0.5" style={{ gridColumnStart: colStart, gridColumnEnd: colStart + colSpan, gridRow: 2 }}>
                      <AppointmentBlock appointment={appt} variant="day" onClick={onAppointmentClick} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {rows.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No production items scheduled for this day.</div>
        )}
      </div>
    </div>
  );
}

function ProductionWeekGrid({ data, selectedDate, isPending, onAppointmentClick }: { data: ProductionCalendarData; selectedDate: Date; isPending: boolean; onAppointmentClick?: (appt: CalendarAppointment) => void }) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  const rows = useMemo(() => {
    const posByJob = new Map<string, CalendarPO[]>();
    for (const po of data.purchaseOrders) {
      if (!posByJob.has(po.job_id)) posByJob.set(po.job_id, []);
      posByJob.get(po.job_id)!.push(po);
    }

    const apptsByJob = new Map<string, CalendarAppointment[]>();
    for (const appt of data.appointments) {
      if (!apptsByJob.has(appt.job_id)) apptsByJob.set(appt.job_id, []);
      apptsByJob.get(appt.job_id)!.push(appt);
    }

    return data.jobs.map((job) => ({
      job,
      purchaseOrders: posByJob.get(job.id) ?? [],
      appointments: apptsByJob.get(job.id) ?? [],
    }));
  }, [data]);

  return (
    <div className={cn("overflow-x-auto", isPending && "opacity-50 pointer-events-none")}>
      <div className="min-w-[800px]">
        <div className="flex">
          <div className="w-48 shrink-0" />
          <div className="flex-1 grid grid-cols-7">
            {days.map((day) => (
              <div key={day.toISOString()} className={cn("text-center text-xs font-medium py-2 border-l border-border", isSameDay(day, new Date()) && "bg-primary/5")}>
                <div className="text-muted-foreground">{format(day, "EEE")}</div>
                <div className={cn("text-sm", isSameDay(day, new Date()) && "text-primary font-bold")}>{format(day, "d")}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-border">
          {rows.map((row) => (
            <div key={row.job.id} className="flex border-t border-border">
              <div className="w-48 shrink-0 flex flex-col justify-center px-3 py-2 border-r border-border">
                <Link href={`/crm/opportunities/${row.job.id}`} className="hover:underline">
                  <span className="text-xs font-semibold truncate block">
                    {row.job.job_number ? `#${row.job.job_number}` : "—"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate block">
                    {row.job.name ?? "Untitled Job"}
                  </span>
                </Link>
              </div>
              <div className="flex-1 grid grid-cols-7">
                {days.map((day) => {
                  const dayPOs = row.purchaseOrders.filter((po) => isSameDay(new Date(po.scheduled_date), day));
                  const dayAppts = row.appointments.filter((a) => isSameDay(new Date(a.start_date), day));
                  return (
                    <div key={day.toISOString()} className={cn("border-l border-border p-1 min-h-[48px]", isSameDay(day, new Date()) && "bg-primary/5")}>
                      {dayPOs.map((po) => (
                        <POBlock key={po.id} po={po} variant="week" />
                      ))}
                      {dayAppts.map((appt) => (
                        <AppointmentBlock key={appt.id} appointment={appt} variant="week" onClick={onAppointmentClick} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {rows.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No production items scheduled for this week.</div>
        )}
      </div>
    </div>
  );
}

export function ProductionGrid({ data, selectedDate, viewMode, isPending, onAppointmentClick }: ProductionGridProps) {
  if (viewMode === "day") return <ProductionDayGrid data={data} isPending={isPending} onAppointmentClick={onAppointmentClick} />;
  return <ProductionWeekGrid data={data} selectedDate={selectedDate} isPending={isPending} onAppointmentClick={onAppointmentClick} />;
}
