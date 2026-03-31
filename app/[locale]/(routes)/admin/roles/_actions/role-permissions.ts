"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserRole, PermissionValue } from "@prisma/client";
import {
  PERMISSIONS,
  DEFAULT_PERMISSIONS,
  type Permission,
} from "@/lib/permissions";

export type PermissionMatrixRow = {
  permission: string;
  values: Record<UserRole, PermissionValue>;
};

/**
 * Load the full permission matrix for the admin table.
 */
export async function getPermissionMatrix(): Promise<PermissionMatrixRow[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) throw new Error("Unauthorized");

  const rows = await prismadb.rolePermission.findMany();

  // Build a lookup from DB rows
  const dbLookup = new Map<string, PermissionValue>();
  for (const row of rows) {
    dbLookup.set(`${row.role}:${row.permission}`, row.value);
  }

  // Merge defaults with DB overrides
  return PERMISSIONS.map((permission) => {
    const defaults = DEFAULT_PERMISSIONS[permission];
    const values = {} as Record<UserRole, PermissionValue>;

    for (const role of Object.keys(defaults) as UserRole[]) {
      const key = `${role}:${permission}`;
      values[role] = dbLookup.get(key) ?? defaults[role];
    }

    return { permission, values };
  });
}

/**
 * Update a single cell in the permission matrix.
 */
export async function updatePermissionCell(
  role: UserRole,
  permission: string,
  value: PermissionValue
): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return { error: "Unauthorized" };

  // Prevent editing the ADMIN column
  if (role === "ADMIN") {
    return { error: "Admin permissions cannot be modified" };
  }

  // Validate permission name
  if (!PERMISSIONS.includes(permission as Permission)) {
    return { error: `Unknown permission: ${permission}` };
  }

  await prismadb.rolePermission.upsert({
    where: { role_permission: { role, permission } },
    update: { value, updatedBy: session.user.id },
    create: { role, permission, value, updatedBy: session.user.id },
  });

  revalidatePath("/", "layout");
  return {};
}

/**
 * Reset a single role back to its default permissions.
 */
export async function resetRoleToDefaults(
  role: UserRole
): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return { error: "Unauthorized" };

  if (role === "ADMIN") {
    return { error: "Admin permissions cannot be modified" };
  }

  // Delete all overrides for this role, then re-seed defaults
  await prismadb.rolePermission.deleteMany({ where: { role } });

  const rows = PERMISSIONS.map((permission) => ({
    role,
    permission,
    value: DEFAULT_PERMISSIONS[permission][role],
    updatedBy: session.user.id,
  }));

  await prismadb.rolePermission.createMany({ data: rows });

  revalidatePath("/", "layout");
  return {};
}
