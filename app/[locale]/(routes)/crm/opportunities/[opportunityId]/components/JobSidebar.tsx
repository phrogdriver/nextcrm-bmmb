"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { type Job } from "@/actions/crm/get-job";
import { format } from "date-fns";

// ── Helpers ──────────────────────────────────────────────────

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return format(new Date(d), "MMM d, yyyy");
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

// ── Sidebar Card Wrapper ─────────────────────────────────────

function SidebarCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  mono,
  href,
}: {
  label: string;
  value: string;
  mono?: boolean;
  href?: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      {href ? (
        <a
          href={href}
          className="text-sm font-medium text-primary hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
      )}
    </div>
  );
}

// ── Customer Card ────────────────────────────────────────────

function CustomerCard({ job }: { job: Job }) {
  const contact = job.contacts?.[0]?.contact;
  const account = job.assigned_account;

  return (
    <SidebarCard icon={User} title="Customer">
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
  );
}

// ── Property Card ────────────────────────────────────────────

function PropertyCard({ job }: { job: Job }) {
  const prop = job.assigned_property;

  return (
    <SidebarCard icon={Home} title="Property">
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
            <Field label="Type" value={prop.property_type} />
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
  );
}

// ── Financials Card ──────────────────────────────────────────

function FinancialsCard({ job }: { job: Job }) {
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

  if (rows.length === 0) {
    return (
      <SidebarCard icon={DollarSign} title="Financials">
        <p className="text-sm text-muted-foreground">No financial data yet</p>
      </SidebarCard>
    );
  }

  return (
    <SidebarCard icon={DollarSign} title="Financials">
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono font-medium">{value}</span>
          </div>
        ))}
      </div>
    </SidebarCard>
  );
}

// ── Key Dates Card ───────────────────────────────────────────

function DatesCard({ job }: { job: Job }) {
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

  if (dates.length === 0) {
    return (
      <SidebarCard icon={Calendar} title="Key Dates">
        <p className="text-sm text-muted-foreground">No dates recorded yet</p>
      </SidebarCard>
    );
  }

  return (
    <SidebarCard icon={Calendar} title="Key Dates">
      <div className="space-y-2">
        {dates.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </SidebarCard>
  );
}

// ── Assigned Team Card ───────────────────────────────────────

function TeamCard({ job }: { job: Job }) {
  return (
    <SidebarCard icon={Users} title="Assigned Team">
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
    </div>
  );
}
