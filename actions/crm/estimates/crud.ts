"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const revalidate = () => revalidatePath("/[locale]/(routes)/crm/opportunities", "page");

export const getEstimatesByJob = async (jobId: string) => {
  try {
    const data = await (prismadb as any).crm_Estimates.findMany({
      where: { job_id: jobId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        line_items: { orderBy: { sort_order: "asc" } },
        created_by_user: { select: { id: true, name: true } },
      },
    });
    return JSON.parse(JSON.stringify(data, (_, v) => typeof v === "bigint" ? v.toString() : v));
  } catch (error) {
    console.error("getEstimatesByJob error:", error);
    return [];
  }
};

export const createEstimate = async (data: {
  job_id: string;
  title?: string;
  notes?: string;
  line_items?: Array<{
    description: string;
    category?: string;
    quantity?: string;
    unit?: string;
    unit_price?: string;
    amount?: string;
    sort_order?: number;
  }>;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    // Auto-generate estimate number
    const existing = await (prismadb as any).crm_Estimates.count({
      where: { job_id: data.job_id },
    });
    const job = await prismadb.crm_Opportunities.findUnique({
      where: { id: data.job_id },
      select: { job_number: true },
    });
    const estNumber = `EST-${job?.job_number ?? "000"}-${String(existing + 1).padStart(2, "0")}`;

    const { line_items, ...estData } = data;

    const estimate = await (prismadb as any).crm_Estimates.create({
      data: {
        ...estData,
        estimate_number: estNumber,
        createdBy: session.user.id,
        line_items: line_items?.length
          ? { create: line_items }
          : undefined,
      },
      include: { line_items: true },
    });

    revalidate();
    return { data: estimate };
  } catch (error) {
    console.error("[CREATE_ESTIMATE]", error);
    return { error: "Failed to create estimate" };
  }
};

export const updateEstimate = async (id: string, fields: Record<string, unknown>) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const estimate = await (prismadb as any).crm_Estimates.update({
      where: { id },
      data: fields,
    });
    revalidate();
    return { data: estimate };
  } catch (error) {
    console.error("[UPDATE_ESTIMATE]", error);
    return { error: "Failed to update estimate" };
  }
};

export const deleteEstimate = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_Estimates.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });
    revalidate();
    return { data: true };
  } catch (error) {
    console.error("[DELETE_ESTIMATE]", error);
    return { error: "Failed to delete estimate" };
  }
};
