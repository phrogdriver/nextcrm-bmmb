"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const revalidate = () => revalidatePath("/[locale]/(routes)/crm/opportunities", "page");

export const getExpensesByJob = async (jobId: string) => {
  try {
    const data = await (prismadb as any).crm_Expenses.findMany({
      where: { job_id: jobId, deletedAt: null },
      orderBy: { date: "desc" },
      include: {
        submitted_user: { select: { id: true, name: true } },
      },
    });
    return JSON.parse(JSON.stringify(data, (_, v) => typeof v === "bigint" ? v.toString() : v));
  } catch (error) {
    console.error("getExpensesByJob error:", error);
    return [];
  }
};

export const createExpense = async (data: {
  job_id: string;
  description: string;
  amount: string;
  date: Date;
  payment_method?: string;
  notes?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const expense = await (prismadb as any).crm_Expenses.create({
      data: { ...data, submitted_by: session.user.id },
    });
    revalidate();
    return { data: expense };
  } catch (error) {
    console.error("[CREATE_EXPENSE]", error);
    return { error: "Failed to create expense" };
  }
};

export const updateExpense = async (id: string, fields: Record<string, unknown>) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const expense = await (prismadb as any).crm_Expenses.update({ where: { id }, data: fields });
    revalidate();
    return { data: expense };
  } catch (error) {
    console.error("[UPDATE_EXPENSE]", error);
    return { error: "Failed to update expense" };
  }
};

export const deleteExpense = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_Expenses.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });
    revalidate();
    return { data: true };
  } catch (error) {
    console.error("[DELETE_EXPENSE]", error);
    return { error: "Failed to delete expense" };
  }
};
