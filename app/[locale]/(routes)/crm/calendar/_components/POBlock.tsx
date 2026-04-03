"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PO_CATEGORY_COLORS, PO_STATUS_STYLES } from "./types";
import type { CalendarPO } from "./types";

interface POBlockProps {
  po: CalendarPO;
  variant: "day" | "week";
}

export function POBlock({ po, variant }: POBlockProps) {
  const colors = PO_CATEGORY_COLORS[po.category ?? "other"] ?? PO_CATEGORY_COLORS.other;
  const jobLabel = po.job?.job_number
    ? `#${po.job.job_number}`
    : po.job?.name ?? "";

  const content = (
    <div
      className={cn(
        "rounded border-l-[3px] px-2 py-1 text-xs leading-tight cursor-default overflow-hidden",
        colors.bg,
        colors.border,
        variant === "day" && "h-full min-h-[28px] flex flex-col justify-center",
        variant === "week" && "mb-1"
      )}
    >
      <div className={cn("font-semibold truncate", colors.text)}>
        {po.po_number ?? po.vendor_name}
      </div>
      {variant === "week" && (
        <div className="text-muted-foreground truncate">
          {po.category ?? "other"}
        </div>
      )}
      {po.amount && (
        <div className="text-muted-foreground truncate font-mono">
          ${Number(po.amount).toLocaleString()}
        </div>
      )}
      {jobLabel && (
        <div className="text-muted-foreground truncate">{jobLabel}</div>
      )}
    </div>
  );

  const tooltipContent = (
    <div className="space-y-1 text-xs max-w-64">
      {po.po_number && <div className="font-semibold font-mono">{po.po_number}</div>}
      <div className="font-semibold">{po.vendor_name}</div>
      {po.description && <div>{po.description}</div>}
      <div>Category: {po.category ?? "other"}</div>
      {po.amount && <div className="font-mono">Amount: ${Number(po.amount).toLocaleString()}</div>}
      {po.job && (
        <div>
          Job: {po.job.name ?? "—"}
          {po.job.job_number && ` (#${po.job.job_number})`}
        </div>
      )}
      {po.vendor?.phone && <div>Phone: {po.vendor.phone}</div>}
      <div
        className={cn(
          "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium border",
          PO_STATUS_STYLES[po.status] ?? ""
        )}
      >
        {po.status}
      </div>
    </div>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {po.job ? (
            <Link href={`/crm/opportunities/${po.job.id}`}>
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
