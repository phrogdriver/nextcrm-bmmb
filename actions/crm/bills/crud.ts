"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const revalidate = () => revalidatePath("/[locale]/(routes)/crm/opportunities", "page");

export const getBillsByJob = async (jobId: string) => {
  try {
    const data = await (prismadb as any).crm_Bills.findMany({
      where: { job_id: jobId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return JSON.parse(JSON.stringify(data, (_, v) => typeof v === "bigint" ? v.toString() : v));
  } catch (error) {
    console.error("getBillsByJob error:", error);
    return [];
  }
};

export const createBill = async (data: {
  job_id: string;
  purchase_order_id?: string;
  vendor_id?: string;
  vendor_name: string;
  description?: string;
  amount: string;
  due_date?: Date;
  notes?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const bill = await (prismadb as any).crm_Bills.create({
      data: { ...data, createdBy: session.user.id },
    });
    revalidate();
    return { data: bill };
  } catch (error) {
    console.error("[CREATE_BILL]", error);
    return { error: "Failed to create bill" };
  }
};

export const updateBill = async (id: string, fields: Record<string, unknown>) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const bill = await (prismadb as any).crm_Bills.update({ where: { id }, data: fields });
    revalidate();
    return { data: bill };
  } catch (error) {
    console.error("[UPDATE_BILL]", error);
    return { error: "Failed to update bill" };
  }
};

export const deleteBill = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_Bills.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });
    revalidate();
    return { data: true };
  } catch (error) {
    console.error("[DELETE_BILL]", error);
    return { error: "Failed to delete bill" };
  }
};
