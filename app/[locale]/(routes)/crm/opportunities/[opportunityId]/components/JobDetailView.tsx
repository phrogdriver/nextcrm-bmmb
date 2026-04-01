"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { type Job, type PipelineStage } from "@/actions/crm/get-job";
import type { ActivityWithLinks, ActivityCursor } from "@/actions/crm/activities/get-activities-by-entity";
import { type StageGuidance } from "@/lib/pipeline/stage-guidance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuditLogByEntity } from "@/actions/crm/audit-log/get-audit-log-by-entity";

import { JobHeader } from "./JobHeader";
import { StageProgressBar } from "./StageProgressBar";
import { GuidancePanel } from "./GuidancePanel";
import { JobSidebar } from "./JobSidebar";
import { StageTransitionForm } from "./StageTransitionForm";

// Section cards
import { AppointmentsCard } from "./AppointmentsCard";
import { TasksCard } from "./TasksCard";
import { WorkOrdersCard } from "./WorkOrdersCard";
import { BillingCard } from "./BillingCard";
import { ContractWorksheetCard } from "./ContractWorksheetCard";
import { DocumentsCard } from "./DocumentsCard";
import { InsuranceCard } from "./InsuranceCard";
import { PropertyPhotosCard } from "./PropertyPhotosCard";
import { MeasurementsCard } from "./MeasurementsCard";

// Existing activity + audit components
import { ActivitiesView } from "@/components/crm/activities/ActivitiesView";
import { QuickNoteForm } from "./QuickNoteForm";
import { AuditTimeline } from "@/components/crm/audit-log/Timeline";

interface JobDetailViewProps {
  job: Job;
  stages: PipelineStage[];
  guidance: StageGuidance | null;
  initialActivities: {
    data: ActivityWithLinks[];
    nextCursor: ActivityCursor | null;
  };
  auditLog: Awaited<ReturnType<typeof getAuditLogByEntity>>;
  isAdmin: boolean;
}

export function JobDetailView({
  job,
  stages,
  guidance,
  initialActivities,
  auditLog,
  isAdmin,
}: JobDetailViewProps) {
  const router = useRouter();
  const [transitionTarget, setTransitionTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showNoteForm, setShowNoteForm] = useState(false);

  const isInsurance = job.payor_type === "INSURANCE";
  const currentStage = stages.find((s) => s.id === job.sales_stage) ?? null;

  const propertyAddress = job.assigned_property
    ? `${job.assigned_property.address}${job.assigned_property.city ? `, ${job.assigned_property.city}` : ""}`
    : undefined;

  const handleTransition = useCallback((stageId: string, stageName: string) => {
    setTransitionTarget({ id: stageId, name: stageName });
  }, []);

  const handleTransitioned = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleNoteClosed = useCallback(() => {
    setShowNoteForm(false);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <JobHeader
        job={job}
        stages={stages}
        onTransition={handleTransition}
        onLogNote={() => setShowNoteForm(true)}
      />

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="px-4 py-6 sm:px-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Column */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* 1. Always visible: Stage Progress */}
              <StageProgressBar
                stages={stages}
                currentStageId={job.sales_stage}
                currentStageName={currentStage?.name ?? null}
                highLevelStage={job.high_level_stage}
                isInsurance={isInsurance}
              />

              {/* 2. Always visible: Guidance */}
              <GuidancePanel
                stageName={currentStage?.name ?? ""}
                guidance={guidance}
              />

              {/* 3. Open: Appointments */}
              <AppointmentsCard />

              {/* 4. Open: Tasks */}
              <TasksCard />

              {/* 5. Open: Activity Timeline + Audit History */}
              <Tabs defaultValue="activity">
                <TabsList>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="activity" className="mt-4">
                  <ActivitiesView
                    entityType="opportunity"
                    entityId={job.id}
                    initialData={initialActivities}
                  />
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                  <AuditTimeline
                    entityType="opportunity"
                    entityId={job.id}
                    initialData={auditLog}
                    isAdmin={isAdmin}
                  />
                </TabsContent>
              </Tabs>

              {/* 6. Collapsed: Work Orders */}
              <WorkOrdersCard />

              {/* 7. Collapsed: Billing */}
              <BillingCard />

              {/* 8. Collapsed: Contract Worksheet */}
              <ContractWorksheetCard />

              {/* 9. Collapsed: Documents */}
              <DocumentsCard />

              {/* 10. Collapsed: Insurance (conditional) */}
              <InsuranceCard job={job} />

              {/* 11. Collapsed: Property Photos */}
              <PropertyPhotosCard address={propertyAddress} />

              {/* 12. Collapsed: Measurements */}
              <MeasurementsCard />
            </div>

            {/* Sidebar (sticky on desktop) */}
            <div className="w-full lg:w-80 xl:w-96 shrink-0">
              <div className="lg:sticky lg:top-0">
                <JobSidebar job={job} isAdmin={isAdmin} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Transition Sheet */}
      <StageTransitionForm
        open={transitionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setTransitionTarget(null);
        }}
        jobId={job.id}
        targetStage={transitionTarget}
        onTransitioned={handleTransitioned}
      />

      {/* Quick Note Sheet */}
      <QuickNoteForm
        open={showNoteForm}
        onOpenChange={setShowNoteForm}
        entityType="opportunity"
        entityId={job.id}
      />
    </div>
  );
}
