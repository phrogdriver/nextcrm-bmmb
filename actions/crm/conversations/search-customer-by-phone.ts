"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export type CustomerMatch = {
  type: "contact" | "lead";
  id: string;
  firstName: string | null;
  lastName: string;
  phone: string | null;
};

export const searchCustomerByPhone = async (
  phone: string
): Promise<{ data: CustomerMatch[] }> => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { data: [] };

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 3) return { data: [] };

    const [contacts, leads] = await Promise.all([
      (prismadb as any).crm_Contacts.findMany({
        where: {
          deletedAt: null,
          OR: [
            { office_phone: { contains: digits } },
            { mobile_phone: { contains: digits } },
          ],
        },
        select: { id: true, first_name: true, last_name: true, office_phone: true, mobile_phone: true },
        take: 10,
      }),
      (prismadb as any).crm_Leads.findMany({
        where: {
          deletedAt: null,
          phone: { contains: digits },
        },
        select: { id: true, firstName: true, lastName: true, phone: true },
        take: 10,
      }),
    ]);

    const results: CustomerMatch[] = [
      ...(contacts as any[]).map((c: any) => ({
        type: "contact" as const,
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        phone: c.mobile_phone || c.office_phone,
      })),
      ...(leads as any[]).map((l: any) => ({
        type: "lead" as const,
        id: l.id,
        firstName: l.firstName,
        lastName: l.lastName,
        phone: l.phone,
      })),
    ];

    return { data: results };
  } catch (error) {
    console.error("searchCustomerByPhone error:", error);
    return { data: [] };
  }
};
