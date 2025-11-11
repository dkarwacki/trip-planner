/**
 * Plan API Mappers
 *
 * Purpose: Map infrastructure DTOs to domain types
 *
 * These mappers transform validated DTOs (from schemas) into domain types
 * that the application layer understands. This keeps the application layer
 * pure and independent of infrastructure concerns.
 *
 * Pattern: DTO → Domain transformation
 * - DTOs are infrastructure types (from Zod schemas)
 * - Domain types are pure business types
 * - Mappers bridge the gap between layers
 */

import type { ChatRequestCommandDTO } from "./types";
import type { ChatRequestCommand } from "@/domain/plan/models";
import { PersonaType } from "@/domain/plan/models";

/**
 * Map infrastructure DTOs to domain commands/queries
 */
export const toDomain = {
  /**
   * Map ChatRequestCommandDTO to ChatRequestCommand
   */
  chatRequest: (dto: ChatRequestCommandDTO): ChatRequestCommand => ({
    message: dto.message,
    personas: dto.personas.map((p) => PersonaType(p)),
    conversationHistory: dto.conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  }),
};
