"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const revalidate = () => revalidatePath("/[locale]/(routes)/crm/opportunities", "page");

export const getCreditNotesByJob = async (jobId: string) => {
  try {
    const data = await (prismadb as any).crm_Credit_Notes.findMany({
      where: { job_id: jobId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return JSON.parse(JSON.stringify(data, (_, v) => typeof v === "bigint" ? v.toString() : v));
  } catch (error) {
    console.error("getCreditNotesByJob error:", error);
    return [];
  }
};

export const createCreditNote = async (data: {
  job_id: string;
  reason?: string;
  amount: string;
  applied_to_invoice?: string;
  notes?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const existing = await (prismadb as any).crm_Credit_Notes.count({
      where: { job_id: data.job_id },
    });
    const job = await prismadb.crm_Opportunities.findUnique({
      where: { id: data.job_id },
      select: { job_number: true },
    });
    const cnNumber = `CN-${job?.job_number ?? "000"}-${String(existing + 1).padStart(2, "0")}`;

    const credit = await (prismadb as any).crm_Credit_Notes.create({
      data: {
        ...data,
        credit_number: cnNumber,
        createdBy: session.user.id,
      },
    });

    revalidate();
    return { data: credit };
  } catch (error) {
    console.error("[CREATE_CREDIT_NOTE]", error);
    return { error: "Failed to create credit note" };
  }
};

export const updateCreditNote = async (id: string, fields: Record<string, unknown>) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const credit = await (prismadb as any).crm_Credit_Notes.update({
      where: { id },
      data: fields,
    });
    revalidate();
    return { data: credit };
  } catch (error) {
    console.error("[UPDATE_CREDIT_NOTE]", error);
    return { error: "Failed to update credit note" };
  }
};

export const deleteCreditNote = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_Credit_Notes.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });
    revalidate();
    return { data: true };
  } catch (error) {
    console.error("[DELETE_CREDIT_NOTE]", error);
    return { error: "Failed to delete credit note" };
  }
};
