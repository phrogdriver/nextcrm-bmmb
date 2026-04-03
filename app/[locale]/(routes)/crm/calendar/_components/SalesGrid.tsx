"use client";

import { ScheduleGrid } from "./ScheduleGrid";
import type { CalendarAppointment, CalendarData } from "./types";

interface SalesGridProps {
  data: CalendarData;
  selectedDate: Date;
  viewMode: "day" | "week";
  isPending: boolean;
  onAppointmentClick?: (appt: CalendarAppointment) => void;
}

/**
 * Sales calendar — same grid as Company but data is pre-filtered
 * to users taking leads by the server action.
 */
export function SalesGrid({ data, selectedDate, viewMode, isPending, onAppointmentClick }: SalesGridProps) {
  return (
    <ScheduleGrid
      data={data}
      selectedDate={selectedDate}
      viewMode={viewMode}
      isPending={isPending}
      onAppointmentClick={onAppointmentClick}
    />
  );
}
