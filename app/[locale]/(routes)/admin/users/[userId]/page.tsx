import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { prismadb } from "@/lib/prisma";

import Container from "../../../components/ui/Container";
import { UserDetailView } from "./UserDetailView";

interface Props {
  params: Promise<{ userId: string }>;
}

const UserDetailPage = async ({ params }: Props) => {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).isAdmin) {
    redirect("/");
  }

  const { userId } = await params;

  const user = await prismadb.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    notFound();
  }

  return (
    <Container
      title={user.name ?? user.email}
      description="User profile & settings"
    >
      <UserDetailView user={JSON.parse(JSON.stringify(user))} />
    </Container>
  );
};

export default UserDetailPage;
