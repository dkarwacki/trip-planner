import { Brand } from "effect";
import type { Attraction } from "@/domain/map/models";

// Branded types for OpenRouter/AI agent
export type OpenRouterApiKey = string & Brand.Brand<"OpenRouterApiKey">;
export type OpenRouterModel = string & Brand.Brand<"OpenRouterModel">;
export type ToolName = string & Brand.Brand<"ToolName">;
export type ToolCallId = string & Brand.Brand<"ToolCallId">;
export type ConversationId = string & Brand.Brand<"ConversationId">;

// Constructors for branded types (nominal - no validation)
export const OpenRouterApiKey = Brand.nominal<OpenRouterApiKey>();
export const OpenRouterModel = Brand.nominal<OpenRouterModel>();
export const ToolName = Brand.nominal<ToolName>();
export const ToolCallId = Brand.nominal<ToolCallId>();
export const ConversationId = Brand.nominal<ConversationId>();

// Agent response types
export type SuggestionType = "add_attraction" | "add_restaurant" | "general_tip";
export type SuggestionPriority = "hidden gem" | "highly recommended" | "must-see";

export interface Suggestion {
  type: SuggestionType;
  reasoning: string;
  attractionName?: string;
  attractionData?: Attraction;
  priority?: SuggestionPriority; // Required for add_attraction/add_restaurant, not needed for general_tip
}

export interface AgentResponse {
  _thinking: string[];
  suggestions: Suggestion[];
  summary: string;
}
