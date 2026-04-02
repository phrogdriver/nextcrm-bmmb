"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export type MessageItem = {
  id: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  body: string;
  mediaUrls: string[];
  twilioStatus: string | null;
  sentBy: string | null;
  sent_by_user: { id: string; name: string | null } | null;
  createdAt: Date;
};

export const getMessages = async (
  conversationId: string
): Promise<{ data: MessageItem[] }> => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { data: [] };

    const messages = await (prismadb as any).crm_Messages.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sent_by_user: { select: { id: true, name: true } },
      },
    });

    return { data: messages as MessageItem[] };
  } catch (error) {
    console.error("getMessages error:", error);
    return { data: [] };
  }
};
