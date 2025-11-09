/**
 * Map Database DAOs (Data Access Objects)
 *
 * Purpose: Type-safe mapping for Google Maps API cache data
 *
 * This file provides:
 * - DAO interfaces for cached places and attractions (snake_case → camelCase)
 * - Converters from Google Maps API data to database Insert types
 * - Converters from database Row types to DAOs
 * - Converters from DAOs to domain models
 *
 * Note: These are cache tables shared across all users (no user scoping)
 */

import type { Database, TablesInsert } from "@/infrastructure/common/database/types";
import type { Attraction } from "@/domain/map/models";
import type { Place, PlacePhoto } from "@/domain/common/models";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";

// Extract database types for easier reference
type PlaceRow = Database["public"]["Tables"]["places"]["Row"];
type AttractionRow = Database["public"]["Tables"]["attractions"]["Row"];

// ============================================================================
// Nested DAO Interfaces (for JSONB structures)
// ============================================================================

export interface PlacePhotoDAO {
  photoReference: string;
  width: number;
  height: number;
  attributions: string[];
}

// ============================================================================
// Top-level DAO Interfaces (camelCase for TypeScript ergonomics)
// ============================================================================

export interface PlaceDAO {
  id: string;
  googlePlaceId: string;
  name: string;
  latitude: number;
  longitude: number;
  photos: PlacePhotoDAO[] | null;
  validationStatus: "verified" | "not_found" | "partial" | null;
  createdAt: string;
  updatedAt: string;
  lastUpdatedAt: string;
}

export interface AttractionDAO {
  id: string;
  googlePlaceId: string;
  type: "attraction" | "restaurant";
  name: string;
  rating: number | null;
  userRatingsTotal: number | null;
  types: string[] | null;
  vicinity: string | null;
  priceLevel: number | null;
  latitude: number;
  longitude: number;
  photos: PlacePhotoDAO[] | null;
  qualityScore: number | null;
  diversityScore: number | null;
  confidenceScore: number | null;
  createdAt: string;
  updatedAt: string;
  lastUpdatedAt: string;
}

// ============================================================================
// Converters: Domain/API → Database Insert
// ============================================================================

export interface PlaceInsertData {
  googlePlaceId: string;
  name: string;
  latitude: number;
  longitude: number;
  photos?: PlacePhotoDAO[];
  validationStatus?: "verified" | "not_found" | "partial";
}

export interface AttractionInsertData {
  googlePlaceId: string;
  type: "attraction" | "restaurant";
  name: string;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
  vicinity?: string;
  priceLevel?: number;
  latitude: number;
  longitude: number;
  photos?: PlacePhotoDAO[];
  qualityScore?: number;
  diversityScore?: number;
  confidenceScore?: number;
}

export const toPlaceInsert = (data: PlaceInsertData): TablesInsert<"places"> => ({
  google_place_id: data.googlePlaceId,
  name: data.name,
  latitude: data.latitude,
  longitude: data.longitude,
  photos: (data.photos ?? null) as never,
  validation_status: data.validationStatus ?? null,
  last_updated_at: new Date().toISOString(),
});

export const toAttractionInsert = (data: AttractionInsertData): TablesInsert<"attractions"> => ({
  google_place_id: data.googlePlaceId,
  type: data.type,
  name: data.name,
  rating: data.rating ?? null,
  user_ratings_total: data.userRatingsTotal ?? null,
  types: (data.types ?? null) as never,
  vicinity: data.vicinity ?? null,
  price_level: data.priceLevel ?? null,
  latitude: data.latitude,
  longitude: data.longitude,
  photos: (data.photos ?? null) as never,
  quality_score: data.qualityScore ?? null,
  diversity_score: data.diversityScore ?? null,
  confidence_score: data.confidenceScore ?? null,
  last_updated_at: new Date().toISOString(),
});

// ============================================================================
// Converters: Database Row → DAO
// ============================================================================

export const rowToPlaceDAO = (row: PlaceRow): PlaceDAO => ({
  id: row.id,
  googlePlaceId: row.google_place_id,
  name: row.name,
  latitude: row.latitude,
  longitude: row.longitude,
  photos: row.photos as unknown as PlacePhotoDAO[] | null,
  validationStatus: row.validation_status as "verified" | "not_found" | "partial" | null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastUpdatedAt: row.last_updated_at,
});

export const rowToAttractionDAO = (row: AttractionRow): AttractionDAO => ({
  id: row.id,
  googlePlaceId: row.google_place_id,
  type: row.type as "attraction" | "restaurant",
  name: row.name,
  rating: row.rating,
  userRatingsTotal: row.user_ratings_total,
  types: row.types as unknown as string[] | null,
  vicinity: row.vicinity,
  priceLevel: row.price_level,
  latitude: row.latitude,
  longitude: row.longitude,
  photos: row.photos as unknown as PlacePhotoDAO[] | null,
  qualityScore: row.quality_score,
  diversityScore: row.diversity_score,
  confidenceScore: row.confidence_score,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastUpdatedAt: row.last_updated_at,
});

// ============================================================================
// Converters: DAO → Domain Models
// ============================================================================

const toPlacePhoto = (dao: PlacePhotoDAO): PlacePhoto => ({
  photoReference: dao.photoReference,
  width: dao.width,
  height: dao.height,
  attributions: dao.attributions,
});

export const toPlace = (dao: PlaceDAO): Omit<Place, "plannedAttractions" | "plannedRestaurants"> => ({
  id: PlaceId(dao.id),
  name: dao.name,
  lat: Latitude(dao.latitude),
  lng: Longitude(dao.longitude),
  photos: dao.photos?.map(toPlacePhoto),
});

export const toAttraction = (dao: AttractionDAO): Attraction => ({
  id: PlaceId(dao.id),
  name: dao.name,
  rating: dao.rating ?? undefined,
  userRatingsTotal: dao.userRatingsTotal ?? undefined,
  types: dao.types ?? [],
  vicinity: dao.vicinity ?? "",
  priceLevel: dao.priceLevel ?? undefined,
  location: {
    lat: Latitude(dao.latitude),
    lng: Longitude(dao.longitude),
  },
  photos: dao.photos?.map(toPlacePhoto),
});
