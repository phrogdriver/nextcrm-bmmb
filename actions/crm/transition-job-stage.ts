"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog, diffObjects } from "@/lib/audit-log";

export const transitionJobStage = async (data: {
  jobId: string;
  toStageId: string;
  formData?: Record<string, unknown>;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const userId = session.user.id;
  const { jobId, toStageId, formData } = data;

  try {
    const job = await prismadb.crm_Opportunities.findUnique({
      where: { id: jobId, deletedAt: null },
      include: { assigned_sales_stage: true },
    });

    if (!job) return { error: "Job not found" };

    const toStage = await prismadb.crm_Opportunities_Sales_Stages.findUnique({
      where: { id: toStageId },
    });

    if (!toStage) return { error: "Target stage not found" };

    const serialize = (obj: any) =>
      JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? v.toString() : v)));

    const before = serialize(job);

    // Build update payload from transition form data
    const updateData: Record<string, unknown> = {
      sales_stage: toStageId,
      high_level_stage: toStage.high_level_stage,
      updatedBy: userId,
      last_activity: new Date(),
      last_activity_by: userId,
    };

    // Map common transition form fields to opportunity columns
    if (formData) {
      const fieldMap: Record<string, string> = {
        date_contract_signed: "date_contract_signed",
        date_inspected: "date_inspected",
        date_claim_submitted: "date_claim_submitted",
        date_claim_approved: "date_claim_approved",
        date_depreciation_released: "date_depreciation_released",
        date_work_in_progress: "date_work_in_progress",
        date_completed: "date_completed",
        date_closed: "date_closed",
        date_lost: "date_lost",
        follow_up_date: "follow_up_date",
        forecasted_build_date: "forecasted_build_date",
        lost_deal_reason: "lost_deal_reason",
        lost_deal_notes: "lost_deal_notes",
        payor_type: "payor_type",
        insurance_company: "insurance_company",
        claim_number: "claim_number",
        policy_number: "policy_number",
        date_of_loss: "date_of_loss",
        acv_deposit: "acv_deposit",
        deductible: "deductible",
        supplement_amount: "supplement_amount",
        superintendent_id: "superintendent_id",
      };

      for (const [key, col] of Object.entries(fieldMap)) {
        if (formData[key] !== undefined && formData[key] !== null && formData[key] !== "") {
          updateData[col] = formData[key];
        }
      }
    }

    // If moving to terminal stage, set status
    if (toStage.is_terminal) {
      if (toStage.name === "Closed PIF") {
        updateData.status = "CLOSED";
        if (!updateData.date_closed) updateData.date_closed = new Date();
      } else if (toStage.name === "Lost Deal") {
        updateData.status = "CLOSED";
        if (!updateData.date_lost) updateData.date_lost = new Date();
      } else if (toStage.name === "Exit") {
        updateData.status = "CLOSED";
      }
    }

    // Update the opportunity
    const updated = await prismadb.crm_Opportunities.update({
      where: { id: jobId },
      data: updateData as any,
    });

    // Record stage transition
    await (prismadb as any).crm_Stage_Transitions.create({
      data: {
        job_id: jobId,
        from_stage_id: job.sales_stage,
        to_stage_id: toStageId,
        from_stage_name: job.assigned_sales_stage?.name ?? null,
        to_stage_name: toStage.name,
        form_data: formData ?? undefined,
        transitioned_by: userId,
      },
    });

    // Audit log
    const after = serialize(updated);
    const changes = diffObjects(before, after);
    await writeAuditLog({
      entityType: "opportunity",
      entityId: jobId,
      action: "updated",
      changes,
      userId,
    });

    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return { data: after };
  } catch (error) {
    console.error("[TRANSITION_JOB_STAGE]", error);
    return { error: "Failed to transition stage" };
  }
};
