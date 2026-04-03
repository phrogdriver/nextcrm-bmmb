"use server";
import { prismadb } from "@/lib/prisma";

export type PropertyListItem = {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  property_type: string | null;
  owner: { id: string; first_name: string | null; last_name: string } | null;
  jobs: Array<{
    id: string;
    name: string | null;
    status: string | null;
  }>;
  createdAt: Date;
};

export const getProperties = async (): Promise<PropertyListItem[]> => {
  try {
    const properties = await (prismadb as any).crm_Properties.findMany({
      where: { deletedAt: null },
      include: {
        owner: {
          select: { id: true, first_name: true, last_name: true },
        },
        jobs: {
          where: { deletedAt: null },
          select: { id: true, name: true, status: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return properties as PropertyListItem[];
  } catch (error) {
    console.error("getProperties error:", error);
    return [];
  }
};

export const linkPropertyToJob = async (
  propertyId: string,
  jobId: string
): Promise<{ error?: string }> => {
  try {
    await (prismadb as any).crm_Opportunities.update({
      where: { id: jobId },
      data: { property_id: propertyId },
    });
    return {};
  } catch (error) {
    console.error("linkPropertyToJob error:", error);
    return { error: "Failed to link property" };
  }
};

export const createProperty = async (data: {
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  property_type?: string;
  owner_id?: string;
  jobId?: string;
}): Promise<{ data?: any; error?: string }> => {
  try {
    const property = await (prismadb as any).crm_Properties.create({
      data: {
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        lat: data.lat,
        lng: data.lng,
        property_type: data.property_type,
        owner_id: data.owner_id,
      },
    });

    if (data.jobId) {
      await (prismadb as any).crm_Opportunities.update({
        where: { id: data.jobId },
        data: { property_id: property.id },
      });
    }

    return { data: property };
  } catch (error) {
    console.error("createProperty error:", error);
    return { error: "Failed to create property" };
  }
};

export const updateProperty = async (
  propertyId: string,
  data: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    lat?: number;
    lng?: number;
    property_type?: string;
    owner_id?: string;
  }
): Promise<{ error?: string }> => {
  try {
    await (prismadb as any).crm_Properties.update({
      where: { id: propertyId },
      data,
    });
    return {};
  } catch (error) {
    console.error("updateProperty error:", error);
    return { error: "Failed to update property" };
  }
};

export const searchProperties = async (
  query: string
): Promise<Array<{ id: string; address: string; city: string | null; state: string | null; zip: string | null }>> => {
  try {
    const properties = await (prismadb as any).crm_Properties.findMany({
      where: {
        deletedAt: null,
        OR: [
          { address: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
          { zip: { contains: query } },
        ],
      },
      select: { id: true, address: true, city: true, state: true, zip: true },
      take: 10,
      orderBy: { createdAt: "desc" },
    });
    return properties;
  } catch (error) {
    console.error("searchProperties error:", error);
    return [];
  }
};
