import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getConversations } from "@/actions/crm/conversations/get-conversations";
import { ConversationsLayout } from "./components/ConversationsLayout";

export default async function ConversationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/sign-in");

  const t = await getTranslations("Conversations");
  const { data: conversations } = await getConversations();

  return (
    <Container
      title={t("title")}
      description={t("description")}
    >
      <ConversationsLayout initialConversations={conversations} />
    </Container>
  );
}
