export type CalendarUser = {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  role: string;
};

export type CalendarAppointment = {
  id: string;
  job_id: string;
  title: string;
  type: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  assigned_to: string | null;
  crew_name: string | null;
  notes: string | null;
  job: { id: string; name: string | null; job_number: string | null } | null;
  assigned_user: {
    id: string;
    name: string | null;
    avatar: string | null;
    role?: string;
  } | null;
};

export type CalendarData = {
  users: CalendarUser[];
  appointments: CalendarAppointment[];
};

export const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  INSPECTION: { bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-400", text: "text-blue-700 dark:text-blue-300" },
  ADJUSTER: { bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-400", text: "text-purple-700 dark:text-purple-300" },
  SALES_VISIT: { bg: "bg-green-100 dark:bg-green-900/30", border: "border-green-400", text: "text-green-700 dark:text-green-300" },
  PRE_CONSTRUCTION: { bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-400", text: "text-amber-700 dark:text-amber-300" },
  BUILD: { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-400", text: "text-orange-700 dark:text-orange-300" },
  DELIVERY: { bg: "bg-teal-100 dark:bg-teal-900/30", border: "border-teal-400", text: "text-teal-700 dark:text-teal-300" },
  FINAL_WALKTHROUGH: { bg: "bg-indigo-100 dark:bg-indigo-900/30", border: "border-indigo-400", text: "text-indigo-700 dark:text-indigo-300" },
  WARRANTY: { bg: "bg-rose-100 dark:bg-rose-900/30", border: "border-rose-400", text: "text-rose-700 dark:text-rose-300" },
  OTHER: { bg: "bg-slate-100 dark:bg-slate-900/30", border: "border-slate-400", text: "text-slate-700 dark:text-slate-300" },
};

export const TYPE_LABELS: Record<string, string> = {
  INSPECTION: "Inspection",
  ADJUSTER: "Adjuster",
  SALES_VISIT: "Sales Visit",
  PRE_CONSTRUCTION: "Pre-Construction",
  BUILD: "Build",
  DELIVERY: "Delivery",
  FINAL_WALKTHROUGH: "Final Walkthrough",
  WARRANTY: "Warranty",
  OTHER: "Other",
};

export const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-amber-50 border-amber-200 text-amber-600",
  DISPATCHED: "bg-blue-50 border-blue-200 text-blue-600",
  IN_PROGRESS: "bg-violet-50 border-violet-200 text-violet-600",
  COMPLETED: "bg-green-50 border-green-200 text-green-600",
  CANCELLED: "bg-red-50 border-red-200 text-red-600",
};
