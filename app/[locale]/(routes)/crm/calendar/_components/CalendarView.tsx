"use client";

import { useState, useTransition, useCallback } from "react";
import {
  startOfDay,
  addDays,
  subDays,
  startOfWeek,
  addWeeks,
  subWeeks,
} from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getCalendarData } from "@/actions/crm/calendar/get-calendar-data";
import { getSalesCalendarData } from "@/actions/crm/calendar/get-sales-calendar";
import { getProductionCalendarData } from "@/actions/crm/calendar/get-production-calendar";
import { getCrewCalendarData } from "@/actions/crm/calendar/get-crew-calendar";
import { DateNavigation } from "./DateNavigation";
import { ScheduleGrid } from "./ScheduleGrid";
import { SalesGrid } from "./SalesGrid";
import { ProductionGrid } from "./ProductionGrid";
import type {
  CalendarData,
  CalendarTab,
  ProductionCalendarData,
} from "./types";

type ViewMode = "day" | "week";

interface CalendarViewProps {
  initialData: CalendarData;
  initialDate: string;
}

function getDateRange(date: Date, mode: ViewMode) {
  if (mode === "day") {
    const rangeStart = startOfDay(date);
    return { rangeStart, rangeEnd: addDays(rangeStart, 1) };
  }
  const rangeStart = startOfWeek(date, { weekStartsOn: 1 });
  return { rangeStart, rangeEnd: addDays(rangeStart, 7) };
}

export function CalendarView({ initialData, initialDate }: CalendarViewProps) {
  const [activeTab, setActiveTab] = useState<CalendarTab>("company");
  const [selectedDate, setSelectedDate] = useState(new Date(initialDate));
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [isPending, startTransition] = useTransition();

  // Per-tab data
  const [companyData, setCompanyData] = useState<CalendarData>(initialData);
  const [salesData, setSalesData] = useState<CalendarData | null>(null);
  const [productionData, setProductionData] = useState<ProductionCalendarData | null>(null);
  const [crewData, setCrewData] = useState<CalendarData | null>(null);

  const fetchTabData = useCallback(
    (tab: CalendarTab, date: Date, mode: ViewMode) => {
      startTransition(async () => {
        const { rangeStart, rangeEnd } = getDateRange(date, mode);

        switch (tab) {
          case "company": {
            const result = await getCalendarData(rangeStart, rangeEnd);
            setCompanyData(result);
            break;
          }
          case "sales": {
            const result = await getSalesCalendarData(rangeStart, rangeEnd);
            setSalesData(result);
            break;
          }
          case "production": {
            const result = await getProductionCalendarData(rangeStart, rangeEnd);
            setProductionData(result);
            break;
          }
          case "crews": {
            const result = await getCrewCalendarData(rangeStart, rangeEnd);
            setCrewData(result);
            break;
          }
        }
      });
    },
    []
  );

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
    fetchTabData(activeTab, newDate, viewMode);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    fetchTabData(activeTab, selectedDate, mode);
  };

  const handleTabChange = (tab: string) => {
    const newTab = tab as CalendarTab;
    setActiveTab(newTab);
    fetchTabData(newTab, selectedDate, viewMode);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="crews">Crews</TabsTrigger>
          </TabsList>
        </Tabs>
        <DateNavigation
          selectedDate={selectedDate}
          viewMode={viewMode}
          onDateChange={handleDateChange}
          onViewModeChange={handleViewModeChange}
          isPending={isPending}
        />
      </div>

      {activeTab === "company" && (
        <ScheduleGrid
          data={companyData}
          selectedDate={selectedDate}
          viewMode={viewMode}
          isPending={isPending}
        />
      )}

      {activeTab === "sales" && salesData && (
        <SalesGrid
          data={salesData}
          selectedDate={selectedDate}
          viewMode={viewMode}
          isPending={isPending}
        />
      )}

      {activeTab === "production" && productionData && (
        <ProductionGrid
          data={productionData}
          selectedDate={selectedDate}
          viewMode={viewMode}
          isPending={isPending}
        />
      )}

      {activeTab === "crews" && crewData && (
        <ScheduleGrid
          data={crewData}
          selectedDate={selectedDate}
          viewMode={viewMode}
          isPending={isPending}
        />
      )}
    </div>
  );
}
