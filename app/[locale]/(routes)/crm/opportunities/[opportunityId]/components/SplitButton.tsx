"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { type PipelineStage } from "@/actions/crm/get-job";

interface SplitButtonProps {
  currentStage: PipelineStage | null;
  stages: PipelineStage[];
  isInsurance: boolean;
  onTransition: (stageId: string, stageName: string) => void;
}

/**
 * Contextual action labels for specific stage transitions.
 * Maps "toStageName" to a verb-first label.
 */
const ACTION_LABELS: Record<string, string> = {
  "Job Details Confirmed": "Confirm Job Details",
  "Awaiting Rep Acceptance": "Assign to Rep",
  "Appointment Confirmed": "Confirm Appointment",
  "Reschedule Needed": "Reschedule Inspection",
  "Inspected": "Mark Inspected",
  "Follow Up After Appointment": "Schedule Follow Up",
  "Future Follow Up": "Set Future Follow Up",
  "Proposal Presented": "Mark Proposal Presented",
  "Signed Agreement": "Record Signed Agreement",
  "Claim Filed": "File Insurance Claim",
  "Waiting on Adjuster": "Request Adjuster",
  "Adjuster Appointment Complete": "Mark Adjuster Complete",
  "Waiting Claim": "Submit for Claim Review",
  "Claim Approved": "Mark Claim Approved",
  "Waiting Claim Summary": "Await Claim Summary",
  "Supplementing": "Begin Supplement",
  "Waiting Customer Deposit": "Request Deposit",
  "Investment": "Record Deposit Received",
  "Preparing Production Documents": "Prepare Prod Docs",
  "Stage 1 Review": "Submit for Review",
  "Stage 1 Rejected": "Reject Documents",
  "Additional Items Required": "Request Additional Items",
  "Job Ready for Production": "Mark Ready for Production",
  "Scheduled": "Schedule Build",
  "On Hold": "Put On Hold",
  "Work in Progress": "Start Production",
  "Project Completed": "Mark Build Complete",
  "Post Build Supplement": "File Post-Build Supplement",
  "Depreciation Submitted": "Submit Depreciation",
  "Waiting on Depreciation": "Await Depreciation",
  "Depreciation Released": "Record Depreciation Released",
  "Sales Final Visit": "Schedule Final Visit",
  "Awaiting Final Payment": "Request Final Payment",
  "Ready for Final Email": "Send Final Email",
  "Ready for Commission and Final Checklist": "Run Final Checklist",
  "Closed PIF": "Close — Paid in Full",
  "Lost Deal": "Mark as Lost",
  "Exit": "Exit Pipeline",
};

function getLabel(stageName: string): string {
  return ACTION_LABELS[stageName] ?? `Move to ${stageName}`;
}

export function SplitButton({
  currentStage,
  stages,
  isInsurance,
  onTransition,
}: SplitButtonProps) {
  if (!currentStage) return null;

  // Determine allowed next stages
  const allowedIds = currentStage.allowed_next_stages as string[] | null;

  let nextStages: PipelineStage[];
  if (allowedIds && allowedIds.length > 0) {
    nextStages = allowedIds
      .map((id) => stages.find((s) => s.id === id))
      .filter((s): s is PipelineStage => s != null);
  } else {
    // Default: next by order + terminal stages
    const currentOrder = Number(currentStage.order);
    const candidates = stages
      .filter((s) => Number(s.order) > currentOrder && !s.is_terminal)
      .filter((s) => isInsurance || !s.insurance_only)
      .slice(0, 3);
    const terminals = stages.filter(
      (s) => s.is_terminal && s.name !== "Exit"
    );
    nextStages = [...candidates, ...terminals];
  }

  if (nextStages.length === 0) return null;

  const primary = nextStages[0];
  const alternatives = nextStages.slice(1);

  return (
    <div className="flex items-center">
      <Button
        size="sm"
        className="rounded-r-none"
        onClick={() => onTransition(primary.id, primary.name)}
      >
        {getLabel(primary.name)}
      </Button>
      {alternatives.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="rounded-l-none border-l border-l-primary-foreground/20 px-2">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {alternatives.map((stage) => (
              <DropdownMenuItem
                key={stage.id}
                onClick={() => onTransition(stage.id, stage.name)}
                className={stage.is_terminal ? "text-destructive" : undefined}
              >
                {stage.is_terminal && (
                  <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                )}
                {getLabel(stage.name)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
