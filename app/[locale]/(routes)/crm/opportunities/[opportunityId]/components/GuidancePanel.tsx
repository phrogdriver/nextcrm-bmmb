"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type StageGuidance } from "@/lib/pipeline/stage-guidance";

interface GuidancePanelProps {
  stageName: string;
  guidance: StageGuidance | null;
}

export function GuidancePanel({ stageName, guidance }: GuidancePanelProps) {
  const [open, setOpen] = useState(true);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  if (!guidance) return null;

  const toggleChecked = (i: number) => {
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const checklist = guidance.checklist ?? [];
  const completedCount = Object.values(checked).filter(Boolean).length;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader
        className="cursor-pointer select-none py-3 px-4"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">
              {guidance.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {checklist.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {completedCount}/{checklist.length}
              </span>
            )}
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="px-4 pb-4 pt-0 space-y-3">
          {/* Markdown text (rendered as plain paragraphs) */}
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {guidance.text}
          </div>

          {/* Checklist */}
          {checklist.length > 0 && (
            <ul className="space-y-1.5">
              {checklist.map((item, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="flex items-start gap-2 text-left text-sm w-full hover:bg-accent/50 rounded px-1 py-0.5 transition-colors"
                    onClick={() => toggleChecked(i)}
                  >
                    {checked[i] ? (
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <span
                      className={cn(
                        checked[i] && "line-through text-muted-foreground"
                      )}
                    >
                      {item}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
}
