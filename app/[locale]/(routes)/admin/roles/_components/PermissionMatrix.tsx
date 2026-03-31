"use client";

import { useState, useTransition } from "react";
import { UserRole, PermissionValue } from "@prisma/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RotateCcw } from "lucide-react";
import {
  PERMISSION_LABELS,
  PERMISSION_GROUPS,
  ROLE_LABELS,
  ROLE_ORDER,
  type Permission,
} from "@/lib/permissions";
import {
  updatePermissionCell,
  resetRoleToDefaults,
  type PermissionMatrixRow,
} from "../_actions/role-permissions";

// ─── Cell component ─────────────────────────────────────────────

function valueLabel(v: PermissionValue): string {
  switch (v) {
    case "ALLOW":
      return "Yes";
    case "DENY":
      return "No";
    case "OWN":
      return "Own";
  }
}

function valueBadgeClass(v: PermissionValue): string {
  switch (v) {
    case "ALLOW":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/40";
    case "DENY":
      return "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/40";
    case "OWN":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/40";
  }
}

const CYCLE_ORDER: PermissionValue[] = ["ALLOW", "OWN", "DENY"];

function PermissionCell({
  role,
  permission,
  value,
  disabled,
  onUpdate,
}: {
  role: UserRole;
  permission: string;
  value: PermissionValue;
  disabled: boolean;
  onUpdate: (role: UserRole, permission: string, value: PermissionValue) => void;
}) {
  function handleClick() {
    if (disabled) return;
    const idx = CYCLE_ORDER.indexOf(value);
    const next = CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];
    onUpdate(role, permission, next);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "w-full flex justify-center py-1.5",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/50 rounded"
      )}
      title={
        disabled
          ? "Admin permissions are locked"
          : `Click to cycle: ${valueLabel(value)} → ${valueLabel(CYCLE_ORDER[(CYCLE_ORDER.indexOf(value) + 1) % CYCLE_ORDER.length])}`
      }
    >
      <Badge
        variant="outline"
        className={cn("text-[11px] font-medium min-w-[42px] justify-center", valueBadgeClass(value))}
      >
        {valueLabel(value)}
      </Badge>
    </button>
  );
}

// ─── Main matrix component ──────────────────────────────────────

interface PermissionMatrixProps {
  initialData: PermissionMatrixRow[];
}

export function PermissionMatrix({ initialData }: PermissionMatrixProps) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  function handleUpdate(role: UserRole, permission: string, value: PermissionValue) {
    // Optimistic update
    setData((prev) =>
      prev.map((row) =>
        row.permission === permission
          ? { ...row, values: { ...row.values, [role]: value } }
          : row
      )
    );

    startTransition(async () => {
      const result = await updatePermissionCell(role, permission, value);
      if (result.error) {
        toast.error(result.error);
        // Revert
        setData((prev) =>
          prev.map((row) => {
            if (row.permission !== permission) return row;
            const original = initialData.find((r) => r.permission === permission);
            return original ?? row;
          })
        );
      }
    });
  }

  function handleReset(role: UserRole) {
    startTransition(async () => {
      const result = await resetRoleToDefaults(role);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${ROLE_LABELS[role]} reset to defaults`);
        // Reload — revalidatePath will handle it, but refresh local state
        window.location.reload();
      }
    });
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full text-sm">
        {/* Header */}
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[220px] sticky left-0 bg-muted/50 z-10">
              Permission
            </th>
            {ROLE_ORDER.map((role) => (
              <th key={role} className="px-2 py-3 text-center font-medium min-w-[110px]">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs text-foreground">{ROLE_LABELS[role]}</span>
                  {role !== "ADMIN" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                          disabled={isPending}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reset
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Reset {ROLE_LABELS[role]} to defaults?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will revert all permission changes for the{" "}
                            {ROLE_LABELS[role]} role back to the system defaults.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleReset(role)}>
                            Reset
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body — grouped by section */}
        <tbody>
          {PERMISSION_GROUPS.map((group) => (
            <>
              {/* Group header row */}
              <tr key={`group-${group.label}`} className="bg-muted/30">
                <td
                  colSpan={ROLE_ORDER.length + 1}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {group.label}
                </td>
              </tr>

              {/* Permission rows */}
              {group.permissions.map((perm) => {
                const row = data.find((r) => r.permission === perm);
                if (!row) return null;

                return (
                  <tr key={perm} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-2 text-sm font-medium sticky left-0 bg-background z-10">
                      {PERMISSION_LABELS[perm]}
                    </td>
                    {ROLE_ORDER.map((role) => (
                      <td key={role} className="px-2 py-1 text-center">
                        <PermissionCell
                          role={role}
                          permission={perm}
                          value={row.values[role]}
                          disabled={role === "ADMIN"}
                          onUpdate={handleUpdate}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
