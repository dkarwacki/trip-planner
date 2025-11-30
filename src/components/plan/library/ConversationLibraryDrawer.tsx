import React from "react";
import { NewConversationButton } from "./NewConversationButton";
import { ConversationList } from "./ConversationList";
import type { ConversationLibraryProps } from "../types";

/**
 * ConversationLibraryDrawer - Mobile full-screen view
 *
 * Features:
 * - Full-height mobile layout
 * - New conversation button
 * - Scrollable list
 * - Safe area insets
 */
export function ConversationLibraryDrawer({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  onNewConversation,
  onOpenMap,
  isLoading = false,
}: ConversationLibraryProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="mb-4 text-lg font-semibold">Chats</h2>
        <NewConversationButton onClick={onNewConversation} disabled={isLoading} />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-4 pb-safe">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={onSelect}
          onDelete={onDelete}
          onOpenMap={onOpenMap}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
