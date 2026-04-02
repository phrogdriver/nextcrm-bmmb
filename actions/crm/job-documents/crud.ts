"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const revalidate = () => revalidatePath("/[locale]/(routes)/crm/opportunities", "page");

export const getJobDocuments = async (jobId: string) => {
  try {
    const data = await (prismadb as any).crm_Job_Documents.findMany({
      where: { job_id: jobId, deletedAt: null },
      orderBy: [{ is_required: "desc" }, { createdAt: "desc" }],
      include: {
        uploader: { select: { id: true, name: true } },
      },
    });
    return data as Array<{
      id: string;
      job_id: string;
      document_id: string | null;
      name: string;
      doc_type: string | null;
      is_required: boolean;
      file_url: string | null;
      file_name: string | null;
      file_size: number | null;
      mime_type: string | null;
      uploaded_by: string | null;
      uploaded_at: Date | null;
      notes: string | null;
      createdAt: Date;
      uploader: { id: string; name: string | null } | null;
    }>;
  } catch (error) {
    console.error("getJobDocuments error:", error);
    return [];
  }
};

export const createJobDocument = async (data: {
  job_id: string;
  name: string;
  doc_type?: string;
  is_required?: boolean;
  document_id?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const doc = await (prismadb as any).crm_Job_Documents.create({
      data: {
        ...data,
        uploaded_by: session.user.id,
        uploaded_at: data.file_url ? new Date() : undefined,
      },
    });
    revalidate();
    return { data: doc };
  } catch (error) {
    console.error("[CREATE_JOB_DOCUMENT]", error);
    return { error: "Failed to create document" };
  }
};

export const updateJobDocument = async (id: string, fields: Record<string, unknown>) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const doc = await (prismadb as any).crm_Job_Documents.update({ where: { id }, data: fields });
    revalidate();
    return { data: doc };
  } catch (error) {
    console.error("[UPDATE_JOB_DOCUMENT]", error);
    return { error: "Failed to update document" };
  }
};

export const deleteJobDocument = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_Job_Documents.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });
    revalidate();
    return { data: true };
  } catch (error) {
    console.error("[DELETE_JOB_DOCUMENT]", error);
    return { error: "Failed to delete document" };
  }
};
