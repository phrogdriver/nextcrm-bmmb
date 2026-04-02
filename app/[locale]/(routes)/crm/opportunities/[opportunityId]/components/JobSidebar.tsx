"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { AddressAutocomplete, type ParsedAddress } from "@/components/ui/address-autocomplete";

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
  const contacts = (job.contacts ?? []).map((c: any) => c.contact).filter(Boolean) as Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    mobile_phone: string | null;
    office_phone: string | null;
  }>;
  const account = job.assigned_account;
  const isLocked = !!account; // once set, can't change

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"search" | "create">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: string; name: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const router = useRouter();

  const handleSearch = async () => {
    if (query.length < 2) return;
    setSearching(true);
    const { searchAccounts } = await import("@/actions/crm/accounts/search-accounts");
    const result = await searchAccounts({ search: query });
    setResults(result.accounts);
    setSearching(false);
  };

  const handleLink = async (accountId: string) => {
    setSaving(true);
    const { linkAccountToJob } = await import("@/actions/crm/accounts/link-account-to-job");
    const result = await linkAccountToJob(accountId, job.id);
    setSaving(false);
    if (!result.error) {
      setOpen(false);
      router.refresh();
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const { createAccount } = await import("@/actions/crm/accounts/create-account");
    const result = await createAccount({ name: newName.trim() });
    if (result.data) {
      const { linkAccountToJob } = await import("@/actions/crm/accounts/link-account-to-job");
      await linkAccountToJob(result.data.id, job.id);
    }
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <SidebarCard
        icon={User}
        title="Customer"
        onEdit={isLocked ? undefined : () => setOpen(true)}
      >
        <div className="space-y-3">
          {/* Customer name — links to account detail */}
          {account && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Customer</p>
              <Link href={`/crm/accounts/${account.id}`} className="text-sm font-semibold text-primary hover:underline">
                {account.name}
              </Link>
            </div>
          )}

          {/* Contacts */}
          {contacts.length > 0 ? (
            <div className="space-y-3">
              {contacts.length > 1 && (
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Contacts ({contacts.length})
                </p>
              )}
              {!account && contacts.length === 1 && (
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
              )}
              {contacts.map((contact) => (
                <div key={contact.id} className="space-y-0.5">
                  <Link href={`/crm/contacts/${contact.id}`} className="text-sm font-medium text-primary hover:underline block">
                    {contact.first_name} {contact.last_name}
                  </Link>
                  {contact.mobile_phone && (
                    <a
                      href={`tel:${contact.mobile_phone}`}
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {contact.mobile_phone}
                    </a>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : !account ? (
            <p className="text-sm text-muted-foreground">No customer assigned</p>
          ) : null}
        </div>
      </SidebarCard>

      {/* Search / Create sheet — only available when no account set */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {mode === "create" ? "New Customer" : "Assign Customer"}
            </SheetTitle>
          </SheetHeader>

          {mode === "search" && (
            <div className="space-y-4 mt-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name..."
                  value={query}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searching} size="sm">
                  {searching ? "..." : "Search"}
                </Button>
              </div>
              {results.length > 0 && (
                <div className="space-y-1">
                  {results.map((a) => (
                    <button
                      key={a.id}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
                      onClick={() => handleLink(a.id)}
                      disabled={saving}
                    >
                      <p className="text-sm font-medium">{a.name}</p>
                    </button>
                  ))}
                </div>
              )}
              {results.length === 0 && query.length >= 2 && !searching && (
                <p className="text-sm text-muted-foreground">No accounts found.</p>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setMode("create"); setNewName(query); }}
              >
                + Create New Customer
              </Button>
            </div>
          )}

          {mode === "create" && (
            <div className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <Label htmlFor="account-name">Customer Name <span className="text-destructive">*</span></Label>
                <Input
                  id="account-name"
                  value={newName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setMode("search")} disabled={saving}>
                  Back
                </Button>
                <Button onClick={handleCreate} disabled={saving || !newName.trim()}>
                  {saving ? "Creating..." : "Create & Assign"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ── Property Card ────────────────────────────────────────────

function PropertyCard({ job }: { job: Job }) {
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "search" | "create">("view");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const router = useRouter();

  const prop = job.assigned_property;

  const openEdit = () => {
    if (prop) {
      setMode("edit");
      setFormValues({
        address: str(prop.address),
        city: str(prop.city),
        state: str(prop.state),
        zip: str(prop.zip),
        property_type: str(prop.property_type),
        companycam_id: str(prop.companycam_id),
      });
    } else {
      setMode("search");
    }
    setEditing(true);
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setSearching(true);
    const { searchProperties } = await import("@/actions/crm/properties/get-properties");
    const results = await searchProperties(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const handleLink = async (propertyId: string) => {
    setSaving(true);
    const { linkPropertyToJob } = await import("@/actions/crm/properties/get-properties");
    const result = await linkPropertyToJob(propertyId, job.id);
    setSaving(false);
    if (!result.error) {
      setEditing(false);
      router.refresh();
    }
  };

  const handleCreate = async () => {
    if (!formValues.address) return;
    setSaving(true);
    const { createProperty } = await import("@/actions/crm/properties/get-properties");
    const result = await createProperty({
      address: formValues.address,
      city: formValues.city || undefined,
      state: formValues.state || undefined,
      zip: formValues.zip || undefined,
      lat: formValues.lat ? Number(formValues.lat) : undefined,
      lng: formValues.lng ? Number(formValues.lng) : undefined,
      property_type: formValues.property_type || undefined,
      companycam_id: formValues.companycam_id || undefined,
      jobId: job.id,
    });
    setSaving(false);
    if (!result.error) {
      setEditing(false);
      router.refresh();
    }
  };

  const handleUpdate = async () => {
    if (!prop) return;
    setSaving(true);
    const { updateProperty } = await import("@/actions/crm/properties/get-properties");
    const changed: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(formValues)) {
      if (val !== str((prop as any)[key])) {
        changed[key] = val || null;
      }
    }
    if (Object.keys(changed).length > 0) {
      await updateProperty(prop.id, changed);
    }
    setSaving(false);
    setEditing(false);
    router.refresh();
  };

  const propFields = [
    { key: "address", label: "Address", required: true },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "zip", label: "ZIP" },
    { key: "property_type", label: "Property Type" },
    { key: "companycam_id", label: "CompanyCam ID" },
  ];

  return (
    <>
      <SidebarCard icon={Home} title="Property" onEdit={openEdit}>
        {prop ? (
          <div className="space-y-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([prop.address, prop.city, prop.state, prop.zip].filter(Boolean).join(", "))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-1.5 text-primary hover:underline"
            >
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="text-sm">
                {prop.address}
                {prop.city && `, ${prop.city}`}
                {prop.state && `, ${prop.state}`}
                {prop.zip && ` ${prop.zip}`}
              </span>
            </a>
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

      <Sheet open={editing} onOpenChange={setEditing}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {mode === "edit" ? "Edit Property" : mode === "create" ? "New Property" : "Link Property"}
            </SheetTitle>
          </SheetHeader>

          {/* Search mode */}
          {mode === "search" && (
            <div className="space-y-4 mt-6">
              <AddressAutocomplete
                placeholder="Start typing an address..."
                onSelect={(parsed: ParsedAddress) => {
                  setFormValues({
                    address: parsed.address,
                    city: parsed.city,
                    state: parsed.state,
                    zip: parsed.zip,
                    lat: parsed.lat?.toString() ?? "",
                    lng: parsed.lng?.toString() ?? "",
                  });
                  setMode("create");
                }}
                onChange={(val) => setSearchQuery(val)}
              />
              {searchQuery.length >= 3 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Existing Properties</p>
                  <Button size="sm" variant="outline" className="mb-2" onClick={handleSearch} disabled={searching}>
                    {searching ? "Searching..." : "Search existing"}
                  </Button>
                  {searchResults.length > 0 && (
                    <div className="space-y-1">
                      {searchResults.map((p) => (
                        <button
                          key={p.id}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
                          onClick={() => handleLink(p.id)}
                          disabled={saving}
                        >
                          <p className="text-sm font-medium">{p.address}</p>
                          <p className="text-xs text-muted-foreground">
                            {[p.city, p.state, p.zip].filter(Boolean).join(", ")}
                            {p._count.jobs > 0 && ` · ${p._count.jobs} job${p._count.jobs > 1 ? "s" : ""}`}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Create / Edit mode */}
          {(mode === "create" || mode === "edit") && (
            <div className="space-y-4 mt-6">
              {/* Address field with Google autocomplete */}
              <div className="space-y-1.5">
                <Label>Address <span className="text-destructive ml-1">*</span></Label>
                <AddressAutocomplete
                  value={formValues.address ?? ""}
                  onChange={(val) => setFormValues((prev) => ({ ...prev, address: val }))}
                  onSelect={(parsed: ParsedAddress) => {
                    setFormValues((prev) => ({
                      ...prev,
                      address: parsed.address,
                      city: parsed.city,
                      state: parsed.state,
                      zip: parsed.zip,
                      lat: parsed.lat?.toString() ?? "",
                      lng: parsed.lng?.toString() ?? "",
                    }));
                  }}
                />
              </div>
              {/* Remaining fields */}
              {propFields.filter((f) => f.key !== "address").map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={f.key}>{f.label}</Label>
                  <Input
                    id={f.key}
                    value={formValues[f.key] ?? ""}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </Button>
                {mode === "edit" && prop && (
                  <Button
                    variant="outline"
                    onClick={() => { setMode("search"); setSearchQuery(""); setSearchResults([]); }}
                    disabled={saving}
                  >
                    Change Property
                  </Button>
                )}
                <Button
                  onClick={mode === "create" ? handleCreate : handleUpdate}
                  disabled={saving || !formValues.address}
                >
                  {saving ? "Saving..." : mode === "create" ? "Create & Link" : "Save"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ── Financials Card ──────────────────────────────────────────

function FinancialsCard({ job }: { job: Job }) {
  // Financials are calculated/derived — no direct edit

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
    <SidebarCard icon={DollarSign} title="Financials">
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
  );
}

// ── Key Dates Card ───────────────────────────────────────────

function DatesCard({ job, isAdmin }: { job: Job; isAdmin: boolean }) {
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
      <SidebarCard icon={Calendar} title="Key Dates" onEdit={isAdmin ? () => setEditing(true) : undefined}>
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
    {
      key: "payor_type",
      label: "Payor Type",
      type: "select",
      options: [
        { value: "INSURANCE", label: "Insurance" },
        { value: "CASH_RETAIL", label: "Cash / Retail" },
      ],
    },
    {
      key: "project_type",
      label: "Project Type",
      type: "select",
      options: [
        { value: "Roof Replacement", label: "Roof Replacement" },
        { value: "Roof Repair", label: "Roof Repair" },
        { value: "Gutter", label: "Gutter" },
        { value: "Paint", label: "Paint" },
        { value: "Other", label: "Other" },
      ],
    },
    {
      key: "property_type",
      label: "Property Type",
      type: "select",
      options: [
        { value: "Residential", label: "Residential" },
        { value: "Commercial", label: "Commercial" },
      ],
    },
    {
      key: "roof_type",
      label: "Roof Type",
      type: "select",
      options: [
        { value: "Asphalt Shingle", label: "Asphalt Shingle" },
        { value: "Metal", label: "Metal" },
        { value: "Tile", label: "Tile" },
        { value: "Flat/TPO", label: "Flat / TPO" },
        { value: "Slate", label: "Slate" },
        { value: "Wood Shake", label: "Wood Shake" },
        { value: "Other", label: "Other" },
      ],
    },
    {
      key: "primary_lead_source",
      label: "Primary Lead Source",
      type: "select",
      options: [
        { value: "Company", label: "Company" },
        { value: "Sales Rep", label: "Sales Rep" },
      ],
    },
    {
      key: "secondary_lead_source",
      label: "Secondary Lead Source",
      type: "select",
      options: [
        { value: "D2D Canvassing", label: "D2D Canvassing" },
        { value: "Inbound Call", label: "Inbound Call" },
        { value: "Web Form", label: "Web Form" },
        { value: "Angi", label: "Angi" },
        { value: "Google LSA", label: "Google LSA" },
        { value: "Google Ads", label: "Google Ads" },
        { value: "Facebook Ads", label: "Facebook Ads" },
        { value: "Referral", label: "Referral" },
        { value: "Repeat Customer", label: "Repeat Customer" },
        { value: "Webchat", label: "Webchat" },
        { value: "Other", label: "Other" },
      ],
    },
    {
      key: "territory",
      label: "Territory",
      type: "select",
      options: [
        { value: "Colorado Springs", label: "Colorado Springs" },
        { value: "Denver", label: "Denver" },
        { value: "Austin", label: "Austin" },
      ],
    },
    { key: "description", label: "Notes / Description", type: "textarea" },
  ];

  const initialValues: Record<string, string> = {};
  for (const f of fields) {
    initialValues[f.key] = str((job as any)[f.key]);
  }

  const infoRows = ([
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
  isAdmin?: boolean;
}

export function JobSidebar({ job, isAdmin = false }: JobSidebarProps) {
  return (
    <div className="space-y-4">
      <CustomerCard job={job} />
      <PropertyCard job={job} />
      <FinancialsCard job={job} />
      <DatesCard job={job} isAdmin={isAdmin} />
      <TeamCard job={job} />
      <AdditionalInfoCard job={job} />
    </div>
  );
}
