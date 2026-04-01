import React from "react";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { getJob, getAllStages } from "@/actions/crm/get-job";
import { getActivitiesByEntity } from "@/actions/crm/activities/get-activities-by-entity";
import { getAuditLogByEntity } from "@/actions/crm/audit-log/get-audit-log-by-entity";
import { getStageGuidance } from "@/lib/pipeline/stage-guidance";

import { JobDetailView } from "./components/JobDetailView";

const OpportunityView = async (
  props: {
    params: Promise<{ opportunityId: string }>;
  }
) => {
  const params = await props.params;
  const { opportunityId } = params;

  const [job, stages, session] = await Promise.all([
    getJob(opportunityId),
    getAllStages(),
    getServerSession(authOptions),
  ]);

  if (!job) return <div>Job not found</div>;

  const [initialActivities, auditLog] = await Promise.all([
    getActivitiesByEntity("opportunity", opportunityId),
    getAuditLogByEntity("opportunity", opportunityId),
  ]);

  // Look up guidance for the current stage
  const currentStage = stages.find(
    (s: { id: string }) => s.id === job.sales_stage
  );
  const guidance = currentStage
    ? getStageGuidance(currentStage.name) ?? null
    : null;

  const isAdmin = session?.user?.isAdmin ?? false;

  return (
    <JobDetailView
      job={job}
      stages={stages}
      guidance={guidance}
      initialActivities={initialActivities}
      auditLog={auditLog}
      isAdmin={isAdmin}
    />
  );
};

export default OpportunityView;
