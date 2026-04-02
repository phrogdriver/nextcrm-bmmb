"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const revalidate = () => revalidatePath("/[locale]/(routes)/crm/opportunities", "page");

export const getVendorCreditsByJob = async (jobId: string) => {
  try {
    const data = await (prismadb as any).crm_Vendor_Credits.findMany({
      where: { job_id: jobId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return JSON.parse(JSON.stringify(data, (_, v) => typeof v === "bigint" ? v.toString() : v));
  } catch (error) {
    console.error("getVendorCreditsByJob error:", error);
    return [];
  }
};

export const createVendorCredit = async (data: {
  job_id: string;
  purchase_order_id?: string;
  vendor_name: string;
  description?: string;
  amount: string;
  applied_to_bill?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const credit = await (prismadb as any).crm_Vendor_Credits.create({
      data,
    });
    revalidate();
    return { data: credit };
  } catch (error) {
    console.error("[CREATE_VENDOR_CREDIT]", error);
    return { error: "Failed to create vendor credit" };
  }
};

export const updateVendorCredit = async (id: string, fields: Record<string, unknown>) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const credit = await (prismadb as any).crm_Vendor_Credits.update({ where: { id }, data: fields });
    revalidate();
    return { data: credit };
  } catch (error) {
    console.error("[UPDATE_VENDOR_CREDIT]", error);
    return { error: "Failed to update vendor credit" };
  }
};

export const deleteVendorCredit = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_Vendor_Credits.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });
    revalidate();
    return { data: true };
  } catch (error) {
    console.error("[DELETE_VENDOR_CREDIT]", error);
    return { error: "Failed to delete vendor credit" };
  }
};
