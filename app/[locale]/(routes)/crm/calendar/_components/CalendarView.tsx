"use client";

import { useState, useTransition } from "react";
import {
  startOfDay,
  addDays,
  subDays,
  startOfWeek,
  addWeeks,
  subWeeks,
} from "date-fns";
import { getCalendarData } from "@/actions/crm/calendar/get-calendar-data";
import { DateNavigation } from "./DateNavigation";
import { ScheduleGrid } from "./ScheduleGrid";
import type { CalendarData } from "./types";

type ViewMode = "day" | "week";

interface CalendarViewProps {
  initialData: CalendarData;
  initialDate: string;
}

export function CalendarView({ initialData, initialDate }: CalendarViewProps) {
  const [data, setData] = useState<CalendarData>(initialData);
  const [selectedDate, setSelectedDate] = useState(new Date(initialDate));
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [isPending, startTransition] = useTransition();

  const fetchData = (date: Date, mode: ViewMode) => {
    startTransition(async () => {
      let rangeStart: Date;
      let rangeEnd: Date;

      if (mode === "day") {
        rangeStart = startOfDay(date);
        rangeEnd = addDays(rangeStart, 1);
      } else {
        rangeStart = startOfWeek(date, { weekStartsOn: 1 });
        rangeEnd = addDays(rangeStart, 7);
      }

      const result = await getCalendarData(rangeStart, rangeEnd);
      setData(result);
    });
  };

  const handleDateChange = (direction: "prev" | "next" | "today") => {
    let newDate: Date;

    if (direction === "today") {
      newDate = startOfDay(new Date());
    } else if (viewMode === "day") {
      newDate = direction === "prev" ? subDays(selectedDate, 1) : addDays(selectedDate, 1);
    } else {
      newDate = direction === "prev" ? subWeeks(selectedDate, 1) : addWeeks(selectedDate, 1);
    }

    setSelectedDate(newDate);
    fetchData(newDate, viewMode);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    fetchData(selectedDate, mode);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <DateNavigation
        selectedDate={selectedDate}
        viewMode={viewMode}
        onDateChange={handleDateChange}
        onViewModeChange={handleViewModeChange}
        isPending={isPending}
      />
      <ScheduleGrid
        data={data}
        selectedDate={selectedDate}
        viewMode={viewMode}
        isPending={isPending}
      />
    </div>
  );
}
