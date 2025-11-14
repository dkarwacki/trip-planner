/**
 * Plan Feature Validation Schemas
 *
 * Purpose: Zod validation schemas for plan feature (personas, conversations, trips)
 *
 * This file provides:
 * - Request/response validation schemas
 * - Transforms to branded types (imported from domain)
 * - Type-safe DTOs derived with z.infer
 *
 * Pattern: Following google-maps/validation.ts approach
 * - Schemas include .transform() to branded domain types
 * - Export types using z.infer<> (will include branded types)
 * - Command schemas (inputs) have no transforms
 * - Response schemas (outputs) transform to branded types
 */

import { z } from "zod";
import { ConversationId, MessageId, TripId } from "@/domain/plan/models";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";
import {
  PhotoSchema,
  UUIDSchema,
  ISODateTimeSchema,
  LatitudeSchema,
  LongitudeSchema,
} from "@/infrastructure/common/api/schemas";

// ============================================================================
// Persona Schemas
// ============================================================================

/**
 * Persona type enum (8 available personas)
 */
export const PersonaTypeSchema = z.enum([
  "general_tourist",
  "nature_lover",
  "art_enthusiast",
  "foodie_traveler",
  "adventure_seeker",
  "digital_nomad",
  "history_buff",
  "photography_enthusiast",
]);

/**
 * Command schema for PUT /api/personas
 * Input: Update user's persona preferences
 */
export const UpdatePersonasCommandSchema = z.object({
  persona_types: z
    .array(PersonaTypeSchema)
    .min(1, "At least one persona type is required")
    .max(8, "Maximum 8 persona types allowed"),
});

/**
 * Response schema for GET /api/personas
 * Output: User's persona preferences
 */
export const GetUserPersonasResponseSchema = z.object({
  user_id: UUIDSchema,
  persona_types: z.array(PersonaTypeSchema),
  created_at: ISODateTimeSchema,
  updated_at: ISODateTimeSchema,
});

// ============================================================================
// Conversation Schemas - Nested Structures
// ============================================================================

/**
 * Simple conversation message schema for chat history input
 * Used in ChatRequestCommandSchema (no ID or timestamp, just role and content)
 */
export const ConversationMessageInputSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

export const PlaceSuggestionSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  reasoning: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  photos: z.array(PhotoSchema).optional(),
  validationStatus: z.enum(["verified", "not_found", "partial"]).optional(),
  searchQuery: z.string().optional(),
});

export const ChatMessageSchema = z
  .object({
    id: UUIDSchema,
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
    timestamp: ISODateTimeSchema,
    suggestedPlaces: z.array(PlaceSuggestionSchema).optional(),
    thinking: z.array(z.string()).optional(),
  })
  .transform((data) => ({
    ...data,
    id: MessageId(data.id),
  }));

// ============================================================================
// Conversation Schemas - Top Level
// ============================================================================

export const ConversationListItemSchema = z
  .object({
    id: UUIDSchema,
    title: z.string(),
    personas: z.array(PersonaTypeSchema),
    messageCount: z.number().int().min(0),
    timestamp: z.number(),
    lastUpdated: z.number(),
    tripId: UUIDSchema.optional(),
  })
  .transform((data) => ({
    ...data,
    id: ConversationId(data.id),
    tripId: data.tripId ? TripId(data.tripId) : undefined,
  }));

export const ConversationListResponseSchema = z.object({
  conversations: z.array(ConversationListItemSchema),
});

export const ConversationDetailSchema = z
  .object({
    id: UUIDSchema,
    title: z.string(),
    personas: z.array(PersonaTypeSchema),
    messages: z.array(ChatMessageSchema),
    timestamp: z.number(),
    lastUpdated: z.number(),
    messageCount: z.number().int().min(0),
    tripId: UUIDSchema.optional(),
  })
  .transform((data) => ({
    ...data,
    id: ConversationId(data.id),
    tripId: data.tripId ? TripId(data.tripId) : undefined,
  }));

export const CreateConversationCommandSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  personas: z.array(PersonaTypeSchema).min(1, "At least one persona is required").max(8, "Maximum 8 personas allowed"),
  initial_message: z
    .string()
    .min(1, "Initial message is required")
    .max(2000, "Message must be 2000 characters or less"),
});

/**
 * Response schema for POST /api/conversations
 * Output: Created conversation with initial messages
 */
export const CreateConversationResponseSchema = ConversationDetailSchema;

/**
 * Command schema for POST /api/conversations/:id/messages
 * Input: Add message to existing conversation
 * No transforms (command input)
 */
export const AddMessageCommandSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000, "Message must be 2000 characters or less"),
});

/**
 * Response schema for POST /api/conversations/:id/messages
 * Output: New messages added (user + AI response)
 */
export const AddMessageResponseSchema = z
  .object({
    conversation_id: UUIDSchema,
    new_messages: z.array(ChatMessageSchema), // User message + AI response
    updated_at: ISODateTimeSchema,
  })
  .transform((data) => ({
    ...data,
    conversation_id: ConversationId(data.conversation_id), // Transform to branded type
  }));

/**
 * Command schema for PUT /api/conversations/:id
 * Input: Update conversation metadata (title only)
 * No transforms (command input)
 */
export const UpdateConversationCommandSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
});

/**
 * Response schema for PUT /api/conversations/:id
 */
export const UpdateConversationResponseSchema = z
  .object({
    id: UUIDSchema,
    title: z.string(),
    updated_at: ISODateTimeSchema,
  })
  .transform((data) => ({
    ...data,
    id: ConversationId(data.id), // Transform to branded type
  }));

/**
 * Response schema for DELETE /api/conversations/:id
 */
export const DeleteConversationResponseSchema = z
  .object({
    id: UUIDSchema,
    deleted: z.boolean(),
  })
  .transform((data) => ({
    ...data,
    id: ConversationId(data.id), // Transform to branded type
  }));

/**
 * Command schema for PUT /api/conversations/:id/messages
 */
export const UpdateConversationMessagesCommandSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
      timestamp: z.number(), // Unix timestamp from domain model
      suggestedPlaces: z.array(PlaceSuggestionSchema).optional(),
      thinking: z.array(z.string()).optional(), // Match domain model field name
    })
  ),
});

/**
 * Response schema for PUT /api/conversations/:id/messages
 */
export const UpdateConversationMessagesResponseSchema = z
  .object({
    id: UUIDSchema,
    updated_at: ISODateTimeSchema,
  })
  .transform((data) => ({
    ...data,
    id: ConversationId(data.id), // Transform to branded type
  }));

/**
 * Command schema for POST /api/plan (Travel Planning Chat)
 * Input: Send message to AI travel planning assistant
 * No transforms (command input)
 */
export const ChatRequestCommandSchema = z.object({
  message: z.string({ required_error: "message is required" }).min(1, "message cannot be empty"),
  personas: z.array(PersonaTypeSchema).min(1, "At least one persona is required"),
  conversationHistory: z.array(ConversationMessageInputSchema).optional().default([]),
});

// ============================================================================
// Trip Schemas - Nested Structures
// ============================================================================

/**
 * Place schema for validated places in trips
 */
export const PlaceSchema = z
  .object({
    id: UUIDSchema,
    google_place_id: z.string(),
    name: z.string(),
    latitude: LatitudeSchema,
    longitude: LongitudeSchema,
    photos: z.array(PhotoSchema),
    validation_status: z.enum(["verified", "not_found", "partial"]),
  })
  .transform((data) => ({
    ...data,
    id: PlaceId(data.id), // Transform to branded type
    latitude: Latitude(data.latitude), // Transform to branded type
    longitude: Longitude(data.longitude), // Transform to branded type
  }));

/**
 * Attraction schema (type = 'attraction')
 */
export const AttractionOnlySchema = z
  .object({
    id: UUIDSchema,
    google_place_id: z.string(),
    type: z.literal("attraction"),
    name: z.string(),
    rating: z.number().nullable(),
    user_ratings_total: z.number().int().nullable(),
    types: z.array(z.string()),
    vicinity: z.string(),
    latitude: LatitudeSchema,
    longitude: LongitudeSchema,
    photos: z.array(PhotoSchema).optional(),
    quality_score: z.number().min(0).max(1).nullable(),
    diversity_score: z.number().min(0).max(1).nullable(),
    confidence_score: z.number().min(0).max(1).nullable(),
  })
  .transform((data) => ({
    ...data,
    id: PlaceId(data.id),
    latitude: Latitude(data.latitude),
    longitude: Longitude(data.longitude),
  }));

/**
 * Restaurant schema (type = 'restaurant')
 * Transforms: id → PlaceId, coordinates → branded types
 */
export const RestaurantSchema = z
  .object({
    id: UUIDSchema,
    google_place_id: z.string(),
    type: z.literal("restaurant"),
    name: z.string(),
    rating: z.number().nullable(),
    user_ratings_total: z.number().int().nullable(),
    types: z.array(z.string()),
    vicinity: z.string(),
    price_level: z.number().int().min(0).max(4).nullable(),
    latitude: LatitudeSchema,
    longitude: LongitudeSchema,
    photos: z.array(PhotoSchema).optional(),
    quality_score: z.number().min(0).max(1).nullable(),
    diversity_score: z.number().min(0).max(1).nullable(),
    confidence_score: z.number().min(0).max(1).nullable(),
  })
  .transform((data) => ({
    ...data,
    id: PlaceId(data.id),
    latitude: Latitude(data.latitude),
    longitude: Longitude(data.longitude),
  }));

/**
 * Trip place schema (place with attractions and restaurants)
 */
export const TripPlaceSchema = z.object({
  place: PlaceSchema,
  display_order: z.number().int().min(0),
  attractions: z.array(AttractionOnlySchema),
  restaurants: z.array(RestaurantSchema),
});

// ============================================================================
// Trip Schemas - Top Level
// ============================================================================

/**
 * Trip list item schema with branded type transforms
 */
export const TripListItemSchema = z
  .object({
    id: UUIDSchema,
    user_id: UUIDSchema,
    conversation_id: UUIDSchema.nullable(),
    title: z.string(),
    place_count: z.number().int().min(0),
    created_at: ISODateTimeSchema,
    updated_at: ISODateTimeSchema,
  })
  .transform((data) => ({
    ...data,
    id: TripId(data.id), // Transform to branded type
    conversation_id: data.conversation_id ? ConversationId(data.conversation_id) : null,
  }));

/**
 * Trip list response wrapper
 */
export const TripListResponseSchema = z.object({
  trips: z.array(TripListItemSchema),
});

/**
 * Trip detail schema with branded type transforms
 * Used for: GET /api/trips/:id (full trip with places)
 * Transforms: id → TripId, conversation_id → ConversationId
 */
export const TripDetailSchema = z
  .object({
    id: UUIDSchema,
    user_id: UUIDSchema,
    conversation_id: UUIDSchema.nullable(),
    title: z.string(),
    places: z.array(TripPlaceSchema),
    created_at: ISODateTimeSchema,
    updated_at: ISODateTimeSchema,
  })
  .transform((data) => ({
    ...data,
    id: TripId(data.id), // Transform to branded type
    conversation_id: data.conversation_id ? ConversationId(data.conversation_id) : null,
  }));

/**
 * Input schema for creating a trip place
 * Used in CreateTripCommandSchema
 */
export const CreateTripPlaceInputSchema = z.object({
  place_name: z.string().min(1, "Place name is required"),
  display_order: z.number().int().min(0, "Display order must be non-negative"),
});

/**
 * Command schema for POST /api/trips
 * Input: Create new trip (export from conversation)
 * No transforms (command input)
 */
export const CreateTripCommandSchema = z.object({
  conversation_id: UUIDSchema.optional(),
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  places: z
    .array(CreateTripPlaceInputSchema)
    .min(1, "At least one place is required")
    .max(50, "Maximum 50 places allowed"),
});

/**
 * Response schema for POST /api/trips
 * Output: Created trip with validated places
 */
export const CreateTripResponseSchema = TripDetailSchema;

/**
 * Input schema for updating a trip place
 * Used in UpdateTripCommandSchema
 */
export const UpdateTripPlaceInputSchema = z.object({
  place_name: z.string().min(1, "Place name is required"),
  display_order: z.number().int().min(0, "Display order must be non-negative"),
  attraction_ids: z.array(UUIDSchema).optional(),
  restaurant_ids: z.array(UUIDSchema).optional(),
});

/**
 * Command schema for PUT /api/trips/:id
 * Input: Update trip (auto-save from map interface)
 * No transforms (command input)
 */
export const UpdateTripCommandSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  places: z.array(UpdateTripPlaceInputSchema).optional(),
});

/**
 * Response schema for PUT /api/trips/:id
 * Returns minimal response for performance
 */
export const UpdateTripResponseSchema = z
  .object({
    id: UUIDSchema,
    updated_at: ISODateTimeSchema,
  })
  .transform((data) => ({
    ...data,
    id: TripId(data.id), // Transform to branded type
  }));

/**
 * Response schema for DELETE /api/trips/:id
 */
export const DeleteTripResponseSchema = z
  .object({
    id: UUIDSchema,
    deleted: z.boolean(),
  })
  .transform((data) => ({
    ...data,
    id: TripId(data.id), // Transform to branded type
  }));

// Note: Type definitions have been moved to types.ts
// Types are derived there using z.infer<typeof Schema> and include branded types from transforms
