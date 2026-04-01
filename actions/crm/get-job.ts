"use server";
import { prismadb } from "@/lib/prisma";

/**
 * Fetch an opportunity as a "Job" with all roofing-specific relations.
 * Used by the job detail page.
 */
export const getJob = async (jobId: string) => {
  const data = await prismadb.crm_Opportunities.findFirst({
    where: {
      id: jobId,
      deletedAt: null,
    },
    include: {
      assigned_account: {
        select: { id: true, name: true },
      },
      assigned_sales_stage: true,
      assigned_type: {
        select: { id: true, name: true },
      },
      assigned_to_user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      created_by_user: {
        select: { id: true, name: true, email: true },
      },
      assigned_property: {
        include: {
          owner: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              mobile_phone: true,
              office_phone: true,
            },
          },
        },
      },
      adjuster: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          mobile_phone: true,
          office_phone: true,
          email: true,
        },
      },
      superintendent: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      contacts: {
        include: {
          contact: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              mobile_phone: true,
              office_phone: true,
            },
          },
        },
      },
      payments: {
        where: { deletedAt: null },
        orderBy: { date: "desc" },
        select: {
          id: true,
          amount: true,
          date: true,
          method: true,
          notes: true,
        },
      },
      stage_transitions: {
        orderBy: { transitioned_at: "desc" },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
      documents: {
        include: {
          document: {
            select: {
              id: true,
              document_name: true,
              document_type: true,
              document_file_url: true,
              document_file_mimeType: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!data) return null;

  // Serialize bigints and decimals for client components
  return JSON.parse(
    JSON.stringify(data, (_, v) =>
      typeof v === "bigint" ? v.toString() : v
    )
  );
};

export type Job = NonNullable<Awaited<ReturnType<typeof getJob>>>;

/**
 * Fetch all pipeline stages for the progress bar and transition form.
 */
export const getAllStages = async () => {
  const stages = await prismadb.crm_Opportunities_Sales_Stages.findMany({
    orderBy: { order: "asc" },
  });

  return JSON.parse(
    JSON.stringify(stages, (_, v) =>
      typeof v === "bigint" ? v.toString() : v
    )
  );
};

export type PipelineStage = Awaited<ReturnType<typeof getAllStages>>[number];
