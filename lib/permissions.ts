import { UserRole, PermissionValue } from "@prisma/client";
import { prismadb } from "@/lib/prisma";

// ============================================
// PERMISSION KEYS — the fixed set of row labels
// ============================================
export const PERMISSIONS = [
  // Leads & Pipeline
  "view_all_leads",
  "create_edit_leads",
  "view_pipeline",

  // Estimates & Sales
  "create_estimates",
  "approve_estimates",

  // Scheduling & Jobs
  "schedule_jobs",
  "dispatch_board",
  "update_job_status",
  "upload_job_photos",

  // Financials
  "view_job_cost_margin",
  "create_invoices",
  "view_revenue_reports",
  "collect_payments",
  "insurance_depreciation_tracking",

  // Communication
  "answer_log_calls",
  "send_sms_email",

  // Admin
  "manage_users_roles",
  "system_settings",
  "manage_integrations",
  "view_audit_log",
  "delete_records",
  "export_data",
  "bulk_actions",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// Human-readable labels for the admin table
export const PERMISSION_LABELS: Record<Permission, string> = {
  view_all_leads: "View all leads",
  create_edit_leads: "Create / edit leads",
  view_pipeline: "View pipeline (Kanban)",
  create_estimates: "Create estimates",
  approve_estimates: "Approve estimates",
  schedule_jobs: "Schedule jobs",
  dispatch_board: "Dispatch board",
  update_job_status: "Update job status",
  upload_job_photos: "Upload job photos",
  view_job_cost_margin: "View job cost / margin",
  create_invoices: "Create invoices",
  view_revenue_reports: "View revenue reports",
  collect_payments: "Collect payments",
  insurance_depreciation_tracking: "Insurance / depreciation tracking",
  answer_log_calls: "Answer / log calls",
  send_sms_email: "Send SMS / email",
  manage_users_roles: "Manage users / roles",
  system_settings: "System settings",
  manage_integrations: "Manage integrations",
  view_audit_log: "View audit log",
  delete_records: "Delete records",
  export_data: "Export data",
  bulk_actions: "Bulk actions",
};

// Group permissions for display in the admin table
export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] =
  [
    {
      label: "Leads & Pipeline",
      permissions: ["view_all_leads", "create_edit_leads", "view_pipeline"],
    },
    {
      label: "Estimates & Sales",
      permissions: ["create_estimates", "approve_estimates"],
    },
    {
      label: "Scheduling & Jobs",
      permissions: [
        "schedule_jobs",
        "dispatch_board",
        "update_job_status",
        "upload_job_photos",
      ],
    },
    {
      label: "Financials",
      permissions: [
        "view_job_cost_margin",
        "create_invoices",
        "view_revenue_reports",
        "collect_payments",
        "insurance_depreciation_tracking",
      ],
    },
    {
      label: "Communication",
      permissions: ["answer_log_calls", "send_sms_email"],
    },
    {
      label: "Admin",
      permissions: [
        "manage_users_roles",
        "system_settings",
        "manage_integrations",
        "view_audit_log",
        "delete_records",
        "export_data",
        "bulk_actions",
      ],
    },
  ];

// ============================================
// DEFAULT PERMISSION MATRIX
// Seeded on first run; editable by Admin via UI
// ============================================

type DefaultMatrix = Record<Permission, Record<UserRole, PermissionValue>>;

const A = PermissionValue.ALLOW;
const D = PermissionValue.DENY;
const O = PermissionValue.OWN;

export const DEFAULT_PERMISSIONS: DefaultMatrix = {
  // Leads & Pipeline
  view_all_leads:    { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: O, SUBCONTRACTOR: D },
  create_edit_leads: { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: O, SUBCONTRACTOR: D },
  view_pipeline:     { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: A, PROJECT_MANAGER: O, SUBCONTRACTOR: D },

  // Estimates & Sales
  create_estimates:  { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: D, PRODUCTION_MANAGER: D, PROJECT_MANAGER: A, SUBCONTRACTOR: D },
  approve_estimates: { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: D, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },

  // Scheduling & Jobs
  schedule_jobs:     { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: D, PRODUCTION_MANAGER: A, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
  dispatch_board:    { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: D, PRODUCTION_MANAGER: A, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
  update_job_status: { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: A, PROJECT_MANAGER: O, SUBCONTRACTOR: O },
  upload_job_photos: { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: A, PROJECT_MANAGER: A, SUBCONTRACTOR: A },

  // Financials
  view_job_cost_margin:           { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: A, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
  create_invoices:                { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
  view_revenue_reports:           { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: O, SUBCONTRACTOR: D },
  collect_payments:               { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: A, SUBCONTRACTOR: D },
  insurance_depreciation_tracking:{ ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },

  // Communication
  answer_log_calls: { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
  send_sms_email:   { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: A, PROJECT_MANAGER: O, SUBCONTRACTOR: D },

  // Admin
  manage_users_roles:  { ADMIN: A, GENERAL_MANAGER: O, CUSTOMER_CARE: D, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
  system_settings:     { ADMIN: A, GENERAL_MANAGER: D, CUSTOMER_CARE: D, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
  manage_integrations: { ADMIN: A, GENERAL_MANAGER: D, CUSTOMER_CARE: D, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
  view_audit_log:      { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
  delete_records:      { ADMIN: A, GENERAL_MANAGER: O, CUSTOMER_CARE: D, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
  export_data:         { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: D, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
  bulk_actions:        { ADMIN: A, GENERAL_MANAGER: A, CUSTOMER_CARE: A, PRODUCTION_MANAGER: A, PROJECT_MANAGER: D, SUBCONTRACTOR: D },
};

// ============================================
// ROLE METADATA
// ============================================

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  GENERAL_MANAGER: "General Manager",
  CUSTOMER_CARE: "Customer Care",
  PRODUCTION_MANAGER: "Production Manager",
  PROJECT_MANAGER: "Project Manager",
  SUBCONTRACTOR: "Subcontractor",
};

// Display order for the admin table columns
export const ROLE_ORDER: UserRole[] = [
  "ADMIN",
  "GENERAL_MANAGER",
  "CUSTOMER_CARE",
  "PRODUCTION_MANAGER",
  "PROJECT_MANAGER",
  "SUBCONTRACTOR",
];

// ============================================
// RUNTIME HELPERS
// ============================================

/**
 * Check if a user's role has a specific permission.
 * Reads from DB (cached per request via Next.js fetch cache).
 * Returns the PermissionValue so callers can handle OWN scoping.
 */
export async function checkPermission(
  role: UserRole,
  permission: Permission
): Promise<PermissionValue> {
  // Admin always has full access — not overridable in DB
  if (role === "ADMIN") return PermissionValue.ALLOW;

  const row = await prismadb.rolePermission.findUnique({
    where: { role_permission: { role, permission } },
  });

  if (!row) {
    // Fall back to default if DB row is missing
    return DEFAULT_PERMISSIONS[permission]?.[role] ?? PermissionValue.DENY;
  }

  return row.value;
}

/**
 * Check if permission is granted (ALLOW or OWN).
 * For OWN checks, the caller must still verify record ownership.
 */
export async function hasPermission(
  role: UserRole,
  permission: Permission
): Promise<boolean> {
  const value = await checkPermission(role, permission);
  return value !== PermissionValue.DENY;
}

/**
 * Check if permission requires ownership scoping.
 */
export async function isOwnOnly(
  role: UserRole,
  permission: Permission
): Promise<boolean> {
  const value = await checkPermission(role, permission);
  return value === PermissionValue.OWN;
}

/**
 * Load the full permission matrix for the admin table.
 */
export async function getPermissionMatrix(): Promise<
  Record<string, Record<UserRole, PermissionValue>>
> {
  const rows = await prismadb.rolePermission.findMany();

  // Start with defaults
  const matrix: Record<string, Record<UserRole, PermissionValue>> = {};
  for (const perm of PERMISSIONS) {
    matrix[perm] = { ...DEFAULT_PERMISSIONS[perm] };
  }

  // Override with DB values
  for (const row of rows) {
    if (matrix[row.permission]) {
      matrix[row.permission][row.role] = row.value;
    }
  }

  return matrix;
}
