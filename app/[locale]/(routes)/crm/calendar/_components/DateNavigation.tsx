"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "week";

interface DateNavigationProps {
  selectedDate: Date;
  viewMode: ViewMode;
  onDateChange: (direction: "prev" | "next" | "today") => void;
  onViewModeChange: (mode: ViewMode) => void;
  isPending: boolean;
}

export function DateNavigation({
  selectedDate,
  viewMode,
  onDateChange,
  onViewModeChange,
  isPending,
}: DateNavigationProps) {
  const dateLabel =
    viewMode === "day"
      ? format(selectedDate, "EEEE, MMMM d, yyyy")
      : `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d")} – ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d, yyyy")}`;

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDateChange("prev")}
          disabled={isPending}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDateChange("today")}
          disabled={isPending}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDateChange("next")}
          disabled={isPending}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className={cn("text-lg font-semibold ml-2", isPending && "opacity-50")}>
          {dateLabel}
        </h2>
      </div>

      <div className="flex items-center gap-1 rounded-lg border p-0.5">
        <Button
          variant={viewMode === "day" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("day")}
          disabled={isPending}
        >
          Day
        </Button>
        <Button
          variant={viewMode === "week" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("week")}
          disabled={isPending}
        >
          Week
        </Button>
      </div>
    </div>
  );
}
