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

// Note: Type definitions have been moved to types.ts
// Types are derived there using z.infer<typeof Schema> and include branded types from transforms
