import { cache } from "react";
import { prismadb } from "@/lib/prisma";

export const getLeads = cache(async () => {
  const data = await prismadb.crm_Leads.findMany({
    where: { deletedAt: null, converted_at: null },
    include: {
      // Include assigned user (uses "LeadAssignedTo" relation)
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      lead_status: {
        select: {
          id: true,
          name: true,
        },
      },
      // Include assigned accounts
      assigned_accounts: true,
      // Include documents through DocumentsToLeads junction table
      documents: {
        include: {
          document: {
            select: {
              id: true,
              document_name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
});
