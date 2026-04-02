"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const revalidate = () => revalidatePath("/[locale]/(routes)/crm/opportunities", "page");

export const getMeasurementsByProperty = async (propertyId: string) => {
  try {
    const data = await (prismadb as any).crm_Measurements.findMany({
      where: { property_id: propertyId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return JSON.parse(JSON.stringify(data, (_, v) => typeof v === "bigint" ? v.toString() : v));
  } catch (error) {
    console.error("getMeasurementsByProperty error:", error);
    return [];
  }
};

export const createMeasurement = async (data: {
  property_id: string;
  source?: string;
  source_date?: Date;
  total_squares?: string;
  total_sf?: string;
  pitch?: string;
  ridge_lf?: string;
  ridge_vent_lf?: string;
  valley_lf?: string;
  eave_lf?: string;
  rake_lf?: string;
  drip_edge_lf?: string;
  pipe_boots?: number;
  chimney_flashing?: number;
  skylights?: number;
  layers?: number;
  roof_material?: string;
  notes?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const measurement = await (prismadb as any).crm_Measurements.create({
      data: { ...data, createdBy: session.user.id },
    });
    revalidate();
    return { data: measurement };
  } catch (error) {
    console.error("[CREATE_MEASUREMENT]", error);
    return { error: "Failed to create measurement" };
  }
};

export const updateMeasurement = async (id: string, fields: Record<string, unknown>) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const measurement = await (prismadb as any).crm_Measurements.update({ where: { id }, data: fields });
    revalidate();
    return { data: measurement };
  } catch (error) {
    console.error("[UPDATE_MEASUREMENT]", error);
    return { error: "Failed to update measurement" };
  }
};

export const deleteMeasurement = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_Measurements.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });
    revalidate();
    return { data: true };
  } catch (error) {
    console.error("[DELETE_MEASUREMENT]", error);
    return { error: "Failed to delete measurement" };
  }
};
