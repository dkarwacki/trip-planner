import { Brand } from "effect";

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
