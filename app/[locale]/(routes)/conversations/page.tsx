import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ConversationsMockup } from "./components/ConversationsMockup";

export default async function ConversationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/sign-in");

  return (
    <div className="-my-5 -mx-4 h-[calc(100vh-4.5rem)] overflow-hidden">
      <ConversationsMockup />
    </div>
  );
}
