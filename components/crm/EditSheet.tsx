"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { toast } from "sonner";
import { updateOpportunityFields } from "@/actions/crm/opportunities/update-opportunity-fields";
import { useRouter } from "next/navigation";

export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "date" | "number" | "textarea" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
};

interface EditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  jobId: string;
  fields: FieldDef[];
  initialValues: Record<string, string>;
}

export function EditSheet({
  open,
  onOpenChange,
  title,
  jobId,
  fields,
  initialValues,
}: EditSheetProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build update payload — only send changed fields
    const changed: Record<string, unknown> = {};
    for (const field of fields) {
      const val = values[field.key] ?? "";
      const orig = initialValues[field.key] ?? "";
      if (val !== orig) {
        if (field.type === "date" && val) {
          changed[field.key] = new Date(val).toISOString();
        } else if (field.type === "number" && val) {
          changed[field.key] = val;
        } else {
          changed[field.key] = val || null;
        }
      }
    }

    if (Object.keys(changed).length === 0) {
      onOpenChange(false);
      return;
    }

    startTransition(async () => {
      const result = await updateOpportunityFields(jobId, changed);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Updated");
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.type === "select" ? (
                <Select
                  value={values[field.key] ?? ""}
                  onValueChange={(v) =>
                    setValues((prev) => ({ ...prev, [field.key]: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder ?? `Select...`} />
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
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  rows={3}
                />
              ) : (
                <Input
                  id={field.key}
                  type={field.type === "number" ? "number" : field.type}
                  step={field.type === "number" ? "0.01" : undefined}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
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
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
