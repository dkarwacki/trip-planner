/**
 * Plan API DTOs and Command Models
 *
 * Purpose: Type-safe API request/response contracts for the plan feature
 *
 * This file provides:
 * - DTO type aliases derived from validation schemas
 * - Re-exported schemas for use in API routes
 * - Input/output types for persona, conversation, and trip endpoints
 *
 * Design principles:
 * - All DTOs are derived from validation schemas using z.infer<>
 * - Schemas include branded type transforms (from domain models)
 * - DTOs use "DTO" suffix for API contract clarity
 * - Schemas are re-exported for validation in API routes
 *
 * Pattern: Following google-maps approach
 * - Define schemas in api/schemas.ts (with transforms)
 * - Derive types here using z.infer<> (gets branded types from transforms)
 * - Re-export schemas for easy validation
 */

import type { z } from "zod";
import {
  // Persona schemas
  PersonaTypeSchema,
  UpdatePersonasCommandSchema,
  GetUserPersonasResponseSchema,
  // Conversation schemas
  ConversationMessageInputSchema,
  PlaceSuggestionSchema,
  ChatMessageSchema,
  ConversationListItemSchema,
  ConversationListResponseSchema,
  ConversationDetailSchema,
  CreateConversationCommandSchema,
  CreateConversationResponseSchema,
  AddMessageCommandSchema,
  AddMessageResponseSchema,
  UpdateConversationCommandSchema,
  UpdateConversationResponseSchema,
  DeleteConversationResponseSchema,
  ChatRequestCommandSchema,
  // Trip schemas
  PlaceSchema,
  AttractionOnlySchema,
  RestaurantSchema,
  TripPlaceSchema,
  TripListItemSchema,
  TripListResponseSchema,
  TripDetailSchema,
  CreateTripPlaceInputSchema,
  CreateTripCommandSchema,
  CreateTripResponseSchema,
  UpdateTripPlaceInputSchema,
  UpdateTripCommandSchema,
  UpdateTripResponseSchema,
  DeleteTripResponseSchema,
} from "./schemas";

// ============================================================================
// Persona DTOs
// ============================================================================

/**
 * Enum of available persona types for trip planning preferences
 * Derived from: PersonaTypeSchema
 */
export type PersonaType = z.infer<typeof PersonaTypeSchema>;

/**
 * Response DTO for GET /api/personas
 * Derived from: GetUserPersonasResponseSchema
 */
export type GetUserPersonasResponseDTO = z.infer<typeof GetUserPersonasResponseSchema>;

/**
 * Command model for PUT /api/personas
 * Input: Update user's persona preferences
 * Derived from: UpdatePersonasCommandSchema
 */
export type UpdatePersonasCommandDTO = z.infer<typeof UpdatePersonasCommandSchema>;

// ============================================================================
// Conversation DTOs
// ============================================================================

/**
 * Photo DTO for place images
 * Shared type used in conversations and trips
 * Derived from: PhotoSchema (from common api)
 */
export type { Photo as PhotoDTO } from "@/infrastructure/common/api";

/**
 * Conversation message input DTO for chat history
 * Used in chat requests (no ID or timestamp)
 * Derived from: ConversationMessageInputSchema
 */
export type ConversationMessageInputDTO = z.infer<typeof ConversationMessageInputSchema>;

/**
 * Place suggestion DTO for AI-recommended places in chat
 * Derived from: PlaceSuggestionSchema (nested in ChatMessageSchema)
 */
export type PlaceSuggestionDTO = z.infer<typeof PlaceSuggestionSchema>;

/**
 * Chat message DTO for individual messages in a conversation
 * Derived from: ChatMessageSchema
 * Note: Includes MessageId branded type from schema transform
 */
export type ChatMessageDTO = z.infer<typeof ChatMessageSchema>;

/**
 * Conversation list item DTO for GET /api/conversations
 * Derived from: ConversationListItemSchema with computed fields
 * Note: Excludes messages for performance, includes ConversationId branded type
 */
export type ConversationListItemDTO = z.infer<typeof ConversationListItemSchema>;

/**
 * Conversation list response wrapper for GET /api/conversations
 * Derived from: ConversationListResponseSchema
 */
export type ConversationListResponseDTO = z.infer<typeof ConversationListResponseSchema>;

/**
 * Conversation detail DTO for GET /api/conversations/:id
 * Derived from: ConversationDetailSchema
 * Note: Includes ConversationId branded type from schema transform
 */
export type ConversationDetailDTO = z.infer<typeof ConversationDetailSchema>;

/**
 * Command model for POST /api/conversations
 * Input: Create a new conversation with initial message
 * Derived from: CreateConversationCommandSchema
 */
export type CreateConversationCommandDTO = z.infer<typeof CreateConversationCommandSchema>;

/**
 * Response DTO for POST /api/conversations
 * Returns full conversation with initial user message and AI response
 * Derived from: CreateConversationResponseSchema
 */
export type CreateConversationResponseDTO = z.infer<typeof CreateConversationResponseSchema>;

/**
 * Command model for POST /api/conversations/:id/messages
 * Input: Add a message to existing conversation
 * Derived from: AddMessageCommandSchema
 */
export type AddMessageCommandDTO = z.infer<typeof AddMessageCommandSchema>;

/**
 * Response DTO for POST /api/conversations/:id/messages
 * Returns only the new messages (user + AI response)
 * Derived from: AddMessageResponseSchema
 * Note: Includes ConversationId branded type
 */
export type AddMessageResponseDTO = z.infer<typeof AddMessageResponseSchema>;

/**
 * Command model for PUT /api/conversations/:id
 * Input: Update conversation metadata (title only)
 * Derived from: UpdateConversationCommandSchema
 */
export type UpdateConversationCommandDTO = z.infer<typeof UpdateConversationCommandSchema>;

/**
 * Response DTO for PUT /api/conversations/:id
 * Derived from: UpdateConversationResponseSchema
 * Note: Includes ConversationId branded type
 */
export type UpdateConversationResponseDTO = z.infer<typeof UpdateConversationResponseSchema>;

/**
 * Response DTO for DELETE /api/conversations/:id
 * Derived from: DeleteConversationResponseSchema
 * Note: Includes ConversationId branded type
 */
export type DeleteConversationResponseDTO = z.infer<typeof DeleteConversationResponseSchema>;

/**
 * Command model for POST /api/plan
 * Input: Send message to AI travel planning assistant
 * Derived from: ChatRequestCommandSchema
 */
export type ChatRequestCommandDTO = z.infer<typeof ChatRequestCommandSchema>;

// ============================================================================
// Trip DTOs
// ============================================================================

/**
 * Place DTO for validated places
 * Used in trip place structures
 * Derived from: PlaceSchema
 * Note: Includes PlaceId, Latitude, Longitude branded types from schema transform
 */
export type PlaceDTO = z.infer<typeof PlaceSchema>;

/**
 * Attraction DTO for attractions (type = 'attraction')
 * Derived from: AttractionOnlySchema (nested in TripPlaceSchema)
 * Note: Includes PlaceId and branded coordinate types from schema transform
 */
export type AttractionOnlyDTO = z.infer<typeof AttractionOnlySchema>;

/**
 * Restaurant DTO for restaurants (type = 'restaurant')
 * Derived from: RestaurantSchema (nested in TripPlaceSchema)
 * Note: Includes PlaceId and branded coordinate types from schema transform
 */
export type RestaurantDTO = z.infer<typeof RestaurantSchema>;

/**
 * Trip place DTO representing a place with associated attractions/restaurants
 * Derived from: TripPlaceSchema (nested in TripDetailSchema)
 */
export type TripPlaceDTO = z.infer<typeof TripPlaceSchema>;

/**
 * Trip list item DTO for GET /api/trips
 * Derived from: TripListItemSchema with computed field
 * Note: Excludes full places data for performance, includes TripId and ConversationId branded types
 */
export type TripListItemDTO = z.infer<typeof TripListItemSchema>;

/**
 * Trip list response wrapper for GET /api/trips
 * Derived from: TripListResponseSchema
 */
export type TripListResponseDTO = z.infer<typeof TripListResponseSchema>;

/**
 * Trip detail DTO for GET /api/trips/:id
 * Derived from: TripDetailSchema
 * Note: Includes TripId and ConversationId branded types from schema transform
 */
export type TripDetailDTO = z.infer<typeof TripDetailSchema>;

/**
 * Input model for creating a trip place
 * Used in CreateTripCommandDTO
 * Derived from: CreateTripPlaceInputSchema
 */
export type CreateTripPlaceInputDTO = z.infer<typeof CreateTripPlaceInputSchema>;

/**
 * Command model for POST /api/trips
 * Input: Create a new trip (export from conversation)
 * Derived from: CreateTripCommandSchema
 */
export type CreateTripCommandDTO = z.infer<typeof CreateTripCommandSchema>;

/**
 * Response DTO for POST /api/trips
 * Returns full trip with validated places
 * Derived from: CreateTripResponseSchema
 */
export type CreateTripResponseDTO = z.infer<typeof CreateTripResponseSchema>;

/**
 * Input model for updating a trip place
 * Used in UpdateTripCommandDTO
 * Derived from: UpdateTripPlaceInputSchema
 */
export type UpdateTripPlaceInputDTO = z.infer<typeof UpdateTripPlaceInputSchema>;

/**
 * Command model for PUT /api/trips/:id
 * Input: Update trip (auto-save from map interface)
 * Derived from: UpdateTripCommandSchema
 */
export type UpdateTripCommandDTO = z.infer<typeof UpdateTripCommandSchema>;

/**
 * Response DTO for PUT /api/trips/:id
 * Returns minimal response for performance
 * Derived from: UpdateTripResponseSchema
 * Note: Includes TripId branded type
 */
export type UpdateTripResponseDTO = z.infer<typeof UpdateTripResponseSchema>;

/**
 * Response DTO for DELETE /api/trips/:id
 * Derived from: DeleteTripResponseSchema
 * Note: Includes TripId branded type
 */
export type DeleteTripResponseDTO = z.infer<typeof DeleteTripResponseSchema>;
