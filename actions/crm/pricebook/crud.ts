"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const revalidate = () => revalidatePath("/[locale]/(routes)/crm", "page");

export const getPriceBookItems = async (activeOnly = true) => {
  try {
    const where: Record<string, unknown> = { deletedAt: null };
    if (activeOnly) where.is_active = true;

    const data = await (prismadb as any).crm_PriceBook_Items.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return JSON.parse(JSON.stringify(data, (_, v) => typeof v === "bigint" ? v.toString() : v));
  } catch (error) {
    console.error("getPriceBookItems error:", error);
    return [];
  }
};

export const searchPriceBookItems = async (query: string) => {
  if (!query || query.length < 2) return [];
  try {
    const data = await (prismadb as any).crm_PriceBook_Items.findMany({
      where: {
        deletedAt: null,
        is_active: true,
        name: { contains: query, mode: "insensitive" },
      },
      select: { id: true, name: true, category: true, unit: true, unit_cost: true, unit_price: true },
      take: 15,
      orderBy: { name: "asc" },
    });
    return JSON.parse(JSON.stringify(data, (_, v) => typeof v === "bigint" ? v.toString() : v));
  } catch (error) {
    console.error("searchPriceBookItems error:", error);
    return [];
  }
};

export const createPriceBookItem = async (data: {
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  unit_cost?: string;
  unit_price?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const item = await (prismadb as any).crm_PriceBook_Items.create({
      data: { ...data, createdBy: session.user.id },
    });
    revalidate();
    return { data: item };
  } catch (error) {
    console.error("[CREATE_PRICEBOOK_ITEM]", error);
    return { error: "Failed to create pricebook item" };
  }
};

export const updatePriceBookItem = async (id: string, fields: Record<string, unknown>) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const item = await (prismadb as any).crm_PriceBook_Items.update({ where: { id }, data: fields });
    revalidate();
    return { data: item };
  } catch (error) {
    console.error("[UPDATE_PRICEBOOK_ITEM]", error);
    return { error: "Failed to update pricebook item" };
  }
};

export const deletePriceBookItem = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_PriceBook_Items.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });
    revalidate();
    return { data: true };
  } catch (error) {
    console.error("[DELETE_PRICEBOOK_ITEM]", error);
    return { error: "Failed to delete pricebook item" };
  }
};
