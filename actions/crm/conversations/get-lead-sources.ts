"use server";
import { prismadb } from "@/lib/prisma";

export const getLeadSources = async (): Promise<Array<{ id: string; name: string }>> => {
  try {
    const sources = await prismadb.crm_Lead_Sources.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return sources;
  } catch {
    return [];
  }
};
