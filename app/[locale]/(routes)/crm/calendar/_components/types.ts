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

// ─── Appointment category colors ─────────────────────────────────────────────
// PM Meetings: blue (#3B82F6) — inspections, adjuster visits, walkthroughs, sales
// Work Orders: orange (#F97316) — builds, pre-construction
// Deliveries: teal (#14B8A6) — material deliveries
// Other: slate (#94A3B8) — fallback

export const APPOINTMENT_CATEGORY: Record<string, string> = {
  INSPECTION: "meeting",
  ADJUSTER: "meeting",
  FINAL_WALKTHROUGH: "meeting",
  SALES_VISIT: "meeting",
  WARRANTY: "work",
  BUILD: "meeting",
  WORK_ORDER: "work",
  PRE_CONSTRUCTION: "work",
  DELIVERY: "delivery",
  OTHER: "other",
};

export const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  meeting: { bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-400", text: "text-blue-700 dark:text-blue-300" },
  work: { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-400", text: "text-orange-700 dark:text-orange-300" },
  delivery: { bg: "bg-teal-100 dark:bg-teal-900/30", border: "border-teal-400", text: "text-teal-700 dark:text-teal-300" },
  other: { bg: "bg-slate-100 dark:bg-slate-900/30", border: "border-slate-400", text: "text-slate-700 dark:text-slate-300" },
};

/** Look up color for an appointment type via its category. */
export function getTypeColors(type: string | null) {
  const category = APPOINTMENT_CATEGORY[type ?? "OTHER"] ?? "other";
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;
}

export const TYPE_LABELS: Record<string, string> = {
  INSPECTION: "Inspection",
  ADJUSTER: "Adjuster",
  SALES_VISIT: "Sales Visit",
  PRE_CONSTRUCTION: "Pre-Construction",
  BUILD: "Build Check",
  WORK_ORDER: "Work Order",
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

// ─── Tab types ───────────────────────────────────────────────────────────────

export type CalendarTab = "company" | "sales" | "production" | "crews";

// ─── Purchase Order types ────────────────────────────────────────────────────

export type CalendarPO = {
  id: string;
  job_id: string;
  po_number: string | null;
  vendor_name: string;
  description: string | null;
  category: string | null;
  status: string;
  amount: string | null;
  scheduled_date: string;
  job: { id: string; name: string | null; job_number: string | null } | null;
  vendor: { id: string; name: string; phone: string | null } | null;
};

export type CalendarVendor = {
  id: string;
  name: string;
  phone: string | null;
  type: string | null;
};

export type CalendarJob = {
  id: string;
  name: string | null;
  job_number: string | null;
};

export type ProductionCalendarData = {
  appointments: CalendarAppointment[];
  purchaseOrders: CalendarPO[];
  jobs: CalendarJob[];
};

export type CrewCalendarData = {
  vendors: CalendarVendor[];
  purchaseOrders: CalendarPO[];
};

export const PO_CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  labor: { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-400", text: "text-orange-700 dark:text-orange-300" },
  materials: { bg: "bg-teal-100 dark:bg-teal-900/30", border: "border-teal-400", text: "text-teal-700 dark:text-teal-300" },
  "haul-off": { bg: "bg-slate-100 dark:bg-slate-900/30", border: "border-slate-400", text: "text-slate-700 dark:text-slate-300" },
  equipment: { bg: "bg-indigo-100 dark:bg-indigo-900/30", border: "border-indigo-400", text: "text-indigo-700 dark:text-indigo-300" },
  other: { bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-400", text: "text-purple-700 dark:text-purple-300" },
};

export const PO_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-50 border-slate-200 text-slate-600",
  ORDERED: "bg-amber-50 border-amber-200 text-amber-600",
  DISPATCHED: "bg-blue-50 border-blue-200 text-blue-600",
  RECEIVED: "bg-green-50 border-green-200 text-green-600",
  COMPLETED: "bg-green-50 border-green-200 text-green-600",
  CANCELLED: "bg-red-50 border-red-200 text-red-600",
};
