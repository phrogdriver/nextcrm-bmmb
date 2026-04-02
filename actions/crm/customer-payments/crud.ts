"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const revalidate = () => revalidatePath("/[locale]/(routes)/crm/opportunities", "page");

export const getCustomerPaymentsByJob = async (jobId: string) => {
  try {
    const data = await (prismadb as any).crm_Customer_Payments.findMany({
      where: { job_id: jobId, deletedAt: null },
      orderBy: { date: "desc" },
      include: {
        invoice: {
          select: { id: true, invoice_number: true, title: true },
        },
      },
    });
    return JSON.parse(JSON.stringify(data, (_, v) => typeof v === "bigint" ? v.toString() : v));
  } catch (error) {
    console.error("getCustomerPaymentsByJob error:", error);
    return [];
  }
};

export const createCustomerPayment = async (data: {
  job_id: string;
  invoice_id?: string;
  amount: string;
  date: Date;
  method?: string;
  reference?: string;
  payer_name?: string;
  notes?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const payment = await (prismadb as any).crm_Customer_Payments.create({
      data: { ...data, createdBy: session.user.id },
    });

    // If linked to an invoice, update the invoice's amount_paid and balance_due
    if (data.invoice_id) {
      const invoice = await (prismadb as any).crm_Invoices.findUnique({
        where: { id: data.invoice_id },
      });
      if (invoice) {
        const newPaid = Number(invoice.amount_paid ?? 0) + Number(data.amount);
        const newBalance = Number(invoice.total) - newPaid;
        await (prismadb as any).crm_Invoices.update({
          where: { id: data.invoice_id },
          data: {
            amount_paid: newPaid,
            balance_due: Math.max(0, newBalance),
            status: newBalance <= 0 ? "PAID" : "PARTIAL",
            paid_at: newBalance <= 0 ? new Date() : undefined,
          },
        });
      }
    }

    revalidate();
    return { data: payment };
  } catch (error) {
    console.error("[CREATE_CUSTOMER_PAYMENT]", error);
    return { error: "Failed to record payment" };
  }
};

export const updateCustomerPayment = async (id: string, fields: Record<string, unknown>) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const payment = await (prismadb as any).crm_Customer_Payments.update({
      where: { id },
      data: fields,
    });
    revalidate();
    return { data: payment };
  } catch (error) {
    console.error("[UPDATE_CUSTOMER_PAYMENT]", error);
    return { error: "Failed to update payment" };
  }
};

export const deleteCustomerPayment = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_Customer_Payments.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });
    revalidate();
    return { data: true };
  } catch (error) {
    console.error("[DELETE_CUSTOMER_PAYMENT]", error);
    return { error: "Failed to delete payment" };
  }
};
