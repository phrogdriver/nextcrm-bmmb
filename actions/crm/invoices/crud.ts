"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const revalidate = () => revalidatePath("/[locale]/(routes)/crm/opportunities", "page");

export const getInvoicesByJob = async (jobId: string) => {
  try {
    const data = await (prismadb as any).crm_Invoices.findMany({
      where: { job_id: jobId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        customer_payments: {
          where: { deletedAt: null },
          orderBy: { date: "desc" },
        },
        created_by_user: { select: { id: true, name: true } },
      },
    });
    return JSON.parse(JSON.stringify(data, (_, v) => typeof v === "bigint" ? v.toString() : v));
  } catch (error) {
    console.error("getInvoicesByJob error:", error);
    return [];
  }
};

export const createInvoice = async (data: {
  job_id: string;
  title?: string;
  total: string;
  due_date?: Date;
  notes?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const existing = await (prismadb as any).crm_Invoices.count({
      where: { job_id: data.job_id },
    });
    const job = await prismadb.crm_Opportunities.findUnique({
      where: { id: data.job_id },
      select: { job_number: true },
    });
    const invNumber = `INV-${job?.job_number ?? "000"}-${String(existing + 1).padStart(2, "0")}`;

    const invoice = await (prismadb as any).crm_Invoices.create({
      data: {
        ...data,
        invoice_number: invNumber,
        balance_due: data.total,
        status: "DRAFT",
        createdBy: session.user.id,
      },
    });

    revalidate();
    return { data: invoice };
  } catch (error) {
    console.error("[CREATE_INVOICE]", error);
    return { error: "Failed to create invoice" };
  }
};

export const updateInvoice = async (id: string, fields: Record<string, unknown>) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const invoice = await (prismadb as any).crm_Invoices.update({
      where: { id },
      data: fields,
    });
    revalidate();
    return { data: invoice };
  } catch (error) {
    console.error("[UPDATE_INVOICE]", error);
    return { error: "Failed to update invoice" };
  }
};

export const deleteInvoice = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_Invoices.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });
    revalidate();
    return { data: true };
  } catch (error) {
    console.error("[DELETE_INVOICE]", error);
    return { error: "Failed to delete invoice" };
  }
};
