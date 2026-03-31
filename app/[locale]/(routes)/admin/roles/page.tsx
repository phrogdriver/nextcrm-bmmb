import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { PermissionMatrix } from "./_components/PermissionMatrix";
import { getPermissionMatrix } from "./_actions/role-permissions";

export default async function RolesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    return (
      <Container title="Access Denied" description="You do not have permission to view this page.">
        <p className="text-sm text-muted-foreground px-4">
          Only administrators can manage roles and permissions.
        </p>
      </Container>
    );
  }

  const matrix = await getPermissionMatrix();

  return (
    <Container
      title="Roles & Permissions"
      description="Configure what each role can access. Click a cell to cycle between Yes, Own, and No."
    >
      <div className="space-y-4 px-1">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-200 border border-emerald-300" />
            Yes — full access
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-200 border border-amber-300" />
            Own — only records assigned to them
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-slate-200 border border-slate-300" />
            No — no access
          </span>
        </div>

        <PermissionMatrix initialData={matrix} />
      </div>
    </Container>
  );
}
