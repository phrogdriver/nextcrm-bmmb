"use client";

import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TYPE_COLORS, TYPE_LABELS, STATUS_STYLES } from "./types";
import type { CalendarAppointment } from "./types";

interface AppointmentBlockProps {
  appointment: CalendarAppointment;
  /** "day" renders as a positioned time block, "week" renders as a compact card */
  variant: "day" | "week";
  /** For day mode: column start (hour offset from grid start) */
  colStart?: number;
  /** For day mode: column span (duration in hours) */
  colSpan?: number;
}

export function AppointmentBlock({
  appointment,
  variant,
  colStart,
  colSpan,
}: AppointmentBlockProps) {
  const colors = TYPE_COLORS[appointment.type ?? "OTHER"] ?? TYPE_COLORS.OTHER;
  const typeLabel = TYPE_LABELS[appointment.type ?? "OTHER"] ?? appointment.type ?? "Other";
  const startDate = new Date(appointment.start_date);
  const endDate = appointment.end_date ? new Date(appointment.end_date) : null;
  const jobLabel = appointment.job?.job_number
    ? `#${appointment.job.job_number}`
    : appointment.job?.name ?? "";

  const timeLabel = appointment.all_day
    ? "All day"
    : endDate
      ? `${format(startDate, "h:mm a")} – ${format(endDate, "h:mm a")}`
      : format(startDate, "h:mm a");

  const content = (
    <div
      className={cn(
        "rounded border-l-3 px-2 py-1 text-xs leading-tight cursor-default overflow-hidden",
        colors.bg,
        colors.border,
        "border-l-[3px]",
        variant === "day" && "h-full min-h-[28px] flex flex-col justify-center",
        variant === "week" && "mb-1"
      )}
      style={
        variant === "day" && colStart !== undefined && colSpan !== undefined
          ? { gridColumnStart: colStart, gridColumnEnd: colStart + colSpan }
          : undefined
      }
    >
      <div className={cn("font-semibold truncate", colors.text)}>
        {appointment.title}
      </div>
      {variant === "week" && (
        <div className="text-muted-foreground truncate">{timeLabel}</div>
      )}
      {jobLabel && (
        <div className="text-muted-foreground truncate">{jobLabel}</div>
      )}
    </div>
  );

  const tooltipContent = (
    <div className="space-y-1 text-xs max-w-64">
      <div className="font-semibold">{appointment.title}</div>
      <div>{typeLabel}</div>
      <div>{timeLabel}</div>
      {appointment.job && (
        <div>
          Job: {appointment.job.name ?? "—"}
          {appointment.job.job_number && ` (#${appointment.job.job_number})`}
        </div>
      )}
      {appointment.crew_name && <div>Crew: {appointment.crew_name}</div>}
      {appointment.assigned_user && (
        <div>Assigned: {appointment.assigned_user.name}</div>
      )}
      {appointment.notes && <div className="italic">{appointment.notes}</div>}
      <div
        className={cn(
          "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium border",
          STATUS_STYLES[appointment.status] ?? ""
        )}
      >
        {appointment.status}
      </div>
    </div>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {appointment.job ? (
            <Link href={`/crm/opportunities/${appointment.job.id}`}>
              {content}
            </Link>
          ) : (
            content
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
