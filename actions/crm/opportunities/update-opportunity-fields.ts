"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog, diffObjects } from "@/lib/audit-log";

/**
 * Update any set of fields on an opportunity.
 * Accepts a flat record of field names → values.
 * Used by the per-card edit forms on the job detail page.
 */
export const updateOpportunityFields = async (
  id: string,
  fields: Record<string, unknown>
) => {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  if (!id) return { error: "id is required" };

  const userId = session.user.id;

  try {
    const before = await prismadb.crm_Opportunities.findUnique({
      where: { id, deletedAt: null },
    });

    if (!before) return { error: "Job not found" };

    const updateData: Record<string, unknown> = {
      ...fields,
      updatedBy: userId,
    };

    const opportunity = await prismadb.crm_Opportunities.update({
      where: { id },
      data: updateData as any,
    });

    const serialize = (obj: any) =>
      JSON.parse(
        JSON.stringify(obj, (_, v) =>
          typeof v === "bigint" ? v.toString() : v
        )
      );

    const changes = diffObjects(serialize(before), serialize(opportunity));
    await writeAuditLog({
      entityType: "opportunity",
      entityId: id,
      action: "updated",
      changes,
      userId,
    });

    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return { data: serialize(opportunity) };
  } catch (error) {
    console.error("[UPDATE_OPPORTUNITY_FIELDS]", error);
    return { error: "Failed to update" };
  }
};
