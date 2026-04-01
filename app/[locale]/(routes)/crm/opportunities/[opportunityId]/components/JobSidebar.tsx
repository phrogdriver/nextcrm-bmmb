"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Home,
  DollarSign,
  Calendar,
  Users,
  Phone,
  Mail,
  MapPin,
  Camera,
  ExternalLink,
  Pencil,
  Info,
} from "lucide-react";
import { type Job } from "@/actions/crm/get-job";
import { format } from "date-fns";
import { EditSheet, type FieldDef } from "@/components/crm/EditSheet";

// ── Helpers ──────────────────────────────────────────────────

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return format(new Date(d), "MMM d, yyyy");
}

function fmtDateInput(d: string | Date | null | undefined): string {
  if (!d) return "";
  return format(new Date(d), "yyyy-MM-dd");
}

function fmtCurrency(v: string | number | null | undefined): string {
  if (v == null || v === "" || v === "0") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(v));
}

function fmtPercent(v: string | number | null | undefined): string {
  if (v == null || v === "") return "—";
  return `${Number(v).toFixed(1)}%`;
}

function str(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

// ── Sidebar Card Wrapper ─────────────────────────────────────

function SidebarCard({
  icon: Icon,
  title,
  onEdit,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </CardTitle>
          </div>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onEdit}
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">{children}</CardContent>
    </Card>
  );
}

// ── Customer Card ────────────────────────────────────────────

function CustomerCard({ job }: { job: Job }) {
  const [editing, setEditing] = useState(false);
  const contact = job.contacts?.[0]?.contact;
  const account = job.assigned_account;

  // Customer editing is limited to account/contact assignment for now
  const fields: FieldDef[] = [
    { key: "name", label: "Job Name", type: "text" },
    { key: "job_number", label: "Job Number", type: "text" },
  ];

  const initialValues = {
    name: str(job.name),
    job_number: str(job.job_number),
  };

  return (
    <>
      <SidebarCard icon={User} title="Customer" onEdit={() => setEditing(true)}>
        <div className="space-y-3">
          {contact && (
            <>
              <p className="text-sm font-semibold">
                {contact.first_name} {contact.last_name}
              </p>
              {contact.mobile_phone && (
                <a
                  href={`tel:${contact.mobile_phone}`}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {contact.mobile_phone}
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {contact.email}
                </a>
              )}
            </>
          )}
          {!contact && account && (
            <p className="text-sm font-semibold">{account.name}</p>
          )}
          {!contact && !account && (
            <p className="text-sm text-muted-foreground">No contact assigned</p>
          )}
        </div>
      </SidebarCard>
      <EditSheet
        open={editing}
        onOpenChange={setEditing}
        title="Edit Job Identity"
        jobId={job.id}
        fields={fields}
        initialValues={initialValues}
      />
    </>
  );
}

// ── Property Card ────────────────────────────────────────────

function PropertyCard({ job }: { job: Job }) {
  const [editing, setEditing] = useState(false);
  const prop = job.assigned_property;

  const fields: FieldDef[] = [
    { key: "companycam_url", label: "CompanyCam URL", type: "text", placeholder: "https://..." },
    { key: "companycam_id", label: "CompanyCam ID", type: "text" },
    { key: "territory", label: "Territory", type: "text" },
    { key: "project_type", label: "Project Type", type: "text", placeholder: "Roof Replacement, Repair, etc." },
    { key: "roof_type", label: "Roof Type", type: "text" },
  ];

  const initialValues = {
    companycam_url: str(job.companycam_url),
    companycam_id: str(job.companycam_id),
    territory: str(job.territory),
    project_type: str(job.project_type),
    roof_type: str(job.roof_type),
  };

  return (
    <>
      <SidebarCard icon={Home} title="Property" onEdit={() => setEditing(true)}>
        {prop ? (
          <div className="space-y-2">
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-sm">
                {prop.address}
                {prop.city && `, ${prop.city}`}
                {prop.state && `, ${prop.state}`}
                {prop.zip && ` ${prop.zip}`}
              </p>
            </div>
            {prop.property_type && (
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-xs">Type</p>
                <p className="text-sm font-medium">{prop.property_type}</p>
              </div>
            )}
            {job.companycam_url && (
              <a
                href={job.companycam_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Camera className="h-3.5 w-3.5" />
                CompanyCam
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No property linked</p>
        )}
      </SidebarCard>
      <EditSheet
        open={editing}
        onOpenChange={setEditing}
        title="Edit Property & Job Details"
        jobId={job.id}
        fields={fields}
        initialValues={initialValues}
      />
    </>
  );
}

// ── Financials Card ──────────────────────────────────────────

function FinancialsCard({ job }: { job: Job }) {
  const [editing, setEditing] = useState(false);

  const fields: FieldDef[] = [
    { key: "estimated_total", label: "Estimated Total", type: "number" },
    { key: "budgeted_amount", label: "Budgeted Amount", type: "number" },
    { key: "budgeted_labor", label: "Budgeted Labor", type: "number" },
    { key: "budgeted_materials", label: "Budgeted Materials", type: "number" },
    { key: "total_expenses", label: "Total Expenses", type: "number" },
    { key: "payments_received", label: "Payments Received", type: "number" },
    { key: "overhead", label: "Overhead", type: "number" },
    { key: "overhead_percentage", label: "Overhead %", type: "number" },
    { key: "commission_percentage", label: "Commission %", type: "number" },
    { key: "commission", label: "Commission", type: "number" },
  ];

  const initialValues: Record<string, string> = {};
  for (const f of fields) {
    initialValues[f.key] = str((job as any)[f.key]);
  }

  const rows = ([
    ["Estimated Total", fmtCurrency(job.estimated_total)] as const,
    ["Budgeted Amount", fmtCurrency(job.budgeted_amount)] as const,
    ["Budgeted Labor", fmtCurrency(job.budgeted_labor)] as const,
    ["Budgeted Materials", fmtCurrency(job.budgeted_materials)] as const,
    ["Total Expenses", fmtCurrency(job.total_expenses)] as const,
    ["Payments Received", fmtCurrency(job.payments_received)] as const,
    ["Gross Profit", fmtCurrency(job.gross_profit)] as const,
    ["Net Profit", fmtCurrency(job.net_profit)] as const,
    ["Gross Margin", fmtPercent(job.gross_profit_margin)] as const,
    ["Overhead", fmtCurrency(job.overhead)] as const,
    ["Commission", fmtCurrency(job.commission)] as const,
  ]).filter(([_, v]) => v !== "—");

  return (
    <>
      <SidebarCard icon={DollarSign} title="Financials" onEdit={() => setEditing(true)}>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No financial data yet</p>
        ) : (
          <div className="space-y-2">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}
      </SidebarCard>
      <EditSheet
        open={editing}
        onOpenChange={setEditing}
        title="Edit Financials"
        jobId={job.id}
        fields={fields}
        initialValues={initialValues}
      />
    </>
  );
}

// ── Key Dates Card ───────────────────────────────────────────

function DatesCard({ job }: { job: Job }) {
  const [editing, setEditing] = useState(false);

  const fields: FieldDef[] = [
    { key: "date_contract_signed", label: "Contract Signed", type: "date" },
    { key: "date_inspected", label: "Inspected", type: "date" },
    { key: "date_work_in_progress", label: "Production Start", type: "date" },
    { key: "date_completed", label: "Completed", type: "date" },
    { key: "forecasted_build_date", label: "Build Date", type: "date" },
    { key: "follow_up_date", label: "Follow Up", type: "date" },
    { key: "date_revenue_recognized", label: "Revenue Recognized", type: "date" },
    { key: "date_closed", label: "Closed", type: "date" },
  ];

  const initialValues: Record<string, string> = {};
  for (const f of fields) {
    initialValues[f.key] = fmtDateInput((job as any)[f.key]);
  }

  const dates = ([
    ["Contract Signed", fmtDate(job.date_contract_signed)] as const,
    ["Inspected", fmtDate(job.date_inspected)] as const,
    ["Production Start", fmtDate(job.date_work_in_progress)] as const,
    ["Completed", fmtDate(job.date_completed)] as const,
    ["Build Date", fmtDate(job.forecasted_build_date)] as const,
    ["Follow Up", fmtDate(job.follow_up_date)] as const,
    ["Revenue Recognized", fmtDate(job.date_revenue_recognized)] as const,
    ["Closed", fmtDate(job.date_closed)] as const,
  ]).filter(([_, v]) => v !== "—");

  return (
    <>
      <SidebarCard icon={Calendar} title="Key Dates" onEdit={() => setEditing(true)}>
        {dates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No dates recorded yet</p>
        ) : (
          <div className="space-y-2">
            {dates.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}
      </SidebarCard>
      <EditSheet
        open={editing}
        onOpenChange={setEditing}
        title="Edit Key Dates"
        jobId={job.id}
        fields={fields}
        initialValues={initialValues}
      />
    </>
  );
}

// ── Assigned Team Card ───────────────────────────────────────

function TeamCard({ job }: { job: Job }) {
  const [editing, setEditing] = useState(false);

  const fields: FieldDef[] = [
    { key: "assigned_to", label: "Project Manager (User ID)", type: "text" },
    { key: "superintendent_id", label: "Superintendent (User ID)", type: "text" },
  ];

  const initialValues = {
    assigned_to: str(job.assigned_to),
    superintendent_id: str(job.superintendent_id),
  };

  return (
    <>
      <SidebarCard icon={Users} title="Assigned Team" onEdit={() => setEditing(true)}>
        <div className="space-y-3">
          {job.assigned_to_user && (
            <div>
              <p className="text-xs text-muted-foreground">Project Manager</p>
              <p className="text-sm font-medium">{job.assigned_to_user.name}</p>
            </div>
          )}
          {job.superintendent && (
            <div>
              <p className="text-xs text-muted-foreground">Superintendent</p>
              <p className="text-sm font-medium">{job.superintendent.name}</p>
            </div>
          )}
          {!job.assigned_to_user && !job.superintendent && (
            <p className="text-sm text-muted-foreground">No team assigned</p>
          )}
        </div>
      </SidebarCard>
      <EditSheet
        open={editing}
        onOpenChange={setEditing}
        title="Edit Assigned Team"
        jobId={job.id}
        fields={fields}
        initialValues={initialValues}
      />
    </>
  );
}

// ── Additional Info Card ─────────────────────────────────────

function AdditionalInfoCard({ job }: { job: Job }) {
  const [editing, setEditing] = useState(false);

  const fields: FieldDef[] = [
    { key: "job_number", label: "Job Number", type: "text" },
    { key: "name", label: "Job Name", type: "text" },
    {
      key: "payor_type",
      label: "Payor Type",
      type: "select",
      options: [
        { value: "INSURANCE", label: "Insurance" },
        { value: "CASH_RETAIL", label: "Cash / Retail" },
      ],
    },
    { key: "project_type", label: "Project Type", type: "text", placeholder: "Roof Replacement, Repair, etc." },
    { key: "property_type", label: "Property Type", type: "text", placeholder: "Residential, Commercial" },
    { key: "roof_type", label: "Roof Type", type: "text", placeholder: "Asphalt, Metal, Tile, etc." },
    { key: "primary_lead_source", label: "Primary Lead Source", type: "text" },
    { key: "secondary_lead_source", label: "Secondary Lead Source", type: "text" },
    { key: "territory", label: "Territory", type: "text" },
    { key: "description", label: "Notes / Description", type: "textarea" },
  ];

  const initialValues: Record<string, string> = {};
  for (const f of fields) {
    initialValues[f.key] = str((job as any)[f.key]);
  }

  const infoRows = ([
    ["Job Number", job.job_number] as const,
    ["Payor Type", job.payor_type === "INSURANCE" ? "Insurance" : job.payor_type === "CASH_RETAIL" ? "Cash / Retail" : null] as const,
    ["Project Type", job.project_type] as const,
    ["Property Type", job.property_type] as const,
    ["Roof Type", job.roof_type] as const,
    ["Lead Source", job.primary_lead_source] as const,
    ["Territory", job.territory] as const,
  ]).filter(([_, v]) => v != null && v !== "");

  return (
    <>
      <SidebarCard icon={Info} title="Additional Info" onEdit={() => setEditing(true)}>
        {infoRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No additional info yet — click edit to add</p>
        ) : (
          <div className="space-y-2">
            {infoRows.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}
      </SidebarCard>
      <EditSheet
        open={editing}
        onOpenChange={setEditing}
        title="Edit Job Information"
        jobId={job.id}
        fields={fields}
        initialValues={initialValues}
      />
    </>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────

interface JobSidebarProps {
  job: Job;
}

export function JobSidebar({ job }: JobSidebarProps) {
  return (
    <div className="space-y-4">
      <CustomerCard job={job} />
      <PropertyCard job={job} />
      <FinancialsCard job={job} />
      <DatesCard job={job} />
      <TeamCard job={job} />
      <AdditionalInfoCard job={job} />
    </div>
  );
}
