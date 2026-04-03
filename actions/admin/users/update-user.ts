"use server";

import { prismadb } from "@/lib/prisma";
import { UserRole, ActiveStatus, Language } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const updateUser = async (
  userId: string,
  data: {
    first_name?: string;
    last_name?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    userStatus?: string;
    userLanguage?: string;
    is_admin?: boolean;
    skills?: string[];
    takingLeads?: boolean;
  }
) => {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).isAdmin) {
    return { error: "Unauthorized — admin access required" };
  }

  try {
    const updated = await prismadb.users.update({
      where: { id: userId },
      data: {
        ...data,
        role: data.role as UserRole | undefined,
        userStatus: data.userStatus as ActiveStatus | undefined,
        userLanguage: data.userLanguage as Language | undefined,
      },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    return { success: true, user: updated };
  } catch (error: any) {
    return { error: error?.message ?? "Failed to update user" };
  }
};
