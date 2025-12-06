import React, { useEffect, useRef } from "react";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";
import type { ChatMessage, PlaceSuggestion } from "@/domain/plan/models/ChatMessage";
import { TypingIndicator } from "@/components/common/TypingIndicator";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onAddPlace?: (place: PlaceSuggestion) => void;
  addedPlaceIds?: Set<string>;
}

/**
 * MessageList - Scrollable message feed
 *
 * Features:
 * - Auto-scrolls to bottom on new messages
 * - Renders user and assistant messages
 * - Shows loading indicator when AI is responding
 * - Smooth scroll behavior
 */
export function MessageList({ messages, isLoading = false, onAddPlace, addedPlaceIds = new Set() }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Find the first assistant message index
  const firstAssistantIndex = messages.findIndex((m) => m.role === "assistant");

  return (
    <div className="space-y-4 p-4" data-testid="message-list">
      {messages.map((message, index) => {
        if (message.role === "user") {
          return <UserMessage key={message.id} message={message} />;
        }

        if (message.role === "assistant") {
          return (
            <AssistantMessage
              key={message.id}
              message={message}
              onAddPlace={onAddPlace}
              addedPlaceIds={addedPlaceIds}
              isFirstMessage={index === firstAssistantIndex}
            />
          );
        }

        return null;
      })}

      {/* Loading indicator */}
      {isLoading && <TypingIndicator />}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} data-testid="messages-end-anchor" />
    </div>
  );
}
