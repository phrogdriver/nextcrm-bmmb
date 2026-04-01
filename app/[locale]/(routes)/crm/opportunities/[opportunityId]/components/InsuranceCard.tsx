"use client";

import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { type Job } from "@/actions/crm/get-job";
import { format } from "date-fns";
import { CollapsibleCard } from "@/components/crm/CollapsibleCard";

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return format(new Date(d), "MMM d, yyyy");
}

function fmtCurrency(v: string | number | null | undefined): string {
  if (v == null || v === "") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(v));
}

interface InsuranceCardProps {
  job: Job;
}

export function InsuranceCard({ job }: InsuranceCardProps) {
  if (job.payor_type !== "INSURANCE") return null;

  const summary = (
    <>
      {job.insurance_company ?? "Insurance"} · {job.claim_number ?? "No claim #"} · ACV {fmtCurrency(job.acv_deposit)}
    </>
  );

  return (
    <CollapsibleCard title="Insurance Details" icon={Shield} summary={summary}>
      {job.supplementing && (
        <Badge variant="outline" className="text-xs mb-3">
          Supplementing
        </Badge>
      )}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">Insurance Company</p>
          <p className="font-medium">{job.insurance_company ?? "—"}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">Claim Number</p>
          <p className="font-medium">{job.claim_number ?? "—"}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">Policy Number</p>
          <p className="font-medium">{job.policy_number ?? "—"}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">Date of Loss</p>
          <p className="font-medium">{fmtDate(job.date_of_loss)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">ACV Deposit</p>
          <p className="font-mono font-medium">{fmtCurrency(job.acv_deposit)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">Deductible</p>
          <p className="font-mono font-medium">{fmtCurrency(job.deductible)}</p>
        </div>
        {job.supplement_amount && Number(job.supplement_amount) > 0 && (
          <div className="space-y-0.5">
            <p className="text-muted-foreground text-xs">Supplement Amount</p>
            <p className="font-mono font-medium">{fmtCurrency(job.supplement_amount)}</p>
          </div>
        )}
        {job.adjuster && (
          <div className="space-y-0.5 col-span-2">
            <p className="text-muted-foreground text-xs">Adjuster</p>
            <p className="font-medium">
              {job.adjuster.first_name} {job.adjuster.last_name}
              {job.adjuster.mobile_phone && (
                <span className="text-muted-foreground ml-2">
                  {job.adjuster.mobile_phone}
                </span>
              )}
            </p>
          </div>
        )}
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">Claim Submitted</p>
          <p className="font-medium">{fmtDate(job.date_claim_submitted)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">Claim Approved</p>
          <p className="font-medium">{fmtDate(job.date_claim_approved)}</p>
        </div>
        {job.date_depreciation_released && (
          <div className="space-y-0.5">
            <p className="text-muted-foreground text-xs">Depreciation Released</p>
            <p className="font-medium">{fmtDate(job.date_depreciation_released)}</p>
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}
