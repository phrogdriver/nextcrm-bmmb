"use server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Link an existing account to a job. Once set, cannot be changed.
 */
export const linkAccountToJob = async (accountId: string, jobId: string) => {
  try {
    const job = await prismadb.crm_Opportunities.findUnique({
      where: { id: jobId, deletedAt: null },
      select: { account: true },
    });

    if (job?.account) {
      return { error: "Job already has a customer assigned. Cannot change." };
    }

    await prismadb.crm_Opportunities.update({
      where: { id: jobId },
      data: { account: accountId },
    });

    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return { data: true };
  } catch (error) {
    console.error("[LINK_ACCOUNT_TO_JOB]", error);
    return { error: "Failed to link account" };
  }
};
