"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const revalidate = () => revalidatePath("/[locale]/(routes)/crm/opportunities", "page");

export const getInsuranceClaimsByJob = async (jobId: string) => {
  try {
    const data = await (prismadb as any).crm_Insurance_Claims.findMany({
      where: { job_id: jobId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        adjuster: {
          select: { id: true, first_name: true, last_name: true, mobile_phone: true, email: true },
        },
      },
    });
    return JSON.parse(JSON.stringify(data, (_, v) => typeof v === "bigint" ? v.toString() : v));
  } catch (error) {
    console.error("getInsuranceClaimsByJob error:", error);
    return [];
  }
};

export const createInsuranceClaim = async (data: {
  job_id: string;
  insurance_company: string;
  claim_number?: string;
  policy_number?: string;
  date_of_loss?: Date;
  adjuster_id?: string;
  adjuster_name?: string;
  adjuster_phone?: string;
  adjuster_email?: string;
  acv_amount?: string;
  deductible?: string;
  date_filed?: Date;
  notes?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const claim = await (prismadb as any).crm_Insurance_Claims.create({
      data: { ...data, createdBy: session.user.id },
    });
    revalidate();
    return { data: claim };
  } catch (error) {
    console.error("[CREATE_INSURANCE_CLAIM]", error);
    return { error: "Failed to create insurance claim" };
  }
};

export const updateInsuranceClaim = async (id: string, fields: Record<string, unknown>) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const claim = await (prismadb as any).crm_Insurance_Claims.update({ where: { id }, data: fields });
    revalidate();
    return { data: claim };
  } catch (error) {
    console.error("[UPDATE_INSURANCE_CLAIM]", error);
    return { error: "Failed to update insurance claim" };
  }
};

export const deleteInsuranceClaim = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_Insurance_Claims.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });
    revalidate();
    return { data: true };
  } catch (error) {
    console.error("[DELETE_INSURANCE_CLAIM]", error);
    return { error: "Failed to delete insurance claim" };
  }
};
