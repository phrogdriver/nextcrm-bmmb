"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const updateAppointment = async (
  id: string,
  fields: Record<string, unknown>
) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const appointment = await (prismadb as any).crm_Appointments.update({
      where: { id },
      data: fields,
    });

    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return { data: appointment };
  } catch (error) {
    console.error("[UPDATE_APPOINTMENT]", error);
    return { error: "Failed to update appointment" };
  }
};

export const deleteAppointment = async (id: string) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    await (prismadb as any).crm_Appointments.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });

    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return { data: true };
  } catch (error) {
    console.error("[DELETE_APPOINTMENT]", error);
    return { error: "Failed to delete appointment" };
  }
};
