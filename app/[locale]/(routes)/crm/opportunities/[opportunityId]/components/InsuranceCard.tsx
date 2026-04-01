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

// Mock fallback for demo — shown when payor_type not set
const MOCK_INSURANCE = {
  company: "State Farm",
  claim: "CLM-2026-04821",
  policy: "POL-882991",
  dol: "2026-02-14",
  acv: "14200",
  deductible: "1500",
  supplement: "3800",
  claimSubmitted: "2026-02-28",
  claimApproved: "2026-03-20",
};

export function InsuranceCard({ job }: InsuranceCardProps) {
  // Show for insurance jobs OR when no payor_type set (demo mode)
  const isInsurance = job.payor_type === "INSURANCE" || !job.payor_type;
  if (!isInsurance) return null;

  const co = job.insurance_company ?? MOCK_INSURANCE.company;
  const claim = job.claim_number ?? MOCK_INSURANCE.claim;
  const acv = job.acv_deposit ?? MOCK_INSURANCE.acv;

  const summary = (
    <>
      {co} · {claim} · ACV {fmtCurrency(acv)}
    </>
  );

  return (
    <CollapsibleCard title="Insurance Details" icon={Shield} summary={summary}>
      <Badge variant="outline" className="text-xs mb-3">
        Supplementing
      </Badge>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">Insurance Company</p>
          <p className="font-medium">{co}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">Claim Number</p>
          <p className="font-medium">{claim}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">Policy Number</p>
          <p className="font-medium">{job.policy_number ?? MOCK_INSURANCE.policy}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">Date of Loss</p>
          <p className="font-medium">{fmtDate(job.date_of_loss ?? MOCK_INSURANCE.dol)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">ACV Deposit</p>
          <p className="font-mono font-medium">{fmtCurrency(acv)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">Deductible</p>
          <p className="font-mono font-medium">{fmtCurrency(job.deductible ?? MOCK_INSURANCE.deductible)}</p>
        </div>
        <div className="space-y-0.5">
            <p className="text-muted-foreground text-xs">Supplement Amount</p>
            <p className="font-mono font-medium">{fmtCurrency(job.supplement_amount ?? MOCK_INSURANCE.supplement)}</p>
          </div>
        <div className="space-y-0.5 col-span-2">
          <p className="text-muted-foreground text-xs">Adjuster</p>
          <p className="font-medium">
            {job.adjuster
              ? `${job.adjuster.first_name} ${job.adjuster.last_name}`
              : "Sarah Chen"}
            <span className="text-muted-foreground ml-2">
              {job.adjuster?.mobile_phone ?? "(719) 555-0142"}
            </span>
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">Claim Submitted</p>
          <p className="font-medium">{fmtDate(job.date_claim_submitted ?? MOCK_INSURANCE.claimSubmitted)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs">Claim Approved</p>
          <p className="font-medium">{fmtDate(job.date_claim_approved ?? MOCK_INSURANCE.claimApproved)}</p>
        </div>
      </div>
    </CollapsibleCard>
  );
}
