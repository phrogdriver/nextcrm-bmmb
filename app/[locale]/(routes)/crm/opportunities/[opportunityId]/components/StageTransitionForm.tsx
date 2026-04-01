"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { transitionJobStage } from "@/actions/crm/transition-job-stage";
import { toast } from "sonner";
import { type PipelineStage } from "@/actions/crm/get-job";

/**
 * Fields to prompt for based on the target stage name.
 * Each field has a label, type, and whether it's required.
 */
type FieldDef = {
  key: string;
  label: string;
  type: "date" | "text" | "textarea" | "select" | "number";
  required?: boolean;
  options?: { value: string; label: string }[];
};

function getFieldsForStage(stageName: string): FieldDef[] {
  const fields: FieldDef[] = [];

  switch (stageName) {
    case "Signed Agreement":
      fields.push(
        { key: "date_contract_signed", label: "Date Contract Signed", type: "date", required: true },
        {
          key: "payor_type",
          label: "Payor Type",
          type: "select",
          required: true,
          options: [
            { value: "INSURANCE", label: "Insurance" },
            { value: "CASH_RETAIL", label: "Cash / Retail" },
          ],
        }
      );
      break;

    case "Claim Filed":
      fields.push(
        { key: "insurance_company", label: "Insurance Company", type: "text", required: true },
        { key: "claim_number", label: "Claim Number", type: "text" },
        { key: "policy_number", label: "Policy Number", type: "text" },
        { key: "date_of_loss", label: "Date of Loss", type: "date" },
        { key: "date_claim_submitted", label: "Date Claim Submitted", type: "date", required: true }
      );
      break;

    case "Claim Approved":
      fields.push(
        { key: "date_claim_approved", label: "Date Claim Approved", type: "date", required: true },
        { key: "acv_deposit", label: "ACV Deposit Amount", type: "number" },
        { key: "deductible", label: "Deductible Amount", type: "number" }
      );
      break;

    case "Supplementing":
      fields.push(
        { key: "supplement_amount", label: "Supplement Amount", type: "number" }
      );
      break;

    case "Inspected":
      fields.push(
        { key: "date_inspected", label: "Date Inspected", type: "date", required: true }
      );
      break;

    case "Scheduled":
      fields.push(
        { key: "forecasted_build_date", label: "Build Date", type: "date", required: true },
        { key: "superintendent_id", label: "Superintendent (User ID)", type: "text" }
      );
      break;

    case "Work in Progress":
      fields.push(
        { key: "date_work_in_progress", label: "Production Start Date", type: "date", required: true }
      );
      break;

    case "Project Completed":
      fields.push(
        { key: "date_completed", label: "Completion Date", type: "date", required: true }
      );
      break;

    case "Depreciation Released":
      fields.push(
        { key: "date_depreciation_released", label: "Depreciation Released Date", type: "date", required: true }
      );
      break;

    case "Lost Deal":
      fields.push(
        { key: "lost_deal_reason", label: "Reason for Loss", type: "text", required: true },
        { key: "lost_deal_notes", label: "Additional Notes", type: "textarea" }
      );
      break;

    case "Follow Up After Appointment":
    case "Future Follow Up":
      fields.push(
        { key: "follow_up_date", label: "Follow Up Date", type: "date", required: true }
      );
      break;

    case "Closed PIF":
      fields.push(
        { key: "date_closed", label: "Close Date", type: "date", required: true }
      );
      break;
  }

  return fields;
}

interface StageTransitionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  targetStage: { id: string; name: string } | null;
  onTransitioned: () => void;
}

export function StageTransitionForm({
  open,
  onOpenChange,
  jobId,
  targetStage,
  onTransitioned,
}: StageTransitionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  if (!targetStage) return null;

  const fields = getFieldsForStage(targetStage.name);
  const hasFields = fields.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    for (const field of fields) {
      if (field.required && !formValues[field.key]) {
        toast.error(`${field.label} is required`);
        return;
      }
    }

    // Convert date strings and number strings to proper types
    const formData: Record<string, unknown> = {};
    for (const field of fields) {
      const val = formValues[field.key];
      if (!val) continue;
      if (field.type === "date") {
        formData[field.key] = new Date(val).toISOString();
      } else if (field.type === "number") {
        formData[field.key] = val;
      } else {
        formData[field.key] = val;
      }
    }

    startTransition(async () => {
      const result = await transitionJobStage({
        jobId,
        toStageId: targetStage.id,
        formData,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Moved to ${targetStage.name}`);
        setFormValues({});
        onOpenChange(false);
        onTransitioned();
      }
    });
  };

  const handleDirectTransition = () => {
    startTransition(async () => {
      const result = await transitionJobStage({
        jobId,
        toStageId: targetStage.id,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Moved to ${targetStage.name}`);
        onOpenChange(false);
        onTransitioned();
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Move to {targetStage.name}</SheetTitle>
          <SheetDescription>
            {hasFields
              ? "Fill in the required information to advance this job."
              : "Confirm this stage transition."}
          </SheetDescription>
        </SheetHeader>

        {hasFields ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>

                {field.type === "select" ? (
                  <Select
                    value={formValues[field.key] ?? ""}
                    onValueChange={(val) =>
                      setFormValues((prev) => ({ ...prev, [field.key]: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    value={formValues[field.key] ?? ""}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={field.type === "number" ? "number" : field.type}
                    step={field.type === "number" ? "0.01" : undefined}
                    value={formValues[field.key] ?? ""}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  />
                )}
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : `Move to ${targetStage.name}`}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              No additional information is needed for this transition.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleDirectTransition} disabled={isPending}>
                {isPending ? "Saving..." : "Confirm"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
