"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const updateProfile = async (data: {
  userId: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  account_name?: string | null;
}) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const { userId, first_name, last_name, phone, account_name } = data;

  if (!userId) return { error: "userId is required" };

  // Ensure user can only update their own profile unless admin
  if (session.user.id !== userId && !session.user.isAdmin) {
    return { error: "Forbidden" };
  }

  try {
    // Keep "name" in sync for backward compatibility
    const name = `${first_name} ${last_name}`.trim();

    const user = await prismadb.users.update({
      data: { first_name, last_name, name, phone, account_name },
      where: { id: userId },
    });
    revalidatePath("/[locale]/(routes)/profile", "page");
    return { data: user };
  } catch (error) {
    console.log("[UPDATE_PROFILE]", error);
    return { error: "Failed to update profile" };
  }
};
