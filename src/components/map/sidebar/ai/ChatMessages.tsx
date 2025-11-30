/**
 * Chat message history with auto-scroll
 * Renders user and assistant messages
 */

import React, { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import type { AIMessage } from "../../types";
import { SuggestionCard } from "./SuggestionCard";
import { ThinkingProcess } from "./ThinkingProcess";
import { TypingIndicator } from "@/components/common/TypingIndicator";

interface ChatMessagesProps {
  messages: AIMessage[];
  isLoading: boolean;
  onAddSuggestion: (placeId: string) => void;
  addedPlaceIds: Set<string>;
  addingPlaceIds?: Set<string>;
}

export function ChatMessages({
  messages,
  isLoading,
  onAddSuggestion,
  addedPlaceIds,
  addingPlaceIds = new Set(),
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Empty state
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="max-w-sm space-y-4">
          <MessageCircle className="w-12 h-12 mx-auto text-gray-400" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">AI Travel Assistant</h3>
            <p className="text-sm text-gray-600">
              Ask me anything about places to visit, restaurants, hidden gems, or activities.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onAddSuggestion={onAddSuggestion}
          addedPlaceIds={addedPlaceIds}
          addingPlaceIds={addingPlaceIds}
        />
      ))}

      {isLoading && <TypingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
}

// Individual message bubble
interface MessageBubbleProps {
  message: AIMessage;
  onAddSuggestion: (placeId: string) => void;
  addedPlaceIds: Set<string>;
  addingPlaceIds: Set<string>;
}

function MessageBubble({ message, onAddSuggestion, addedPlaceIds, addingPlaceIds }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] space-y-3 ${isUser ? "items-end" : "items-start"}`}>
        {/* Message bubble */}
        <div className={`rounded-2xl px-4 py-3 ${isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-gray-500 px-2">
          {message.timestamp.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>

        {/* Suggestion cards (for assistant messages) */}
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="w-full space-y-3 mt-2">
            {message.suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                isAdded={suggestion.placeId ? addedPlaceIds.has(suggestion.placeId) : false}
                isAdding={suggestion.placeId ? addingPlaceIds.has(suggestion.placeId) : false}
                onAddClick={onAddSuggestion}
              />
            ))}
          </div>
        )}

        {/* Thinking process (collapsible, for assistant messages) */}
        {!isUser && message.suggestions && message.suggestions.length > 0 && message.thinkingSteps && (
          <ThinkingProcess steps={message.thinkingSteps} />
        )}
      </div>
    </div>
  );
}
