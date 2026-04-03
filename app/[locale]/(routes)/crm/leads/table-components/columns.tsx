"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

type ConfigItem = { id: string; name: string };

export const createColumns = (
  leadSources: ConfigItem[],
  leadStatuses: ConfigItem[],
  leadTypes: ConfigItem[],
): ColumnDef<any>[] => [
  {
    accessorKey: "firstName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <Link href={`/crm/leads/${row.original.id}`} data-testid="lead-row-name">
        <div className="font-medium">
          {[row.original.firstName, row.original.lastName].filter(Boolean).join(" ")}
        </div>
      </Link>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    cell: ({ row }) => <div>{row.getValue("phone")}</div>,
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "assigned_to_user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Owner" />
    ),
    cell: ({ row }) => (
      <div>
        {(row.getValue("assigned_to_user") as any)?.name ?? "Unassigned"}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "lead_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("lead_status") as { name: string } | null;
      return <div>{status?.name ?? "—"}</div>;
    },
    filterFn: (row, id, value) => {
      const status = row.getValue(id) as { name: string } | null;
      return value.includes(status?.name);
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        leadSources={leadSources}
        leadStatuses={leadStatuses}
        leadTypes={leadTypes}
      />
    ),
  },
];
