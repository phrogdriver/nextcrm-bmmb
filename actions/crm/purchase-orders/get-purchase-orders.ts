"use server";
import { prismadb } from "@/lib/prisma";

export type PurchaseOrder = {
  id: string;
  job_id: string;
  po_number: string | null;
  vendor_name: string;
  description: string | null;
  category: string | null;
  status: string;
  amount: string | null;
  scheduled_date: Date | null;
  completed_date: Date | null;
  notes: string | null;
  createdAt: Date;
  bills: Array<{ id: string; amount: string; status: string }>;
  vendor_credits: Array<{ id: string; amount: string }>;
  tasks: Array<{ id: string; title: string; status: string }>;
};

export const getPurchaseOrdersByJob = async (jobId: string): Promise<PurchaseOrder[]> => {
  try {
    const data = await (prismadb as any).crm_Purchase_Orders.findMany({
      where: { job_id: jobId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        bills: {
          where: { deletedAt: null },
          select: { id: true, amount: true, status: true },
        },
        vendor_credits: {
          where: { deletedAt: null },
          select: { id: true, amount: true },
        },
        tasks: {
          where: { deletedAt: null },
          select: { id: true, title: true, status: true },
        },
      },
    });

    // Serialize decimals
    return JSON.parse(
      JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v))
    );
  } catch (error) {
    console.error("getPurchaseOrdersByJob error:", error);
    return [];
  }
};
