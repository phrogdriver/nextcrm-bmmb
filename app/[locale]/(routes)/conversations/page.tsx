import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { ConversationsMockup } from "./components/ConversationsMockup";

export default async function ConversationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/sign-in");

  return (
    <Container
      title="Conversations"
      description="Calls, SMS, and messages"
    >
      <ConversationsMockup />
    </Container>
  );
}
