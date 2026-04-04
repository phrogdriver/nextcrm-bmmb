import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getConversations } from "@/actions/crm/conversations/get-conversations";
import { ConversationsLive } from "./components/ConversationsLive";

export default async function ConversationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/sign-in");

  const { data: conversations } = await getConversations();

  return (
    <div className="-mb-5 -mx-4 h-[calc(100vh-65px-20px)] overflow-hidden">
      <ConversationsLive initialConversations={conversations} />
    </div>
  );
}
