"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Save, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { updateAppointment, deleteAppointment } from "@/actions/crm/appointments/update-appointment";
import { getTypeColors, TYPE_LABELS, STATUS_STYLES, APPOINTMENT_CATEGORY } from "./types";
import type { CalendarAppointment, CalendarUser } from "./types";

const TYPES = [
  { value: "INSPECTION", label: "Inspection" },
  { value: "ADJUSTER", label: "Adjuster Visit" },
  { value: "SALES_VISIT", label: "Sales Visit" },
  { value: "PRE_CONSTRUCTION", label: "Pre-Construction" },
  { value: "BUILD", label: "Build Check" },
  { value: "WORK_ORDER", label: "Work Order" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "FINAL_WALKTHROUGH", label: "Final Walkthrough" },
  { value: "WARRANTY", label: "Warranty" },
  { value: "OTHER", label: "Other" },
];

const STATUSES = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

interface AppointmentSheetProps {
  appointment: CalendarAppointment | null;
  users: CalendarUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toLocalDatetime(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AppointmentSheet({ appointment, users, open, onOpenChange }: AppointmentSheetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    title: appointment?.title ?? "",
    type: appointment?.type ?? "OTHER",
    status: appointment?.status ?? "SCHEDULED",
    start_date: toLocalDatetime(appointment?.start_date ?? null),
    end_date: toLocalDatetime(appointment?.end_date ?? null),
    assigned_to: appointment?.assigned_to ?? "none",
    crew_name: appointment?.crew_name ?? "",
    notes: appointment?.notes ?? "",
  });

  // Reset form when appointment changes
  if (appointment && form.title !== appointment.title && form.start_date !== toLocalDatetime(appointment.start_date)) {
    setForm({
      title: appointment.title,
      type: appointment.type ?? "OTHER",
      status: appointment.status,
      start_date: toLocalDatetime(appointment.start_date),
      end_date: toLocalDatetime(appointment.end_date ?? null),
      assigned_to: appointment.assigned_to ?? "",
      crew_name: appointment.crew_name ?? "",
      notes: appointment.notes ?? "",
    });
  }

  if (!appointment) return null;

  const colors = getTypeColors(appointment.type);
  const category = APPOINTMENT_CATEGORY[appointment.type ?? "OTHER"] ?? "other";

  const handleSave = () => {
    if (!form.title || !form.start_date) {
      toast.error("Title and start date are required");
      return;
    }

    startTransition(async () => {
      const result = await updateAppointment(appointment.id, {
        title: form.title,
        type: form.type,
        status: form.status,
        start_date: new Date(form.start_date),
        end_date: form.end_date ? new Date(form.end_date) : null,
        assigned_to: form.assigned_to && form.assigned_to !== "none" ? form.assigned_to : null,
        crew_name: form.crew_name || null,
        notes: form.notes || null,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Appointment updated");
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAppointment(appointment.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Appointment deleted");
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Edit Appointment
            <Badge
              variant="outline"
              className={cn("text-[10px]", colors.bg, colors.border, colors.text)}
            >
              {category === "meeting" ? "Meeting" : category === "work" ? "Work Order" : category === "delivery" ? "Delivery" : "Other"}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Job link */}
          {appointment.job && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Job:</span>
              <Link
                href={`/crm/opportunities/${appointment.job.id}`}
                className="font-medium hover:underline flex items-center gap-1"
              >
                {appointment.job.name ?? "—"}
                {appointment.job.job_number && ` (#${appointment.job.job_number})`}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}

          <Separator />

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start <span className="text-destructive">*</span></Label>
              <Input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Assigned To */}
          <div className="space-y-1.5">
            <Label>Assigned To</Label>
            <Select value={form.assigned_to} onValueChange={(v) => setForm((p) => ({ ...p, assigned_to: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.first_name || u.last_name
                      ? [u.first_name, u.last_name].filter(Boolean).join(" ")
                      : u.name ?? u.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Crew */}
          <div className="space-y-1.5">
            <Label>Crew Name</Label>
            <Input
              value={form.crew_name}
              onChange={(e) => setForm((p) => ({ ...p, crew_name: e.target.value }))}
              placeholder="Peak Roofing — Carlos Mendez"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any special instructions..."
            />
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive" disabled={isPending}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete appointment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will soft-delete &quot;{appointment.title}&quot;. It can be restored later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button onClick={handleSave} disabled={isPending || !form.title || !form.start_date}>
              <Save className="h-4 w-4 mr-2" />
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
