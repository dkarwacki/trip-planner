import { Brand } from "effect";
import type { ChatMessage } from "./ChatMessage";
import type { TripId } from "./TripHistory";

// Branded types
export type ConversationId = string & Brand.Brand<"ConversationId">;
export const ConversationId = Brand.nominal<ConversationId>();

export type ConversationTimestamp = number & Brand.Brand<"ConversationTimestamp">;
export const ConversationTimestamp = Brand.nominal<ConversationTimestamp>();

export interface SavedConversation {
  id: ConversationId;
  title: string;
  messages: ChatMessage[];
  personas: string[];
  timestamp: ConversationTimestamp;
  lastUpdated: ConversationTimestamp;
  messageCount: number;
  tripId?: TripId;
}

export const createSavedConversation = (
  messages: ChatMessage[],
  personas: string[],
  title?: string
): SavedConversation => {
  const timestamp = ConversationTimestamp(Date.now());
  const generatedTitle = title ?? formatConversationTitle(messages, timestamp);

  return {
    id: ConversationId(crypto.randomUUID()),
    title: generatedTitle,
    messages,
    personas,
    timestamp,
    lastUpdated: timestamp,
    messageCount: messages.length,
  };
};

export const updateConversationMessages = (
  conversation: SavedConversation,
  messages: ChatMessage[]
): SavedConversation => ({
  ...conversation,
  messages,
  lastUpdated: ConversationTimestamp(Date.now()),
  messageCount: messages.length,
});

export const formatConversationTitle = (messages: ChatMessage[], timestamp: ConversationTimestamp): string => {
  // Try to extract first meaningful place or topic from user messages
  const firstUserMessage = messages.find((m) => m.role === "user")?.content;

  if (firstUserMessage) {
    // Extract potential place name (simple heuristic: first capitalized word sequence)
    const placeMatch = firstUserMessage.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/);
    if (placeMatch) {
      return `Trip to ${placeMatch[0]}`;
    }

    // Fallback: use first few words of the message
    const firstWords = firstUserMessage.split(" ").slice(0, 5).join(" ");
    if (firstWords.length > 0) {
      return firstWords.length > 30 ? `${firstWords.substring(0, 30)}...` : firstWords;
    }
  }

  // Final fallback: date-based title
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `Conversation - ${year}-${month}-${day} ${hours}:${minutes}`;
};
