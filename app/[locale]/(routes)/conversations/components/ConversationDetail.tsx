"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Phone, MessageSquare, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { getConversationById, type ConversationDetail as ConversationDetailType } from "@/actions/crm/conversations/get-conversation-by-id";
import { updateConversation } from "@/actions/crm/conversations/update-conversation";
import type { ActivityWithLinks, ActivityCursor } from "@/actions/crm/activities/get-activities-by-entity";
import { ActivityEntry } from "@/components/crm/activities/ActivityEntry";
import { CallLogForm } from "./CallLogForm";
import { CustomerLookup } from "./CustomerLookup";

const CHANNEL_ICONS = {
  phone: Phone,
  sms: MessageSquare,
  chat: MessageCircle,
} as const;

interface Props {
  conversationId: string;
}

export function ConversationDetail({ conversationId }: Props) {
  const t = useTranslations("Conversations");
  const [conversation, setConversation] = useState<ConversationDetailType | null>(null);
  const [activities, setActivities] = useState<ActivityWithLinks[]>([]);
  const [nextCursor, setNextCursor] = useState<ActivityCursor | null>(null);
  const [loading, setLoading] = useState(true);
  const [callFormOpen, setCallFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getConversationById(conversationId);
    setConversation(result.conversation);
    setActivities(result.activities);
    setNextCursor(result.nextActivityCursor);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => { load(); }, [load]);

  const loadMoreActivities = async () => {
    if (!nextCursor) return;
    const result = await getConversationById(conversationId, nextCursor);
    setActivities((prev) => [...prev, ...(result.activities ?? [])]);
    setNextCursor(result.nextActivityCursor);
  };

  const handleLinked = () => load();

  const handleCallLogged = () => {
    setCallFormOpen(false);
    load();
  };

  const handleClose = async () => {
    const result = await updateConversation({ id: conversationId, status: "closed" });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("conversationClosed"));
      load();
    }
  };

  const handleReopen = async () => {
    const result = await updateConversation({ id: conversationId, status: "open" });
    if (result.error) {
      toast.error(result.error);
    } else {
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Conversation not found
      </div>
    );
  }

  const Icon = CHANNEL_ICONS[conversation.channel];
  const displayName = conversation.contact
    ? [conversation.contact.first_name, conversation.contact.last_name].filter(Boolean).join(" ")
    : conversation.lead
    ? [conversation.lead.firstName, conversation.lead.lastName].filter(Boolean).join(" ")
    : conversation.phoneNumber || "Unknown";

  const isLinked = !!conversation.contactId || !!conversation.leadId;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{displayName}</h2>
            <Badge variant={conversation.status === "open" ? "default" : "secondary"}>
              {conversation.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {conversation.status === "open" ? (
              <Button variant="outline" size="sm" onClick={handleClose}>
                <X className="h-3 w-3 mr-1" />
                {t("close")}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleReopen}>
                {t("reopen")}
              </Button>
            )}
          </div>
        </div>
        {conversation.phoneNumber && (
          <p className="text-sm text-muted-foreground">{conversation.phoneNumber}</p>
        )}
      </div>

      {/* Customer lookup if not linked */}
      {!isLinked && (
        <>
          <CustomerLookup
            conversationId={conversationId}
            phoneNumber={conversation.phoneNumber}
            onLinked={handleLinked}
          />
          <Separator />
        </>
      )}

      {/* Activity timeline */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("noActivities")}
            </p>
          ) : (
            activities.map((activity) => (
              <ActivityEntry
                key={activity.id}
                activity={activity}
                onUpdate={load}
                entityType="conversation"
                entityId={conversationId}
              />
            ))
          )}
          {nextCursor && (
            <Button variant="ghost" size="sm" className="w-full" onClick={loadMoreActivities}>
              {t("loadMore")}
            </Button>
          )}
        </div>
      </ScrollArea>

      {/* Log call button */}
      {conversation.status === "open" && (
        <div className="p-4 border-t">
          <Button className="w-full" onClick={() => setCallFormOpen(true)}>
            <Phone className="h-4 w-4 mr-2" />
            {t("logCall")}
          </Button>
        </div>
      )}

      <CallLogForm
        open={callFormOpen}
        onOpenChange={setCallFormOpen}
        conversationId={conversationId}
        onLogged={handleCallLogged}
      />
    </div>
  );
}
