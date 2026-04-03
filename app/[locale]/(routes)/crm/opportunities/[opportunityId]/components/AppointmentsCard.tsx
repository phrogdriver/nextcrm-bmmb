"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Users, CheckCircle2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import { format, isPast, isToday } from "date-fns";
import { createAppointment } from "@/actions/crm/appointments/create-appointment";
import { toast } from "sonner";

export type Appointment = {
  id: string;
  job_id: string;
  title: string;
  type: string | null;
  status: string;
  start_date: Date | string;
  end_date: Date | string | null;
  all_day: boolean;
  location: string | null;
  assigned_to: string | null;
  crew_name: string | null;
  notes: string | null;
  createdAt: Date | string;
  assigned_user: { id: string; name: string | null; avatar: string | null } | null;
};

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-amber-50 border-amber-200 text-amber-600",
  DISPATCHED: "bg-blue-50 border-blue-200 text-blue-600",
  IN_PROGRESS: "bg-violet-50 border-violet-200 text-violet-600",
  COMPLETED: "bg-green-50 border-green-200 text-green-600",
  CANCELLED: "bg-red-50 border-red-200 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  DISPATCHED: "Dispatched",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

interface AppointmentsCardProps {
  jobId: string;
  appointments: Appointment[];
}

export function AppointmentsCard({ jobId, appointments }: AppointmentsCardProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formValues, setFormValues] = useState({
    title: "",
    type: "",
    start_date: "",
    end_date: "",
    crew_name: "",
    notes: "",
  });

  const handleCreate = () => {
    if (!formValues.title || !formValues.start_date || !formValues.type) {
      toast.error("Title, type, and start date are required");
      return;
    }

    startTransition(async () => {
      const result = await createAppointment({
        job_id: jobId,
        title: formValues.title,
        type: formValues.type,
        start_date: new Date(formValues.start_date),
        end_date: formValues.end_date ? new Date(formValues.end_date) : undefined,
        crew_name: formValues.crew_name || undefined,
        notes: formValues.notes || undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Appointment scheduled");
        setCreating(false);
        setFormValues({ title: "", type: "", start_date: "", end_date: "", crew_name: "", notes: "" });
        router.refresh();
      }
    });
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Appointments</span>
            {appointments.length > 0 && (
              <Badge variant="secondary" className="text-[11px]">
                {appointments.length}
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Schedule
          </Button>
        </div>
        <CardContent className="px-4 pb-4 pt-0">
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No appointments scheduled. Click Schedule to add one.
            </p>
          ) : (
            <div className="space-y-0">
              {appointments.map((appt) => {
                const startDate = new Date(appt.start_date);
                const past = appt.status === "COMPLETED" || appt.status === "CANCELLED" || isPast(startDate);

                const calendarDate = format(startDate, "yyyy-MM-dd");
                return (
                  <Link
                    key={appt.id}
                    href={`/crm/calendar?date=${calendarDate}`}
                    className={cn(
                      "flex items-start gap-3 py-3 border-b last:border-b-0 hover:bg-muted/50 rounded -mx-1 px-1 transition-colors cursor-pointer",
                      past && appt.status !== "IN_PROGRESS" && "opacity-50"
                    )}
                  >
                    {/* Date block */}
                    <div
                      className={cn(
                        "w-11 text-center rounded-md py-1 border shrink-0",
                        past && appt.status !== "IN_PROGRESS"
                          ? "bg-muted"
                          : "bg-primary border-primary"
                      )}
                    >
                      <div
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-wider leading-none",
                          past && appt.status !== "IN_PROGRESS" ? "text-muted-foreground" : "text-primary-foreground"
                        )}
                      >
                        {format(startDate, "MMM").toUpperCase()}
                      </div>
                      <div
                        className={cn(
                          "text-lg font-bold leading-tight",
                          past && appt.status !== "IN_PROGRESS" ? "text-foreground" : "text-primary-foreground"
                        )}
                      >
                        {format(startDate, "d")}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{appt.title}</span>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", STATUS_STYLES[appt.status] ?? "")}
                        >
                          {STATUS_LABELS[appt.status] ?? appt.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {appt.all_day
                          ? "All day"
                          : format(startDate, "h:mm a")}
                        {appt.end_date && ` – ${format(new Date(appt.end_date), "h:mm a")}`}
                      </div>
                      {(appt.assigned_user || appt.crew_name) && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-primary">
                          <Users className="h-2.5 w-2.5" />
                          {appt.crew_name
                            ? `${appt.crew_name}${appt.assigned_user ? ` — ${appt.assigned_user.name}` : ""}`
                            : appt.assigned_user?.name}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Appointment Sheet */}
      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Schedule Appointment</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                value={formValues.title}
                onChange={(e) => setFormValues((p) => ({ ...p, title: e.target.value }))}
                placeholder="Inspection, Build Day, Final Walkthrough..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={formValues.type}
                onValueChange={(v) => setFormValues((p) => ({ ...p, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSPECTION">Inspection</SelectItem>
                  <SelectItem value="ADJUSTER">Adjuster Visit</SelectItem>
                  <SelectItem value="SALES_VISIT">Sales Visit</SelectItem>
                  <SelectItem value="PRE_CONSTRUCTION">Pre-Construction</SelectItem>
                  <SelectItem value="BUILD">Build Day</SelectItem>
                  <SelectItem value="DELIVERY">Delivery</SelectItem>
                  <SelectItem value="FINAL_WALKTHROUGH">Final Walkthrough</SelectItem>
                  <SelectItem value="WARRANTY">Warranty</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start <span className="text-destructive">*</span></Label>
                <Input
                  type="datetime-local"
                  value={formValues.start_date}
                  onChange={(e) => setFormValues((p) => ({ ...p, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input
                  type="datetime-local"
                  value={formValues.end_date}
                  onChange={(e) => setFormValues((p) => ({ ...p, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Crew / Assigned To</Label>
              <Input
                value={formValues.crew_name}
                onChange={(e) => setFormValues((p) => ({ ...p, crew_name: e.target.value }))}
                placeholder="Peak Roofing — Carlos Mendez"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input
                value={formValues.notes}
                onChange={(e) => setFormValues((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Any special instructions..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreating(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isPending || !formValues.title || !formValues.start_date}>
                {isPending ? "Scheduling..." : "Schedule"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
