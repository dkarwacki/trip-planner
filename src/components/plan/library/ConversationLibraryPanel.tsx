import React from "react";
import { ChevronLeft, ChevronRight, MessagesSquare } from "lucide-react";
import { NewConversationButton } from "./NewConversationButton";
import { ConversationList } from "./ConversationList";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
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
  onOpenMap,
  isLoading = false,
  isCollapsed = false,
  onToggleCollapse,
}: ConversationLibraryProps) {
  if (isCollapsed) {
    return (
      <TooltipProvider>
        <div
          className="flex h-full flex-col items-center py-4 bg-white"
          data-testid="conversation-library-panel-collapsed"
        >
          <div className="flex-1 flex flex-col items-center gap-4">
            <Tooltip>
              <TooltipTrigger>
                <div className="flex h-10 w-10 items-center justify-center">
                  <MessagesSquare className="h-6 w-6" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Chats</p>
              </TooltipContent>
            </Tooltip>

            {conversations.length > 0 && (
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
                data-testid="conversation-count-collapsed"
              >
                {conversations.length}
              </span>
            )}
          </div>

          {/* Expand Button */}
          {onToggleCollapse && (
            <div className="p-2 border-t w-full flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onToggleCollapse}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    aria-label="Expand sidebar"
                    data-testid="expand-library-button"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Expand Sidebar</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white" data-testid="conversation-library-panel">
      <div className="flex-shrink-0 bg-white border-b sticky top-0 z-[10]" data-testid="library-panel-header">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <MessagesSquare className="h-5 w-5" />
            <h2 className="font-semibold" data-testid="library-panel-title">
              Chats
            </h2>
          </div>
          {onToggleCollapse && (
            <Button
              onClick={onToggleCollapse}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Collapse sidebar"
              data-testid="collapse-library-button"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="px-3 pb-3">
          <NewConversationButton onClick={onNewConversation} disabled={isLoading} />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-3">
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
