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
