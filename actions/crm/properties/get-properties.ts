"use server";
import { prismadb } from "@/lib/prisma";

/**
 * Search properties by address. Used by the property selector.
 */
export const searchProperties = async (query: string) => {
  if (!query || query.length < 2) return [];

  const results = await (prismadb as any).crm_Properties.findMany({
    where: {
      deletedAt: null,
      address: { contains: query, mode: "insensitive" },
    },
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      property_type: true,
      companycam_id: true,
      _count: { select: { jobs: true } },
    },
    take: 10,
    orderBy: { address: "asc" },
  });

  return results as Array<{
    id: string;
    address: string;
    city: string | null;
    state: string | null;
    zip: string | null;
    property_type: string | null;
    companycam_id: string | null;
    _count: { jobs: number };
  }>;
};

/**
 * Create a new property and link it to a job.
 */
export const createProperty = async (data: {
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  property_type?: string;
  companycam_id?: string;
  jobId: string;
}) => {
  const { jobId, ...propData } = data;

  try {
    const property = await (prismadb as any).crm_Properties.create({
      data: propData,
    });

    await prismadb.crm_Opportunities.update({
      where: { id: jobId },
      data: { property_id: property.id },
    });

    return { data: property };
  } catch (error) {
    console.error("[CREATE_PROPERTY]", error);
    return { error: "Failed to create property" };
  }
};

/**
 * Update an existing property's fields.
 */
export const updateProperty = async (
  id: string,
  fields: Record<string, unknown>
) => {
  try {
    const property = await (prismadb as any).crm_Properties.update({
      where: { id },
      data: fields,
    });
    return { data: property };
  } catch (error) {
    console.error("[UPDATE_PROPERTY]", error);
    return { error: "Failed to update property" };
  }
};

/**
 * Link an existing property to a job.
 */
export const linkPropertyToJob = async (propertyId: string, jobId: string) => {
  try {
    await prismadb.crm_Opportunities.update({
      where: { id: jobId },
      data: { property_id: propertyId },
    });
    return { data: true };
  } catch (error) {
    console.error("[LINK_PROPERTY]", error);
    return { error: "Failed to link property" };
  }
};
