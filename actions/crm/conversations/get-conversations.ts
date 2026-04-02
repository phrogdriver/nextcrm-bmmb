"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

const PAGE_SIZE = 25;

export type ConversationListItem = {
  id: string;
  channel: "phone" | "sms" | "chat";
  phoneNumber: string | null;
  subject: string | null;
  status: "open" | "closed";
  lastActivityAt: Date;
  createdAt: Date;
  contact: { id: string; first_name: string | null; last_name: string } | null;
  lead: { id: string; firstName: string | null; lastName: string } | null;
  created_by_user: { id: string; name: string | null; avatar: string | null } | null;
};

export type ConversationCursor = { lastActivityAt: string; id: string };

export const getConversations = async (
  cursor?: ConversationCursor,
  search?: string
): Promise<{ data: ConversationListItem[]; nextCursor: ConversationCursor | null }> => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { data: [], nextCursor: null };

    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      const digits = search.replace(/\D/g, "");
      where.OR = [
        { phoneNumber: { contains: digits } },
        { contact: { last_name: { contains: search, mode: "insensitive" } } },
        { contact: { first_name: { contains: search, mode: "insensitive" } } },
        { lead: { lastName: { contains: search, mode: "insensitive" } } },
        { lead: { firstName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (cursor) {
      where.AND = [
        {
          OR: [
            { lastActivityAt: { lt: new Date(cursor.lastActivityAt) } },
            { lastActivityAt: new Date(cursor.lastActivityAt), id: { lt: cursor.id } },
          ],
        },
      ];
    }

    const conversations = await (prismadb as any).crm_Conversations.findMany({
      where,
      orderBy: [{ lastActivityAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE,
      include: {
        contact: { select: { id: true, first_name: true, last_name: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
        created_by_user: { select: { id: true, name: true, avatar: true } },
      },
    });

    const nextCursor =
      conversations.length < PAGE_SIZE
        ? null
        : {
            lastActivityAt: conversations[conversations.length - 1].lastActivityAt.toISOString(),
            id: conversations[conversations.length - 1].id,
          };

    return { data: conversations as ConversationListItem[], nextCursor };
  } catch (error) {
    console.error("getConversations error:", error);
    return { data: [], nextCursor: null };
  }
};

export const getOpenConversationCount = async (): Promise<number> => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return 0;

    return await (prismadb as any).crm_Conversations.count({
      where: { status: "open", deletedAt: null },
    });
  } catch {
    return 0;
  }
};
