"use client";

import { Calendar, Users, CheckCircle2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock data — will be replaced with real crm_Appointments once model exists
const MOCK_APPOINTMENTS = [
  {
    id: "1",
    title: "Build Day",
    date: "2026-04-15",
    month: "APR",
    day: "15",
    time: "7:00 AM – 5:00 PM",
    location: "1234 Main St",
    crew: "Peak Roofing — Carlos Mendez (crew lead)",
    status: "Dispatched" as const,
    taskCount: 3,
    overdueCount: 1,
    poLinks: ["PO-001", "PO-002"],
    past: false,
  },
  {
    id: "2",
    title: "Final Walkthrough",
    date: "2026-04-22",
    month: "APR",
    day: "22",
    time: "3:00 PM – 4:00 PM",
    location: "1234 Main St",
    crew: "Jackson Coffin",
    status: "Scheduled" as const,
    taskCount: 2,
    overdueCount: 0,
    poLinks: [],
    past: false,
  },
  {
    id: "3",
    title: "Inspection",
    date: "2026-02-12",
    month: "FEB",
    day: "12",
    time: "9:00 AM – 10:30 AM",
    crew: "Jackson Coffin",
    status: "Completed" as const,
    taskCount: 4,
    overdueCount: 0,
    poLinks: [],
    past: true,
  },
  {
    id: "4",
    title: "Adjuster Visit",
    date: "2026-03-15",
    month: "MAR",
    day: "15",
    time: "1:00 PM – 2:00 PM",
    crew: "Jackson Coffin + Sarah Chen (adjuster)",
    status: "Completed" as const,
    taskCount: 3,
    overdueCount: 0,
    poLinks: [],
    past: true,
  },
];

const STATUS_STYLES = {
  Dispatched: "bg-blue-50 border-blue-200 text-blue-600",
  Scheduled: "bg-amber-50 border-amber-200 text-amber-600",
  Completed: "bg-green-50 border-green-200 text-green-600",
} as const;

export function AppointmentsCard() {
  const appointments = MOCK_APPOINTMENTS;

  return (
    <Card>
      <div className="flex items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Appointments</span>
        </div>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Schedule
        </Button>
      </div>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="space-y-0">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className={cn(
                "flex items-start gap-3 py-3 border-b last:border-b-0",
                appt.past && "opacity-50"
              )}
            >
              {/* Date block */}
              <div
                className={cn(
                  "w-11 text-center rounded-md py-1 border shrink-0",
                  appt.past
                    ? "bg-muted"
                    : "bg-primary border-primary"
                )}
              >
                <div
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider leading-none",
                    appt.past ? "text-muted-foreground" : "text-primary-foreground"
                  )}
                >
                  {appt.month}
                </div>
                <div
                  className={cn(
                    "text-lg font-bold leading-tight",
                    appt.past ? "text-foreground" : "text-primary-foreground"
                  )}
                >
                  {appt.day}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{appt.title}</span>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", STATUS_STYLES[appt.status])}
                  >
                    {appt.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {appt.time}
                  {appt.location && ` · ${appt.location}`}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-primary">
                  <Users className="h-2.5 w-2.5" />
                  {appt.crew}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {appt.past
                    ? `${appt.taskCount}/${appt.taskCount} tasks done`
                    : `${appt.taskCount} tasks`}
                  {appt.overdueCount > 0 && (
                    <span className="text-destructive ml-1">
                      · {appt.overdueCount} overdue
                    </span>
                  )}
                </div>
              </div>

              {/* PO links */}
              {appt.poLinks.length > 0 && (
                <div className="flex flex-col gap-1 shrink-0">
                  {appt.poLinks.map((po) => (
                    <Badge key={po} variant="outline" className="text-[10px]">
                      {po}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
