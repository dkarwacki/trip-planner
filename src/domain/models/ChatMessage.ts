import { Brand } from "effect";
import type { PlacePhoto } from "./Place";

// Branded types
export type MessageId = string & Brand.Brand<"MessageId">;
export const MessageId = Brand.nominal<MessageId>();

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: MessageId;
  role: MessageRole;
  content: string;
  timestamp: number;
  suggestedPlaces?: PlaceSuggestion[];
  thinking?: string[];
}

export interface PlaceSuggestion {
  name: string;
  description: string;
  reasoning: string;
  lat?: number;
  lng?: number;
  photos?: PlacePhoto[];
}

export const createUserMessage = (content: string): ChatMessage => ({
  id: MessageId(crypto.randomUUID()),
  role: "user",
  content,
  timestamp: Date.now(),
});

export const createAssistantMessage = (
  content: string,
  suggestedPlaces?: PlaceSuggestion[],
  thinking?: string[]
): ChatMessage => ({
  id: MessageId(crypto.randomUUID()),
  role: "assistant",
  content,
  timestamp: Date.now(),
  suggestedPlaces,
  thinking,
});
