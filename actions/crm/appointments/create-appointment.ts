"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const createAppointment = async (data: {
  job_id: string;
  title: string;
  type?: string;
  start_date: Date;
  end_date?: Date;
  all_day?: boolean;
  location?: string;
  assigned_to?: string;
  crew_name?: string;
  notes?: string;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  try {
    const appointment = await (prismadb as any).crm_Appointments.create({
      data: {
        ...data,
        createdBy: session.user.id,
      },
    });

    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return { data: appointment };
  } catch (error) {
    console.error("[CREATE_APPOINTMENT]", error);
    return { error: "Failed to create appointment" };
  }
};
