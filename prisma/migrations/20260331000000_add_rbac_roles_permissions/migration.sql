-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GENERAL_MANAGER', 'CUSTOMER_CARE', 'PRODUCTION_MANAGER', 'PROJECT_MANAGER', 'SUBCONTRACTOR');

-- CreateEnum
CREATE TYPE "PermissionValue" AS ENUM ('ALLOW', 'DENY', 'OWN');

-- AlterTable: add role column to Users with default
ALTER TABLE "Users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'PROJECT_MANAGER';

-- Backfill: existing admins get ADMIN role
UPDATE "Users" SET "role" = 'ADMIN' WHERE "is_admin" = true;

-- CreateIndex
CREATE INDEX "Users_role_idx" ON "Users"("role");

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role" "UserRole" NOT NULL,
    "permission" TEXT NOT NULL,
    "value" "PermissionValue" NOT NULL DEFAULT 'DENY',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RolePermission_role_idx" ON "RolePermission"("role");
CREATE INDEX "RolePermission_permission_idx" ON "RolePermission"("permission");
CREATE UNIQUE INDEX "RolePermission_role_permission_key" ON "RolePermission"("role", "permission");
