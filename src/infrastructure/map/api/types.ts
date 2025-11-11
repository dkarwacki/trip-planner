/**
 * Map API DTOs and Command Models
 *
 * Purpose: Type-safe API request/response contracts for the map feature
 *
 * This file provides:
 * - DTO type aliases derived from validation schemas
 * - Re-exported schemas for use in API routes
 * - Input/output types for place, attraction, and restaurant endpoints
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
  // Place schemas
  PlaceSchema,
  PlaceDetailSchema,
  ValidatePlaceCommandSchema,
  ValidatePlaceResponseSchema,
  // Attraction schemas
  ScoreExplanationSchema,
  AttractionSchema,
  AttractionsQueryParamsSchema,
  AttractionsResponseSchema,
  // Restaurant schemas
  RestaurantSchema,
  RestaurantsQueryParamsSchema,
  RestaurantsResponseSchema,
  // Geocoding schemas
  ReverseGeocodeCommandSchema,
  // Search schemas
  SearchPlaceCommandSchema,
  // Photo schemas
  GetPhotoCommandSchema,
  PhotoResponseSchema,
  // AI Suggestion schemas
  SuggestNearbyAttractionsCommandSchema,
  AgentResponseSchema,
} from "./schemas";

// ============================================================================
// Shared Types
// ============================================================================

/**
 * Photo DTO for place images
 * Derived from: PhotoSchema (from common api)
 * Shared across places, attractions, and restaurants
 */
export type { Photo as PhotoDTO } from "@/infrastructure/common/api";

// ============================================================================
// Place DTOs
// ============================================================================

/**
 * Place DTO for validated places
 * Derived from: PlaceSchema
 * Note: Includes PlaceId, Latitude, Longitude branded types from schema transform
 */
export type PlaceDTO = z.infer<typeof PlaceSchema>;

/**
 * Place detail DTO for GET /api/places/:id
 * Derived from: PlaceDetailSchema (includes all fields with timestamps)
 * Note: Includes PlaceId and branded coordinate types from schema transform
 */
export type PlaceDetailDTO = z.infer<typeof PlaceDetailSchema>;

/**
 * Command model for POST /api/places/validate
 * Input: Validate a place name through Google Maps
 * Derived from: ValidatePlaceCommandSchema
 */
export type ValidatePlaceCommandDTO = z.infer<typeof ValidatePlaceCommandSchema>;

/**
 * Response DTO for POST /api/places/validate
 * Derived from: ValidatePlaceResponseSchema
 */
export type ValidatePlaceResponseDTO = z.infer<typeof ValidatePlaceResponseSchema>;

// ============================================================================
// Attraction DTOs
// ============================================================================

/**
 * Score explanation for transparency in attraction scoring
 * Optional field providing human-readable scoring rationale
 * Derived from: ScoreExplanationSchema
 */
export type ScoreExplanationDTO = z.infer<typeof ScoreExplanationSchema>;

/**
 * Attraction DTO for GET /api/attractions
 * Derived from: AttractionSchema (type = 'attraction')
 * Includes all fields with optional scores_explanation
 * Note: Includes PlaceId and branded coordinate types from schema transform
 */
export type AttractionDTO = z.infer<typeof AttractionSchema>;

/**
 * Query parameters for GET /api/attractions
 * Derived from: AttractionsQueryParamsSchema
 */
export type AttractionsQueryParamsDTO = z.infer<typeof AttractionsQueryParamsSchema>;

/**
 * Response DTO for GET /api/attractions
 * Derived from: AttractionsResponseSchema
 */
export type AttractionsResponseDTO = z.infer<typeof AttractionsResponseSchema>;

// ============================================================================
// Restaurant DTOs
// ============================================================================

/**
 * Restaurant DTO for GET /api/restaurants
 * Derived from: RestaurantSchema (type = 'restaurant')
 * Includes price_level field specific to restaurants
 * Note: Includes PlaceId and branded coordinate types from schema transform
 */
export type RestaurantDTO = z.infer<typeof RestaurantSchema>;

/**
 * Query parameters for GET /api/restaurants
 * Derived from: RestaurantsQueryParamsSchema
 */
export type RestaurantsQueryParamsDTO = z.infer<typeof RestaurantsQueryParamsSchema>;

/**
 * Response DTO for GET /api/restaurants
 * Derived from: RestaurantsResponseSchema
 */
export type RestaurantsResponseDTO = z.infer<typeof RestaurantsResponseSchema>;

// ============================================================================
// Geocoding DTOs
// ============================================================================

/**
 * Command model for POST /api/geocoding/reverse
 * Input: Reverse geocode coordinates to get place information
 * Derived from: ReverseGeocodeCommandSchema
 */
export type ReverseGeocodeCommandDTO = z.infer<typeof ReverseGeocodeCommandSchema>;

// ============================================================================
// Place Search DTOs
// ============================================================================

/**
 * Command model for GET /api/places/search
 * Input: Search for places by query string
 * Derived from: SearchPlaceCommandSchema
 */
export type SearchPlaceCommandDTO = z.infer<typeof SearchPlaceCommandSchema>;

// ============================================================================
// Photo DTOs
// ============================================================================

/**
 * Command model for GET /api/photos
 * Input: Fetch Google Maps place photo
 * Derived from: GetPhotoCommandSchema
 */
export type GetPhotoCommandDTO = z.infer<typeof GetPhotoCommandSchema>;

/**
 * Response DTO for Google Maps photo API responses
 * Used internally by GetPhoto use case to validate external API responses
 * Derived from: PhotoResponseSchema
 */
export type PhotoResponseDTO = z.infer<typeof PhotoResponseSchema>;

// ============================================================================
// AI Suggestion DTOs
// ============================================================================

/**
 * Command model for POST /api/attractions/suggest
 * Input: Get AI suggestions for nearby attractions
 * Derived from: SuggestNearbyAttractionsCommandSchema
 */
export type SuggestNearbyAttractionsCommandDTO = z.infer<typeof SuggestNearbyAttractionsCommandSchema>;

/**
 * Response DTO for OpenAI agent responses
 * Used internally by SuggestNearbyAttractions use case to validate external API responses
 * Derived from: AgentResponseSchema
 * Note: Includes PlaceId and branded coordinate types from schema transform
 */
export type AgentResponseDTO = z.infer<typeof AgentResponseSchema>;
