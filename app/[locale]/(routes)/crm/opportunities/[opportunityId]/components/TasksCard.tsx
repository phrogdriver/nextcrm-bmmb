"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ListChecks, Plus, Calendar, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TaskLink = {
  type: "appointment" | "po";
  label: string;
};

type MockTask = {
  id: string;
  title: string;
  dueDate: string;
  assignee: string;
  done: boolean;
  overdue: boolean;
  links: TaskLink[];
};

// Mock data — will be replaced with real crm_Tasks once model exists
const MOCK_TASKS: MockTask[] = [
  {
    id: "1",
    title: "Collect deductible from homeowner",
    dueDate: "Due Mar 28",
    assignee: "Jackson Coffin",
    done: false,
    overdue: true,
    links: [{ type: "appointment", label: "Final Walkthrough · Apr 22" }],
  },
  {
    id: "2",
    title: "Verify material delivery — ABC Supply",
    dueDate: "Due Apr 14",
    assignee: "Marcus Rivera",
    done: false,
    overdue: false,
    links: [{ type: "po", label: "PO-23339-002 · ABC Supply" }],
  },
  {
    id: "3",
    title: "Confirm crew availability for build",
    dueDate: "Due Apr 12",
    assignee: "Jackson Coffin",
    done: false,
    overdue: false,
    links: [
      { type: "po", label: "PO-23339-001 · Peak Roofing" },
      { type: "appointment", label: "Build Day · Apr 15" },
    ],
  },
  {
    id: "4",
    title: "Submit supplement to State Farm",
    dueDate: "Due Apr 10",
    assignee: "Jackson Coffin",
    done: false,
    overdue: false,
    links: [],
  },
  {
    id: "5",
    title: "Upload build-day photos to CompanyCam",
    dueDate: "Due Apr 15",
    assignee: "Marcus Rivera",
    done: false,
    overdue: false,
    links: [{ type: "appointment", label: "Build Day · Apr 15" }],
  },
  {
    id: "6",
    title: "Review claim summary for scope gaps",
    dueDate: "Completed Mar 22",
    assignee: "Jackson Coffin",
    done: true,
    overdue: false,
    links: [],
  },
  {
    id: "7",
    title: "Document roof condition + take photos",
    dueDate: "Completed Feb 12",
    assignee: "Jackson Coffin",
    done: true,
    overdue: false,
    links: [{ type: "appointment", label: "Inspection · Feb 12" }],
  },
];

export function TasksCard() {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const openCount = tasks.filter((t) => !t.done).length;

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <Card>
      <div className="flex items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Tasks</span>
          <Badge variant="secondary" className="text-[11px]">
            {openCount} open
          </Badge>
        </div>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add task
        </Button>
      </div>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="space-y-0">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-2.5 py-2.5 border-b last:border-b-0"
            >
              {/* Checkbox */}
              <button
                type="button"
                className={cn(
                  "mt-0.5 shrink-0 rounded-full transition-colors",
                  task.done
                    ? "text-primary"
                    : task.overdue
                      ? "text-destructive"
                      : "text-muted-foreground hover:text-primary"
                )}
                onClick={() => toggleTask(task.id)}
              >
                {task.done ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "text-sm font-medium",
                    task.done && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {task.overdue && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      Overdue
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {task.dueDate}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {task.assignee}
                  </span>
                </div>
                {task.links.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {task.links.map((link, i) => (
                      <span
                        key={i}
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0 rounded",
                          link.type === "appointment"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-violet-50 text-violet-600",
                          task.done && "opacity-50"
                        )}
                      >
                        {link.type === "appointment" ? (
                          <Calendar className="h-2.5 w-2.5" />
                        ) : (
                          <ClipboardList className="h-2.5 w-2.5" />
                        )}
                        {link.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
