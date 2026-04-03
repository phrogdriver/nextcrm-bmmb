"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const toggleTakingLeads = async (userId: string, takingLeads: boolean) => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return { error: "Unauthorized" };
  }

  try {
    await prismadb.users.update({
      where: { id: userId },
      data: { takingLeads },
    });

    revalidatePath("/[locale]/(routes)/admin/users", "page");
    return { success: true };
  } catch (error) {
    console.error("[TOGGLE_TAKING_LEADS]", error);
    return { error: "Failed to update" };
  }
};
