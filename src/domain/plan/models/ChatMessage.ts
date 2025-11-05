import { Brand } from "effect";
import type { PlacePhoto } from "@/domain/common/models";

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
  id?: string; // Optional since unvalidated places won't have this
  name: string;
  description: string;
  reasoning: string;
  lat?: number;
  lng?: number;
  photos?: PlacePhoto[];
  validationStatus?: "verified" | "not_found" | "partial"; // Track validation state
  searchQuery?: string; // Track what was actually searched for debugging
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
