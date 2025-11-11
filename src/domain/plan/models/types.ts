/**
 * Plan Feature Use Case Commands
 *
 * Purpose: Domain input types for plan feature use cases
 *
 * These types define the contracts for application layer use cases.
 * Infrastructure layer maps DTOs to these domain types.
 *
 * Pattern: Command/Query types live in domain, not infrastructure
 * - Commands: Write operations (mutations)
 * - Queries: Read operations (searches, lookups)
 */

import type { PersonaType } from "./Persona";

/**
 * Conversation message for chat history
 */
export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ============================================================================
// Chat Commands
// ============================================================================

/**
 * Command: Send message to AI travel planning assistant
 */
export interface ChatRequestCommand {
  message: string;
  personas: PersonaType[];
  conversationHistory: ConversationMessage[];
}
