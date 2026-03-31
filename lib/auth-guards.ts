import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { checkPermission, type Permission } from "@/lib/permissions";
import { PermissionValue } from "@prisma/client";

export async function requireOwnerOrAdmin(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (session.user.id !== userId && !session.user.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return { session };
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!session.user.isAdmin)
    return NextResponse.json(
      { error: "Forbidden - Admin access required" },
      { status: 403 }
    );
  return { session };
}

/**
 * Check that the current user has a specific permission.
 * Returns the session + permission value on success, or a NextResponse error.
 *
 * For OWN-scoped permissions, the caller is responsible for filtering
 * records to those assigned to the user.
 */
export async function requirePermission(permission: Permission) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const role = (session.user.role as UserRole) ?? "PROJECT_MANAGER";
  const value = await checkPermission(role, permission);

  if (value === PermissionValue.DENY) {
    return NextResponse.json(
      { error: `Forbidden - Missing permission: ${permission}` },
      { status: 403 }
    );
  }

  return { session, permissionValue: value };
}

/**
 * Check that the current user has a specific role (or higher).
 */
const ROLE_HIERARCHY: UserRole[] = [
  "ADMIN",
  "GENERAL_MANAGER",
  "CUSTOMER_CARE",
  "PRODUCTION_MANAGER",
  "PROJECT_MANAGER",
  "SUBCONTRACTOR",
];

export async function requireRole(minimumRole: UserRole) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const userRole = (session.user.role as UserRole) ?? "PROJECT_MANAGER";
  const userLevel = ROLE_HIERARCHY.indexOf(userRole);
  const requiredLevel = ROLE_HIERARCHY.indexOf(minimumRole);

  if (userLevel === -1 || userLevel > requiredLevel) {
    return NextResponse.json(
      { error: `Forbidden - Requires ${minimumRole} or higher` },
      { status: 403 }
    );
  }

  return { session };
}
