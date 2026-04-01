"use client";

import { type PipelineStage } from "@/actions/crm/get-job";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const HIGH_LEVEL_STAGES = [
  "Lead",
  "Inspection",
  "Sales",
  "Pre-Production",
  "Production",
  "Post-Production",
  "Closed",
] as const;

const STAGE_COLORS: Record<string, string> = {
  Lead: "bg-blue-500",
  Inspection: "bg-indigo-500",
  Sales: "bg-violet-500",
  "Pre-Production": "bg-amber-500",
  Production: "bg-orange-500",
  "Post-Production": "bg-emerald-500",
  Closed: "bg-green-600",
};

interface StageProgressBarProps {
  stages: PipelineStage[];
  currentStageId: string | null;
  currentStageName: string | null;
  highLevelStage: string | null;
  isInsurance: boolean;
}

export function StageProgressBar({
  stages,
  currentStageId,
  currentStageName,
  highLevelStage,
  isInsurance,
}: StageProgressBarProps) {
  // Filter out insurance-only stages for cash customers
  const visibleStages = isInsurance
    ? stages
    : stages.filter((s) => !s.insurance_only);

  // Find current stage order for progress calculation
  const currentStage = visibleStages.find((s) => s.id === currentStageId);
  const currentOrder = currentStage ? Number(currentStage.order) : 0;

  // Group by high-level stage
  const grouped = HIGH_LEVEL_STAGES.map((hlStage) => {
    const stagesInGroup = visibleStages.filter(
      (s) => s.high_level_stage === hlStage && !s.is_terminal
    );
    const maxOrder = Math.max(...stagesInGroup.map((s) => Number(s.order)), 0);
    const minOrder = Math.min(...stagesInGroup.map((s) => Number(s.order)), Infinity);

    let status: "completed" | "current" | "upcoming" = "upcoming";
    if (highLevelStage === hlStage) {
      status = "current";
    } else if (currentOrder > maxOrder && stagesInGroup.length > 0) {
      status = "completed";
    } else if (currentOrder >= minOrder && currentOrder <= maxOrder) {
      status = "current";
    }

    return { name: hlStage, stages: stagesInGroup, status };
  }).filter((g) => g.stages.length > 0 || g.name === "Closed");

  return (
    <div className="w-full space-y-2">
      {/* High-level stage bar */}
      <div className="flex items-center gap-1">
        <TooltipProvider delayDuration={200}>
          {grouped.map((group, i) => (
            <Tooltip key={group.name}>
              <TooltipTrigger asChild>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "h-2 w-full rounded-full transition-all",
                      group.status === "completed"
                        ? STAGE_COLORS[group.name] ?? "bg-primary"
                        : group.status === "current"
                          ? cn(STAGE_COLORS[group.name] ?? "bg-primary", "animate-pulse")
                          : "bg-muted"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-medium leading-none hidden sm:block",
                      group.status === "upcoming"
                        ? "text-muted-foreground"
                        : "text-foreground"
                    )}
                  >
                    {group.name}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-semibold text-xs mb-1">{group.name}</p>
                <ul className="text-xs space-y-0.5">
                  {group.stages.map((s) => (
                    <li
                      key={s.id}
                      className={cn(
                        s.id === currentStageId && "font-bold text-primary"
                      )}
                    >
                      {s.id === currentStageId ? "→ " : "  "}
                      {s.name}
                    </li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      {/* Current stage label */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Current:{" "}
          <span className="font-medium text-foreground">
            {currentStageName ?? "Unknown"}
          </span>
        </span>
        {currentStage && (
          <span>{currentStage.probability}% probability</span>
        )}
      </div>
    </div>
  );
}
