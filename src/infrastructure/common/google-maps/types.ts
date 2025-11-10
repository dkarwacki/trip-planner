/**
 * Google Maps API Types
 *
 * Purpose: Type-safe contracts for Google Maps API responses
 *
 * This file provides:
 * - Type aliases derived from validation schemas
 * - Re-exported schemas for validation
 * - External API response types (no DTO suffix - these are Google's contracts)
 *
 * Pattern: Following infrastructure api/types.ts approach
 * - Define schemas in schemas.ts (with transforms where needed)
 * - Derive types here using z.infer
 * - Re-export schemas for easy validation
 */

import type { z } from "zod";
import {
  GeocodeResponseSchema,
  TextSearchResponseSchema,
  PlaceDetailsResponseSchema,
  NearbySearchResponseSchema,
  PlaceSchema,
} from "./schemas";

// ============================================================================
// Google Maps API Response Types
// ============================================================================

/**
 * Geocoding API response
 * Derived from: GeocodeResponseSchema
 * Used for: Converting addresses/place names to coordinates
 */
export type GeocodeResponse = z.infer<typeof GeocodeResponseSchema>;

/**
 * Text Search API response (new Places API)
 * Derived from: TextSearchResponseSchema
 * Used for: Searching places by text query
 */
export type TextSearchResponse = z.infer<typeof TextSearchResponseSchema>;

/**
 * Nearby Search API response (new Places API)
 * Derived from: NearbySearchResponseSchema
 * Used for: Finding places near a location
 */
export type NearbySearchResponse = z.infer<typeof NearbySearchResponseSchema>;

/**
 * Place Details API response (new Places API)
 * Derived from: PlaceDetailsResponseSchema
 * Used for: Getting detailed information about a specific place
 */
export type PlaceDetailsResponse = z.infer<typeof PlaceDetailsResponseSchema>;

/**
 * Place object (from Places API)
 * Derived from: PlaceSchema
 * Used for: Individual place data within API responses
 */
export type Place = z.infer<typeof PlaceSchema>;

// ============================================================================
// Re-export Schemas for Validation
// ============================================================================

export {
  GeocodeResponseSchema,
  TextSearchResponseSchema,
  NearbySearchResponseSchema,
  PlaceDetailsResponseSchema,
  PlaceSchema,
} from "./schemas";
