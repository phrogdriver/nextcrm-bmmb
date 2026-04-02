"use client";

import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ConversationsList } from "./ConversationsList";
import { ConversationDetail } from "./ConversationDetail";
import type { ConversationListItem } from "@/actions/crm/conversations/get-conversations";

interface Props {
  initialConversations: ConversationListItem[];
}

export function ConversationsLayout({ initialConversations }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversations[0]?.id ?? null
  );

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
      <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
        <ConversationsList
          initialConversations={initialConversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={65} minSize={40}>
        {selectedId ? (
          <ConversationDetail conversationId={selectedId} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a conversation to view details
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
