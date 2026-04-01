"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StickyNote, ArrowLeft, Shield, Clock, ChevronDown } from "lucide-react";
import { type Job, type PipelineStage } from "@/actions/crm/get-job";
import { SplitButton } from "./SplitButton";
import { useRouter } from "next/navigation";
import { differenceInDays } from "date-fns";

interface JobHeaderProps {
  job: Job;
  stages: PipelineStage[];
  onTransition: (stageId: string, stageName: string) => void;
  onLogNote: () => void;
}

// Mock fallbacks for demo — remove when real data is populated
const MOCK = {
  customerName: "Mike Arvizu",
  address: "1234 Main St, Colorado Springs",
  pm: "Jackson Coffin",
  stageName: "Claim Approved",
  isInsurance: true,
  daysInStage: 12,
  jobNumber: "23339",
};

export function JobHeader({ job, stages, onTransition, onLogNote }: JobHeaderProps) {
  const router = useRouter();

  const contact = job.contacts?.[0]?.contact;
  const customerName = contact
    ? `${contact.first_name} ${contact.last_name}`
    : job.assigned_account?.name || MOCK.customerName;

  const property = job.assigned_property;
  const address = property
    ? `${property.address}${property.city ? `, ${property.city}` : ""}`
    : MOCK.address;

  const currentStage = stages.find((s) => s.id === job.sales_stage) ?? null;
  const isInsurance = job.payor_type === "INSURANCE" || (!job.payor_type && MOCK.isInsurance);

  // Days in current stage
  const lastTransition = job.stage_transitions?.[0];
  const daysInStage = lastTransition
    ? differenceInDays(new Date(), new Date(lastTransition.transitioned_at))
    : MOCK.daysInStage;

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="px-4 py-3 sm:px-6">
        {/* Top row: back + title + actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 mt-0.5"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-0">
              {/* Job number + customer name */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold truncate">
                  {job.job_number ? `Job #${job.job_number}` : job.name ? job.name : `Job #${MOCK.jobNumber}`}
                </h1>
                <span className="text-lg text-muted-foreground">·</span>
                <span className="text-lg text-muted-foreground truncate">
                  {customerName}
                </span>
              </div>

              {/* Second row: address, PM, badges */}
              <div className="flex items-center gap-3 flex-wrap mt-0.5 text-sm text-muted-foreground">
                <span>{address}</span>
                <span>
                  PM: <span className="text-foreground">{job.assigned_to_user?.name ?? MOCK.pm}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right side: badges + actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {/* Stage badge */}
            <Badge variant="secondary" className="whitespace-nowrap">
              {currentStage?.name ?? MOCK.stageName}
            </Badge>

            {/* Insurance badge */}
            {isInsurance && (
              <Badge variant="outline" className="whitespace-nowrap">
                <Shield className="h-3 w-3 mr-1" />
                Insurance
              </Badge>
            )}

            {/* Days in stage */}
            {daysInStage != null && daysInStage > 0 && (
              <Badge
                variant={daysInStage > 7 ? "destructive" : "outline"}
                className="whitespace-nowrap"
              >
                <Clock className="h-3 w-3 mr-1" />
                {daysInStage}d in stage
              </Badge>
            )}

            {/* Split button — mock fallback when no real stage */}
            {currentStage ? (
              <SplitButton
                currentStage={currentStage}
                stages={stages}
                isInsurance={isInsurance}
                onTransition={onTransition}
              />
            ) : (
              <div className="flex items-stretch">
                <Button size="sm" className="rounded-r-none">
                  Mark {MOCK.stageName}
                </Button>
                <Button size="sm" className="rounded-l-none border-l border-l-primary-foreground/20 px-2">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Log note */}
            <Button variant="outline" size="sm" onClick={onLogNote}>
              <StickyNote className="h-4 w-4 mr-1.5" />
              Note
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
