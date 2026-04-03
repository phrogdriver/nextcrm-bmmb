"use client";

import { ScheduleGrid } from "./ScheduleGrid";
import type { CalendarData } from "./types";

interface SalesGridProps {
  data: CalendarData;
  selectedDate: Date;
  viewMode: "day" | "week";
  isPending: boolean;
}

/**
 * Sales calendar — same grid as Company but data is pre-filtered
 * to PM + GM users by the server action.
 */
export function SalesGrid({ data, selectedDate, viewMode, isPending }: SalesGridProps) {
  return (
    <ScheduleGrid
      data={data}
      selectedDate={selectedDate}
      viewMode={viewMode}
      isPending={isPending}
    />
  );
}
