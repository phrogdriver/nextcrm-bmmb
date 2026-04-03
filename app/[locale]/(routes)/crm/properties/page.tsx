import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getProperties } from "@/actions/crm/properties/get-properties";
import { PropertiesView } from "./PropertiesView";

export default async function PropertiesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/sign-in");

  const properties = await getProperties();

  return (
    <Container title="Properties" description="Property addresses and associated jobs">
      <PropertiesView properties={properties} />
    </Container>
  );
}
