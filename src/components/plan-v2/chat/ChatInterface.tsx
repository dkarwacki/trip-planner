import React from "react";
import { ChatEmptyState } from "./ChatEmptyState";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ErrorDisplay } from "../shared/ErrorDisplay";
import type { ChatInterfaceProps } from "../types";

/**
 * ChatInterface - Main chat container
 *
 * Features:
 * - Displays chat history or empty state
 * - Message input at bottom
 * - Handles sending messages
 * - Responsive layout that fills available space
 */
export function ChatInterface({
  messages,
  isLoading,
  onSendMessage,
  onAddPlace,
  selectedPersonas,
  onPersonaChange,
  error,
  onRetry,
  addedPlaceIds,
}: ChatInterfaceProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Messages or empty state - scrollable area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {messages.length === 0 && !isLoading ? (
          <ChatEmptyState selectedPersonas={selectedPersonas} onPersonaChange={onPersonaChange} />
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onAddPlace={onAddPlace}
            addedPlaceIds={addedPlaceIds}
          />
        )}

        {/* Error message with retry */}
        {error && (
          <div className="px-4 py-2">
            <ErrorDisplay message={error} onRetry={onRetry} size="sm" />
          </div>
        )}
      </div>

      {/* Message input - fixed at bottom */}
      <div className="flex-shrink-0 border-t p-4 bg-background">
        <MessageInput onSend={onSendMessage} isLoading={isLoading} disabled={selectedPersonas.length === 0} />
        {selectedPersonas.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Please select at least one travel style to start chatting
          </p>
        )}
      </div>
    </div>
  );
}
