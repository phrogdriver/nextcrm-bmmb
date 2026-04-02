"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const revalidate = () => revalidatePath("/[locale]/(routes)/crm/opportunities", "page");

export const getPhotosByProperty = async (propertyId: string) => {
  try {
    const data = await (prismadb as any).crm_Property_Photos.findMany({
      where: { property_id: propertyId, deletedAt: null },
      orderBy: [{ sort_order: "asc" }, { createdAt: "desc" }],
      include: {
        uploader: { select: { id: true, name: true } },
      },
    });
    return data as Array<{
      id: string;
      property_id: string;
      file_url: string;
      file_key: string | null;
      file_name: string | null;
      mime_type: string | null;
      size: number | null;
      caption: string | null;
      taken_at: Date | null;
      tags: unknown;
      sort_order: number;
      createdAt: Date;
      uploader: { id: string; name: string | null } | null;
    }>;
  } catch (error) {
    console.error("getPhotosByProperty error:", error);
    return [];
  }
};

export const getPhotoCount = async (propertyId: string): Promise<number> => {
  try {
    return await (prismadb as any).crm_Property_Photos.count({
      where: { property_id: propertyId, deletedAt: null },
    });
  } catch {
    return 0;
  }
};

export const createPropertyPhoto = async (data: {
  property_id: string;
  file_url: string;
  file_key?: string;
  file_name?: string;
  mime_type?: string;
  size?: number;
  caption?: string;
  taken_at?: Date;
  tags?: string[];
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const photo = await (prismadb as any).crm_Property_Photos.create({
      data: { ...data, uploaded_by: session.user.id },
    });
    revalidate();
    return { data: photo };
  } catch (error) {
    console.error("[CREATE_PROPERTY_PHOTO]", error);
    return { error: "Failed to upload photo" };
  }
};

export const updatePropertyPhoto = async (id: string, fields: Record<string, unknown>) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const photo = await (prismadb as any).crm_Property_Photos.update({ where: { id }, data: fields });
    revalidate();
    return { data: photo };
  } catch (error) {
    console.error("[UPDATE_PROPERTY_PHOTO]", error);
    return { error: "Failed to update photo" };
  }
};

export const deletePropertyPhoto = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_Property_Photos.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });
    revalidate();
    return { data: true };
  } catch (error) {
    console.error("[DELETE_PROPERTY_PHOTO]", error);
    return { error: "Failed to delete photo" };
  }
};
