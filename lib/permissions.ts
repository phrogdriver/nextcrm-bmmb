import { UserRole, PermissionValue } from "@prisma/client";
import { prismadb } from "@/lib/prisma";

// Re-export everything from the shared module (safe for client import)
export {
  PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSION_GROUPS,
  DEFAULT_PERMISSIONS,
  ROLE_LABELS,
  ROLE_ORDER,
} from "@/lib/permissions.shared";
export type { Permission } from "@/lib/permissions.shared";

import { PERMISSIONS, DEFAULT_PERMISSIONS, type Permission } from "@/lib/permissions.shared";

// ============================================
// RUNTIME HELPERS (server-only — uses prismadb)
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
