"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  title: string;
  icon: LucideIcon;
  summary?: ReactNode;
  defaultOpen?: boolean;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function CollapsibleCard({
  title,
  icon: Icon,
  summary,
  defaultOpen = false,
  actions,
  className,
  children,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={cn(className)}>
      <div
        className="flex items-center justify-between py-3 px-4 cursor-pointer select-none transition-colors hover:bg-muted/50"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!open && summary && (
            <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
              {summary}
            </span>
          )}
          {open && actions && (
            <div onClick={(e) => e.stopPropagation()}>{actions}</div>
          )}
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {open && (
        <CardContent className="px-4 pb-4 pt-0">{children}</CardContent>
      )}
    </Card>
  );
}
