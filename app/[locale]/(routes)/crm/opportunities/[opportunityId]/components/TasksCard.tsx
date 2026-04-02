"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, ListChecks, Plus, Calendar, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";
import { type JobTask } from "@/actions/crm/job-tasks/get-job-tasks";
import { createJobTask } from "@/actions/crm/job-tasks/create-job-task";
import { toggleJobTask } from "@/actions/crm/job-tasks/update-job-task";
import { toast } from "sonner";
import { type Appointment } from "./AppointmentsCard";

interface TasksCardProps {
  jobId: string;
  tasks: JobTask[];
  appointments?: Appointment[];
}

export function TasksCard({ jobId, tasks, appointments = [] }: TasksCardProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    priority: "NORMAL",
    due_date: "",
    appointment_id: "",
  });

  const openCount = tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED").length;

  const handleToggle = (taskId: string) => {
    startTransition(async () => {
      const result = await toggleJobTask(taskId);
      if (result.error) toast.error(result.error);
      else router.refresh();
    });
  };

  const handleCreate = () => {
    if (!formValues.title.trim()) {
      toast.error("Title is required");
      return;
    }

    startTransition(async () => {
      const result = await createJobTask({
        job_id: jobId,
        title: formValues.title.trim(),
        description: formValues.description.trim() || undefined,
        priority: formValues.priority,
        due_date: formValues.due_date ? new Date(formValues.due_date) : undefined,
        appointment_id: formValues.appointment_id || undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Task added");
        setCreating(false);
        setFormValues({ title: "", description: "", priority: "NORMAL", due_date: "", appointment_id: "" });
        router.refresh();
      }
    });
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Tasks</span>
            {tasks.length > 0 && (
              <Badge variant="secondary" className="text-[11px]">
                {openCount} open
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add task
          </Button>
        </div>
        <CardContent className="px-4 pb-4 pt-0">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No tasks yet. Click Add task to create one.
            </p>
          ) : (
            <div className="space-y-0">
              {tasks.map((task) => {
                const isDone = task.status === "DONE";
                const isOverdue = !isDone && task.due_date && isPast(new Date(task.due_date));

                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-2.5 py-2.5 border-b last:border-b-0"
                  >
                    <button
                      type="button"
                      className={cn(
                        "mt-0.5 shrink-0 rounded-full transition-colors",
                        isDone
                          ? "text-primary"
                          : isOverdue
                            ? "text-destructive"
                            : "text-muted-foreground hover:text-primary"
                      )}
                      onClick={() => handleToggle(task.id)}
                      disabled={isPending}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-sm font-medium",
                          isDone && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {isOverdue && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Overdue
                          </Badge>
                        )}
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground">
                            {isDone && task.completed_at
                              ? `Completed ${format(new Date(task.completed_at), "MMM d")}`
                              : `Due ${format(new Date(task.due_date), "MMM d")}`}
                          </span>
                        )}
                        {task.assigned_user && (
                          <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">
                              {task.assigned_user.name}
                            </span>
                          </>
                        )}
                      </div>
                      {/* Appointment link tag */}
                      {task.appointment && (
                        <div className="mt-1">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0 rounded bg-blue-50 text-blue-600",
                              isDone && "opacity-50"
                            )}
                          >
                            <Calendar className="h-2.5 w-2.5" />
                            {task.appointment.title} · {format(new Date(task.appointment.start_date), "MMM d")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Task Sheet */}
      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Task</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                value={formValues.title}
                onChange={(e) => setFormValues((p) => ({ ...p, title: e.target.value }))}
                placeholder="What needs to be done?"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Details</Label>
              <Textarea
                value={formValues.description}
                onChange={(e) => setFormValues((p) => ({ ...p, description: e.target.value }))}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formValues.due_date}
                  onChange={(e) => setFormValues((p) => ({ ...p, due_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={formValues.priority}
                  onValueChange={(v) => setFormValues((p) => ({ ...p, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {appointments.length > 0 && (
              <div className="space-y-1.5">
                <Label>Link to Appointment</Label>
                <Select
                  value={formValues.appointment_id}
                  onValueChange={(v) => setFormValues((p) => ({ ...p, appointment_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {appointments.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.title} — {format(new Date(a.start_date), "MMM d")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreating(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isPending || !formValues.title.trim()}>
                {isPending ? "Adding..." : "Add Task"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
