/**
 * Common Validation Schemas
 *
 * Purpose: Shared Zod validation schemas used across all features
 *
 * This file provides:
 * - Reusable primitive schemas (UUID, coordinates, timestamps)
 * - Common composite schemas (photo, coordinates)
 * - Type-safe validation helpers
 *
 * Pattern: Following infrastructure pattern
 * - Define schemas without branded types (these are primitives/externals)
 * - Types are derived in types.ts using z.infer
 * - Feature-specific schemas go in feature/api/schemas.ts
 */

import { z } from "zod";

// ============================================================================
// Primitive Validation Schemas
// ============================================================================

/**
 * UUID validation schema
 * Used for: IDs from database (places, attractions, conversations, trips, etc.)
 */
export const UUIDSchema = z.string().uuid();

/**
 * ISO 8601 datetime string validation
 * Used for: timestamps from database (created_at, updated_at)
 * Example: "2025-11-09T14:30:00Z"
 */
export const ISODateTimeSchema = z.string().datetime();

/**
 * Non-empty string validation
 * Used for: required text fields (names, titles, messages)
 */
export const NonEmptyStringSchema = z.string().trim().min(1);

// ============================================================================
// Coordinate Validation Schemas
// ============================================================================

/**
 * Latitude validation (-90 to 90)
 * Used for: geographic coordinates
 */
export const LatitudeSchema = z
  .number({ required_error: "Latitude is required" })
  .min(-90, "Latitude must be between -90 and 90")
  .max(90, "Latitude must be between -90 and 90");

/**
 * Longitude validation (-180 to 180)
 * Used for: geographic coordinates
 */
export const LongitudeSchema = z
  .number({ required_error: "Longitude is required" })
  .min(-180, "Longitude must be between -180 and 180")
  .max(180, "Longitude must be between -180 and 180");

/**
 * Coordinates validation (lat + lng)
 * Used for: location objects
 */
export const CoordinatesSchema = z.object({
  lat: LatitudeSchema,
  lng: LongitudeSchema,
});

// ============================================================================
// Common Composite Schemas
// ============================================================================

/**
 * Photo schema for Google Maps place photos
 * Used across: places, attractions, restaurants in all features
 */
export const PhotoSchema = z.object({
  photoReference: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  attributions: z.array(z.string()).default([]),
});

// Note: Type definitions have been moved to types.ts
// Types are derived there using z.infer<typeof Schema>
