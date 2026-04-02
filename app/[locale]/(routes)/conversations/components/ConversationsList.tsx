"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Phone, MessageSquare, MessageCircle, Plus, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import {
  getConversations,
  type ConversationListItem,
  type ConversationCursor,
} from "@/actions/crm/conversations/get-conversations";
import { NewConversationSheet } from "./NewConversationSheet";

const CHANNEL_ICONS = {
  phone: Phone,
  sms: MessageSquare,
  chat: MessageCircle,
} as const;

function getDisplayName(item: ConversationListItem): string {
  if (item.contact) {
    return [item.contact.first_name, item.contact.last_name].filter(Boolean).join(" ");
  }
  if (item.lead) {
    return [item.lead.firstName, item.lead.lastName].filter(Boolean).join(" ");
  }
  return item.phoneNumber || "Unknown";
}

interface Props {
  initialConversations: ConversationListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationsList({ initialConversations, selectedId, onSelect }: Props) {
  const t = useTranslations("Conversations");
  const [conversations, setConversations] = useState(initialConversations);
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<ConversationCursor | null>(null);
  const [hasMore, setHasMore] = useState(initialConversations.length === 25);
  const [sheetOpen, setSheetOpen] = useState(false);

  const doSearch = useCallback(async (query: string) => {
    const { data, nextCursor } = await getConversations(undefined, query || undefined);
    setConversations(data);
    setCursor(nextCursor);
    setHasMore(!!nextCursor);
  }, []);

  const loadMore = useCallback(async () => {
    if (!cursor) return;
    const { data, nextCursor } = await getConversations(cursor, search || undefined);
    setConversations((prev) => [...prev, ...data]);
    setCursor(nextCursor);
    setHasMore(!!nextCursor);
  }, [cursor, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Debounce would be nice but keep it simple — search on enter or blur
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") doSearch(search);
  };

  const handleCreated = () => {
    setSheetOpen(false);
    doSearch(search);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t("new")}
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={() => doSearch(search)}
            className="pl-8"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {conversations.map((item) => {
            const Icon = CHANNEL_ICONS[item.channel];
            const displayName = getDisplayName(item);
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 text-left hover:bg-accent transition-colors",
                  selectedId === item.id && "bg-accent"
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{displayName}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.lastActivityAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.phoneNumber && (
                      <span className="text-sm text-muted-foreground truncate">
                        {item.phoneNumber}
                      </span>
                    )}
                    {item.status === "closed" && (
                      <Badge variant="secondary" className="text-xs">
                        Closed
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {conversations.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              {t("noConversations")}
            </div>
          )}
        </div>
        {hasMore && (
          <div className="p-3">
            <Button variant="ghost" size="sm" className="w-full" onClick={loadMore}>
              {t("loadMore")}
            </Button>
          </div>
        )}
      </ScrollArea>
      <NewConversationSheet open={sheetOpen} onOpenChange={setSheetOpen} onCreated={handleCreated} />
    </div>
  );
}
