"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const createPurchaseOrder = async (data: {
  job_id: string;
  vendor_name: string;
  description?: string;
  category?: string;
  amount?: string;
  scheduled_date?: Date;
  notes?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    // Auto-generate PO number
    const existing = await (prismadb as any).crm_Purchase_Orders.count({
      where: { job_id: data.job_id },
    });
    const job = await prismadb.crm_Opportunities.findUnique({
      where: { id: data.job_id },
      select: { job_number: true },
    });
    const poNumber = `PO-${job?.job_number ?? "000"}-${String(existing + 1).padStart(2, "0")}`;

    const po = await (prismadb as any).crm_Purchase_Orders.create({
      data: {
        job_id: data.job_id,
        po_number: poNumber,
        vendor_name: data.vendor_name,
        description: data.description || undefined,
        category: data.category || undefined,
        amount: data.amount || undefined,
        scheduled_date: data.scheduled_date || undefined,
        notes: data.notes || undefined,
        status: "ORDERED",
        createdBy: session.user.id,
      },
    });

    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return { data: po };
  } catch (error) {
    console.error("[CREATE_PURCHASE_ORDER]", error);
    return { error: "Failed to create purchase order" };
  }
};
