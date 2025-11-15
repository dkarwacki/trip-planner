import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NewConversationButton } from "./NewConversationButton";
import { ConversationList } from "./ConversationList";
import type { ConversationLibraryProps } from "../types";

/**
 * ConversationLibraryPanel - Desktop left sidebar
 *
 * Features:
 * - Collapsible sidebar
 * - New conversation button at top
 * - Scrollable conversation list
 * - Empty state
 */
export function ConversationLibraryPanel({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  onNewConversation,
  isLoading = false,
  isCollapsed = false,
  onToggleCollapse,
}: ConversationLibraryProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      {!isCollapsed && (
        <div className="border-b p-4">
          <h2 className="mb-4 font-semibold">Sessions</h2>
          <NewConversationButton onClick={onNewConversation} disabled={isLoading} />
        </div>
      )}

      {/* Conversation list */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4">
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={onSelect}
            onDelete={onDelete}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Collapsed state */}
      {isCollapsed && (
        <div className="flex h-full flex-col items-center justify-between p-4">
          <div className="text-2xl">📚</div>
          {conversations.length > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {conversations.length}
            </span>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="border-t p-2 hover:bg-accent"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      )}
    </div>
  );
}
