/**
 * Map Feature Validation Schemas
 *
 * Purpose: Zod validation schemas for map feature (places, attractions, restaurants)
 *
 * This file provides:
 * - Place validation and details schemas
 * - Attraction and restaurant discovery schemas
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
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";
import {
  PhotoSchema,
  UUIDSchema,
  ISODateTimeSchema,
  LatitudeSchema,
  LongitudeSchema,
} from "@/infrastructure/common/api/schemas";

// ============================================================================
// Place Schemas
// ============================================================================

/**
 * Validation status enum for place validation
 */
export const ValidationStatusSchema = z.enum(["verified", "not_found", "partial"]);

/**
 * Place schema for validated places
 * Transforms: id → PlaceId, coordinates → branded types
 */
export const PlaceSchema = z
  .object({
    id: UUIDSchema,
    google_place_id: z.string(),
    name: z.string(),
    latitude: LatitudeSchema,
    longitude: LongitudeSchema,
    photos: z.array(PhotoSchema),
    validation_status: ValidationStatusSchema,
  })
  .transform((data) => ({
    ...data,
    id: PlaceId(data.id), // Transform to branded type
    latitude: Latitude(data.latitude), // Transform to branded type
    longitude: Longitude(data.longitude), // Transform to branded type
  }));

/**
 * Place detail schema with timestamps
 * Extends PlaceSchema with cache freshness tracking
 */
export const PlaceDetailSchema = z
  .object({
    id: UUIDSchema,
    google_place_id: z.string(),
    name: z.string(),
    latitude: LatitudeSchema,
    longitude: LongitudeSchema,
    photos: z.array(PhotoSchema),
    validation_status: ValidationStatusSchema,
    created_at: ISODateTimeSchema,
    updated_at: ISODateTimeSchema,
    last_updated_at: ISODateTimeSchema, // Cache freshness
  })
  .transform((data) => ({
    ...data,
    id: PlaceId(data.id),
    latitude: Latitude(data.latitude),
    longitude: Longitude(data.longitude),
  }));

/**
 * Command schema for POST /api/places/validate
 * Input: Validate a place name through Google Maps
 * No transforms (command input)
 */
export const ValidatePlaceCommandSchema = z.object({
  place_name: z.string().min(1, "Place name is required").max(200, "Place name must be 200 characters or less"),
});

/**
 * Response schema for POST /api/places/validate
 */
export const ValidatePlaceResponseSchema = z.object({
  place_name: z.string(),
  validated: z.boolean(),
  place: PlaceSchema,
});

// ============================================================================
// Attraction Schemas
// ============================================================================

/**
 * Score explanation schema for transparency in attraction scoring
 * Optional field providing human-readable scoring rationale
 */
export const ScoreExplanationSchema = z.object({
  quality: z.string(),
  diversity: z.string(),
  confidence: z.string(),
});

/**
 * Attraction schema (type = 'attraction')
 * Transforms: id → PlaceId, coordinates → branded types
 */
export const AttractionSchema = z
  .object({
    id: UUIDSchema,
    google_place_id: z.string(),
    type: z.literal("attraction"),
    name: z.string(),
    rating: z.number().nullable(),
    user_ratings_total: z.number().int().nullable(),
    types: z.array(z.string()), // Google Maps place types
    vicinity: z.string().nullable(),
    latitude: LatitudeSchema,
    longitude: LongitudeSchema,
    photos: z.array(PhotoSchema),
    quality_score: z.number().min(0).max(1).nullable(),
    diversity_score: z.number().min(0).max(1).nullable(),
    confidence_score: z.number().min(0).max(1).nullable(),
    scores_explanation: ScoreExplanationSchema.optional(), // Optional transparency
  })
  .transform((data) => ({
    ...data,
    id: PlaceId(data.id), // Transform to branded type
    latitude: Latitude(data.latitude), // Transform to branded type
    longitude: Longitude(data.longitude), // Transform to branded type
  }));

/**
 * Query parameters schema for GET /api/attractions
 * No transforms (query params input)
 */
export const AttractionsQueryParamsSchema = z.object({
  lat: LatitudeSchema,
  lng: LongitudeSchema,
  radius: z
    .number()
    .int()
    .min(100, "Radius must be at least 100 meters")
    .max(50000, "Radius must be at most 50km")
    .default(5000),
  limit: z.number().int().min(1, "Limit must be at least 1").max(50, "Limit must be at most 50").default(20),
});

/**
 * Response schema for GET /api/attractions
 */
export const AttractionsResponseSchema = z.object({
  attractions: z.array(AttractionSchema),
  center: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  radius: z.number(),
});

// ============================================================================
// Restaurant Schemas
// ============================================================================

/**
 * Restaurant schema (type = 'restaurant')
 * Includes price_level field specific to restaurants
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
    types: z.array(z.string()), // Google Maps place types
    vicinity: z.string().nullable(),
    price_level: z.number().int().min(0).max(4).nullable(), // 0-4, restaurant-specific
    latitude: LatitudeSchema,
    longitude: LongitudeSchema,
    photos: z.array(PhotoSchema),
    quality_score: z.number().min(0).max(1).nullable(),
    diversity_score: z.number().min(0).max(1).nullable(),
    confidence_score: z.number().min(0).max(1).nullable(),
  })
  .transform((data) => ({
    ...data,
    id: PlaceId(data.id), // Transform to branded type
    latitude: Latitude(data.latitude), // Transform to branded type
    longitude: Longitude(data.longitude), // Transform to branded type
  }));

/**
 * Query parameters schema for GET /api/restaurants
 * No transforms (query params input)
 */
export const RestaurantsQueryParamsSchema = z.object({
  lat: LatitudeSchema,
  lng: LongitudeSchema,
  radius: z
    .number()
    .int()
    .min(100, "Radius must be at least 100 meters")
    .max(10000, "Radius must be at most 10km")
    .default(2000),
  limit: z.number().int().min(1, "Limit must be at least 1").max(50, "Limit must be at most 50").default(20),
  price_level: z
    .string()
    .regex(/^[0-4](,[0-4])*$/, "Price level must be comma-separated values from 0-4")
    .optional(),
});

/**
 * Response schema for GET /api/restaurants
 */
export const RestaurantsResponseSchema = z.object({
  restaurants: z.array(RestaurantSchema),
  center: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  radius: z.number(),
});

// ============================================================================
// Geocoding Schemas
// ============================================================================

/**
 * Command schema for POST /api/geocoding/reverse
 * Input: Reverse geocode coordinates to get place information
 * No transforms (command input)
 */
export const ReverseGeocodeCommandSchema = z.object({
  lat: LatitudeSchema,
  lng: LongitudeSchema,
});

// ============================================================================
// Place Search Schemas
// ============================================================================

/**
 * Command schema for GET /api/places/search
 * Input: Search for places by query string
 * No transforms (command input)
 */
export const SearchPlaceCommandSchema = z.object({
  query: z.string({ required_error: "query is required" }).min(1, "query cannot be empty"),
});

// ============================================================================
// Photo Schemas
// ============================================================================

/**
 * Command schema for GET /api/photos
 * Input: Fetch Google Maps place photo
 * No transforms (command input)
 */
export const GetPhotoCommandSchema = z.object({
  photoReference: z.string().min(1, "Photo reference is required"),
  maxWidth: z.number().int().positive().max(1600).default(800),
  lat: LatitudeSchema,
  lng: LongitudeSchema,
  placeName: z.string().min(1, "Place name is required"),
});

/**
 * Response schema for Google Maps photo API responses
 * Used internally by GetPhoto use case to validate external API responses
 */
export const PhotoResponseSchema = z.object({
  data: z.instanceof(Buffer),
  contentType: z.string(),
});

// ============================================================================
// AI Suggestion Schemas (for SuggestNearbyAttractions endpoint)
// ============================================================================

/**
 * Conversation message schema for chat history
 * Used in SuggestNearbyAttractionsCommandSchema
 */
const ConversationMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

/**
 * Planned attraction schema for places in the trip
 */
const PlannedAttractionSchema = z.object({
  id: z.string(),
  name: z.string(),
  rating: z.number(),
  userRatingsTotal: z.number(),
  types: z.array(z.string()),
  vicinity: z.string(),
  priceLevel: z.number().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

/**
 * Planned restaurant schema for places in the trip
 */
const PlannedRestaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  rating: z.number(),
  userRatingsTotal: z.number(),
  types: z.array(z.string()),
  vicinity: z.string(),
  priceLevel: z.number().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

/**
 * Place schema for the current place being planned
 */
const CurrentPlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  plannedAttractions: z.array(PlannedAttractionSchema),
  plannedRestaurants: z.array(PlannedRestaurantSchema),
});

/**
 * Command schema for POST /api/attractions/suggest
 * Input: Get AI suggestions for nearby attractions
 * No transforms (command input)
 */
export const SuggestNearbyAttractionsCommandSchema = z.object({
  place: CurrentPlaceSchema,
  mapCoordinates: z.object({
    lat: LatitudeSchema,
    lng: LongitudeSchema,
  }),
  conversationHistory: z.array(ConversationMessageSchema).default([]),
  userMessage: z.string().optional(),
});

/**
 * Suggestion schema for AI-recommended attractions/restaurants
 * Transforms to domain types (PlaceId, Latitude, Longitude)
 */
const SuggestionSchema = z
  .object({
    type: z.enum(["add_attraction", "add_restaurant", "general_tip"]),
    reasoning: z.string(),
    attractionName: z.string().optional(),
    priority: z.enum(["hidden gem", "highly recommended", "must-see"]).optional(),
    attractionData: z
      .object({
        id: z.string(),
        name: z.string(),
        rating: z.number(),
        userRatingsTotal: z.number(),
        types: z.array(z.string()),
        vicinity: z.string(),
        priceLevel: z.number().optional(),
        location: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        photos: z.array(PhotoSchema).optional(),
      })
      .optional(),
    photos: z.array(PhotoSchema).optional(),
  })
  .transform((data) => {
    if (data.attractionData) {
      return {
        ...data,
        attractionData: {
          ...data.attractionData,
          id: PlaceId(data.attractionData.id),
          location: {
            lat: Latitude(data.attractionData.location.lat),
            lng: Longitude(data.attractionData.location.lng),
          },
        },
      };
    }
    return data;
  });

/**
 * Response schema for OpenAI agent responses
 * Used internally by SuggestNearbyAttractions use case to validate external API responses
 * Validates AI-generated suggestions and transforms them to domain types
 */
export const AgentResponseSchema = z.object({
  _thinking: z.array(z.string()).describe("Step-by-step reasoning before making suggestions"),
  suggestions: z.array(SuggestionSchema),
  summary: z.string(),
});

// Note: Type definitions have been moved to types.ts
// Types are derived there using z.infer<typeof Schema> and include branded types from transforms
