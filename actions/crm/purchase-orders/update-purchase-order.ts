"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const updatePurchaseOrder = async (
  id: string,
  fields: Record<string, unknown>
) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const po = await (prismadb as any).crm_Purchase_Orders.update({
      where: { id },
      data: fields,
    });

    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return { data: po };
  } catch (error) {
    console.error("[UPDATE_PURCHASE_ORDER]", error);
    return { error: "Failed to update purchase order" };
  }
};

export const deletePurchaseOrder = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_Purchase_Orders.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });

    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return { data: true };
  } catch (error) {
    console.error("[DELETE_PURCHASE_ORDER]", error);
    return { error: "Failed to delete purchase order" };
  }
};
