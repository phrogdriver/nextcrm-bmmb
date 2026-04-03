"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const updateUserSkills = async (userId: string, skills: string[]) => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isAdmin) {
    return { error: "Unauthorized" };
  }

  try {
    await prismadb.users.update({
      where: { id: userId },
      data: { skills },
    });

    revalidatePath("/[locale]/(routes)/admin/users", "page");
    return { success: true };
  } catch (error) {
    console.error("[UPDATE_USER_SKILLS]", error);
    return { error: "Failed to update skills" };
  }
};
