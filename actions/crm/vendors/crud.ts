"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const revalidate = () => revalidatePath("/[locale]/(routes)/crm", "page");

export const getVendors = async () => {
  try {
    const data = await (prismadb as any).crm_Vendors.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
    return data as Array<{
      id: string;
      name: string;
      type: string | null;
      contact_name: string | null;
      email: string | null;
      phone: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
      notes: string | null;
      is_active: boolean;
    }>;
  } catch (error) {
    console.error("getVendors error:", error);
    return [];
  }
};

export const searchVendors = async (query: string) => {
  if (!query || query.length < 2) return [];
  try {
    const data = await (prismadb as any).crm_Vendors.findMany({
      where: {
        deletedAt: null,
        is_active: true,
        name: { contains: query, mode: "insensitive" },
      },
      select: { id: true, name: true, type: true, phone: true },
      take: 10,
      orderBy: { name: "asc" },
    });
    return data as Array<{ id: string; name: string; type: string | null; phone: string | null }>;
  } catch (error) {
    console.error("searchVendors error:", error);
    return [];
  }
};

export const createVendor = async (data: {
  name: string;
  type?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const vendor = await (prismadb as any).crm_Vendors.create({
      data: { ...data, createdBy: session.user.id },
    });
    revalidate();
    return { data: vendor };
  } catch (error) {
    console.error("[CREATE_VENDOR]", error);
    return { error: "Failed to create vendor" };
  }
};

export const updateVendor = async (id: string, fields: Record<string, unknown>) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const vendor = await (prismadb as any).crm_Vendors.update({ where: { id }, data: fields });
    revalidate();
    return { data: vendor };
  } catch (error) {
    console.error("[UPDATE_VENDOR]", error);
    return { error: "Failed to update vendor" };
  }
};

export const deleteVendor = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_Vendors.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });
    revalidate();
    return { data: true };
  } catch (error) {
    console.error("[DELETE_VENDOR]", error);
    return { error: "Failed to delete vendor" };
  }
};
