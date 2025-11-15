import React from "react";
import type { ChatMessage } from "@/domain/plan/models/ChatMessage";

interface UserMessageProps {
  message: ChatMessage;
}

/**
 * UserMessage - User message bubble
 *
 * Features:
 * - Right-aligned layout
 * - Distinct styling from assistant messages
 * - Timestamp display
 * - Responsive text wrapping
 */
export function UserMessage({ message }: UserMessageProps) {
  const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] space-y-1">
        <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground">
          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
        </div>
        <p className="px-1 text-right text-xs text-muted-foreground">{timestamp}</p>
      </div>
    </div>
  );
}
