"use client";

import { useMemo } from "react";
import {
  format,
  startOfWeek,
  eachDayOfInterval,
  addDays,
  isSameDay,
} from "date-fns";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { POBlock } from "./POBlock";
import { TOTAL_HOURS, getHourLabels } from "./grid-helpers";
import type { CrewCalendarData, CalendarVendor, CalendarPO } from "./types";

interface CrewGridProps {
  data: CrewCalendarData;
  selectedDate: Date;
  viewMode: "day" | "week";
  isPending: boolean;
}

function CrewDayGrid({ data, isPending }: { data: CrewCalendarData; isPending: boolean }) {
  const hourLabels = getHourLabels();
  const totalCols = TOTAL_HOURS * 2;

  const rows = useMemo(() => {
    const posByVendor = new Map<string, CalendarPO[]>();
    for (const po of data.purchaseOrders) {
      const key = po.vendor?.id ?? po.vendor_name;
      if (!posByVendor.has(key)) posByVendor.set(key, []);
      posByVendor.get(key)!.push(po);
    }

    const withPOs: { vendor: CalendarVendor; purchaseOrders: CalendarPO[] }[] = [];
    const withoutPOs: { vendor: CalendarVendor; purchaseOrders: CalendarPO[] }[] = [];

    for (const vendor of data.vendors) {
      const pos = posByVendor.get(vendor.id);
      if (pos && pos.length > 0) {
        withPOs.push({ vendor, purchaseOrders: pos });
      } else {
        withoutPOs.push({ vendor, purchaseOrders: [] });
      }
    }

    return [...withPOs, ...withoutPOs];
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

        {rows.map((row) => (
          <div key={row.vendor.id} className="flex border-t border-border">
            <div className="w-48 shrink-0 flex flex-col justify-center px-3 py-2 border-r border-border">
              <span className="text-xs font-semibold truncate">{row.vendor.name}</span>
              {row.vendor.phone && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="h-2.5 w-2.5" />
                  {row.vendor.phone}
                </span>
              )}
            </div>
            <div className="flex-1 grid relative min-h-[36px]" style={{ gridTemplateColumns: `repeat(${totalCols}, 1fr)` }}>
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div key={i} className="border-l border-border" style={{ gridColumnStart: i * 2 + 1, gridColumnEnd: i * 2 + 1, gridRow: 1 }} />
              ))}
              {/* POs span full day (date-only, no time) */}
              {row.purchaseOrders.map((po) => (
                <div key={po.id} className="py-0.5" style={{ gridColumnStart: 1, gridColumnEnd: totalCols + 1, gridRow: 1 }}>
                  <POBlock po={po} variant="day" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No crew work scheduled for this day.</div>
        )}
      </div>
    </div>
  );
}

function CrewWeekGrid({ data, selectedDate, isPending }: { data: CrewCalendarData; selectedDate: Date; isPending: boolean }) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  const rows = useMemo(() => {
    const posByVendor = new Map<string, CalendarPO[]>();
    for (const po of data.purchaseOrders) {
      const key = po.vendor?.id ?? po.vendor_name;
      if (!posByVendor.has(key)) posByVendor.set(key, []);
      posByVendor.get(key)!.push(po);
    }

    const withPOs: { vendor: CalendarVendor; purchaseOrders: CalendarPO[] }[] = [];
    const withoutPOs: { vendor: CalendarVendor; purchaseOrders: CalendarPO[] }[] = [];

    for (const vendor of data.vendors) {
      const pos = posByVendor.get(vendor.id);
      if (pos && pos.length > 0) {
        withPOs.push({ vendor, purchaseOrders: pos });
      } else {
        withoutPOs.push({ vendor, purchaseOrders: [] });
      }
    }

    return [...withPOs, ...withoutPOs];
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

        {rows.map((row) => (
          <div key={row.vendor.id} className="flex border-t border-border">
            <div className="w-48 shrink-0 flex flex-col justify-center px-3 py-2 border-r border-border">
              <span className="text-xs font-semibold truncate">{row.vendor.name}</span>
              {row.vendor.phone && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="h-2.5 w-2.5" />
                  {row.vendor.phone}
                </span>
              )}
            </div>
            <div className="flex-1 grid grid-cols-7">
              {days.map((day) => {
                const dayPOs = row.purchaseOrders.filter((po) => isSameDay(new Date(po.scheduled_date), day));
                return (
                  <div key={day.toISOString()} className={cn("border-l border-border p-1 min-h-[48px]", isSameDay(day, new Date()) && "bg-primary/5")}>
                    {dayPOs.map((po) => (
                      <POBlock key={po.id} po={po} variant="week" />
                    ))}
                    {dayPOs.length === 0 && (
                      <span className="text-[10px] text-green-600 dark:text-green-400">Available</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No subcontractor crews found.</div>
        )}
      </div>
    </div>
  );
}

export function CrewGrid({ data, selectedDate, viewMode, isPending }: CrewGridProps) {
  if (viewMode === "day") return <CrewDayGrid data={data} isPending={isPending} />;
  return <CrewWeekGrid data={data} selectedDate={selectedDate} isPending={isPending} />;
}
