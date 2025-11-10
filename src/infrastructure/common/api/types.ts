/**
 * Common API Types
 *
 * Purpose: Shared type definitions used across all features
 *
 * This file provides:
 * - Type aliases derived from validation schemas
 * - Re-exported schemas for validation
 * - Common types (coordinates, photos, etc.)
 *
 * Pattern: Following infrastructure api/types.ts approach
 * - Define schemas in schemas.ts
 * - Derive types here using z.infer
 * - Re-export schemas for easy validation
 */

import type { z } from "zod";
import { CoordinatesSchema, PhotoSchema } from "./schemas";

// ============================================================================
// Common Types
// ============================================================================

/**
 * Coordinates (latitude and longitude)
 * Derived from: CoordinatesSchema
 * Used for: Geographic location representation
 */
export type Coordinates = z.infer<typeof CoordinatesSchema>;

/**
 * Photo metadata for place images
 * Derived from: PhotoSchema
 * Used for: Google Maps place photos across all features
 */
export type Photo = z.infer<typeof PhotoSchema>;
