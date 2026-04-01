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
import { InsuranceCard } from "./InsuranceCard";
import { JobSidebar } from "./JobSidebar";
import { StageTransitionForm } from "./StageTransitionForm";

// Reuse existing activity + audit components
import { ActivitiesView } from "@/components/crm/activities/ActivitiesView";
import { ActivityForm } from "@/components/crm/activities/ActivityForm";
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

  const handleTransition = useCallback((stageId: string, stageName: string) => {
    setTransitionTarget({ id: stageId, name: stageName });
  }, []);

  const handleTransitioned = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleNoteSaved = useCallback((_activity: ActivityWithLinks) => {
    setShowNoteForm(false);
    router.refresh();
  }, [router]);

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
            <div className="flex-1 min-w-0 space-y-6">
              {/* Stage Progress */}
              <StageProgressBar
                stages={stages}
                currentStageId={job.sales_stage}
                currentStageName={currentStage?.name ?? null}
                highLevelStage={job.high_level_stage}
                isInsurance={isInsurance}
              />

              {/* Guidance */}
              <GuidancePanel
                stageName={currentStage?.name ?? ""}
                guidance={guidance}
              />

              {/* Insurance Card (conditional) */}
              <InsuranceCard job={job} />

              {/* Activity Timeline + Audit History */}
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
            </div>

            {/* Sidebar (sticky on desktop) */}
            <div className="w-full lg:w-80 xl:w-96 shrink-0">
              <div className="lg:sticky lg:top-[73px]">
                <JobSidebar job={job} />
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
      <ActivityForm
        open={showNoteForm}
        onOpenChange={setShowNoteForm}
        entityType="opportunity"
        entityId={job.id}
        onSaved={handleNoteSaved}
      />
    </div>
  );
}
