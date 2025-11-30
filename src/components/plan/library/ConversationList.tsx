import React from "react";
import { ConversationListItem } from "./ConversationListItem";
import type { ConversationSummary } from "../types";
import type { ConversationId } from "@/domain/plan/models/ConversationHistory";
import { Loader2 } from "lucide-react";

interface ConversationListProps {
  conversations: ConversationSummary[];
  activeConversationId?: ConversationId;
  onSelect: (id: ConversationId) => void;
  onDelete: (id: ConversationId) => void;
  onOpenMap?: (id: ConversationId) => void;
  isLoading?: boolean;
}

/**
 * ConversationList - List of all conversations
 *
 * Features:
 * - Displays all conversations
 * - Loading state
 * - Empty state
 * - Scrollable list
 */
export function ConversationList({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  onOpenMap,
  isLoading = false,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">No conversations yet. Start a new one to begin planning!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" role="list" aria-label="Conversation history">
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          isActive={conversation.id === activeConversationId}
          onSelect={() => onSelect(conversation.id)}
          onDelete={() => onDelete(conversation.id)}
          onOpenMap={onOpenMap ? () => onOpenMap(conversation.id) : undefined}
        />
      ))}
    </div>
  );
}
