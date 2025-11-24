/**
 * DTO → ViewModel Mappers for map-v2
 *
 * Purpose: Transform DTOs (from infrastructure layer) to ViewModels (for UI layer)
 *
 * Design principles:
 * - Only map DTOs to ViewModels (no DAO or domain type handling)
 * - No `any` or `unknown` types
 * - Clear, descriptive function names
 * - Proper null/undefined handling
 *
 * Import pattern:
 * import { toViewModel } from '@/lib/map-v2/mappers';
 * const viewModel = toViewModel.attraction(dto);
 */

import type { PhotoDTO, AttractionDTO, RestaurantDTO } from "@/infrastructure/map/api";
import type { TripPlaceDTO, AttractionOnlyDTO, RestaurantDTO as PlanRestaurantDTO } from "@/infrastructure/plan/api";
import type {
  PhotoViewModel,
  AttractionViewModel,
  RestaurantViewModel,
  DiscoveryItemViewModel,
  PlannedPOIViewModel,
  PlannedPlaceViewModel,
} from "./types";

// ============================================================================
// Photo Mappers
// ============================================================================

/**
 * Map PhotoDTO to PhotoViewModel with optional location context
 */
function photoToViewModel(dto: PhotoDTO, lat?: number, lng?: number): PhotoViewModel {
  return {
    ...dto,
    lat,
    lng,
  };
}

// ============================================================================
// Discovery Mappers
// ============================================================================

/**
 * Map AttractionDTO to AttractionViewModel
 * Adds itemType discriminator for unified discovery handling
 */
function attractionToViewModel(dto: AttractionDTO): AttractionViewModel {
  // Calculate combined score from individual scores if available
  const score = dto.quality_score ?? 0;

  return {
    id: dto.id,
    googlePlaceId: dto.google_place_id,
    name: dto.name,
    latitude: dto.latitude,
    longitude: dto.longitude,
    rating: dto.rating ?? undefined,
    userRatingsTotal: dto.user_ratings_total ?? undefined,
    types: dto.types,
    vicinity: dto.vicinity ?? "",
    photos: dto.photos?.map((p) => photoToViewModel(p, dto.latitude, dto.longitude)),

    // Scores
    score,
    qualityScore: dto.quality_score ?? undefined,
    diversityScore: dto.diversity_score ?? undefined,
    confidenceScore: dto.confidence_score ?? undefined,
    scoresExplanation: dto.scores_explanation ? JSON.stringify(dto.scores_explanation) : undefined,

    // Discriminator
    itemType: "attraction",
  };
}

/**
 * Map RestaurantDTO to RestaurantViewModel
 * Adds itemType discriminator for unified discovery handling
 */
function restaurantToViewModel(dto: RestaurantDTO): RestaurantViewModel {
  // Calculate combined score from individual scores if available
  const score = dto.quality_score ?? 0;

  return {
    id: dto.id,
    googlePlaceId: dto.google_place_id,
    name: dto.name,
    latitude: dto.latitude,
    longitude: dto.longitude,
    rating: dto.rating ?? undefined,
    userRatingsTotal: dto.user_ratings_total ?? undefined,
    types: dto.types,
    vicinity: dto.vicinity ?? "",
    photos: dto.photos?.map((p) => photoToViewModel(p, dto.latitude, dto.longitude)),

    // Scores
    score,
    qualityScore: dto.quality_score ?? undefined,
    diversityScore: dto.diversity_score ?? undefined,
    confidenceScore: dto.confidence_score ?? undefined,

    // Restaurant-specific
    priceLevel: dto.price_level ?? undefined,

    // Discriminator
    itemType: "restaurant",
  };
}

/**
 * Map AttractionDTO[] to DiscoveryItemViewModel[]
 * Convenience batch mapper for attraction discovery results
 */
function attractionsToViewModels(dtos: AttractionDTO[]): DiscoveryItemViewModel[] {
  return dtos.map(attractionToViewModel);
}

/**
 * Map RestaurantDTO[] to DiscoveryItemViewModel[]
 * Convenience batch mapper for restaurant discovery results
 */
function restaurantsToViewModels(dtos: RestaurantDTO[]): DiscoveryItemViewModel[] {
  return dtos.map(restaurantToViewModel);
}

// ============================================================================
// Plan Mappers
// ============================================================================

/**
 * Map AttractionOnlyDTO to PlannedPOIViewModel
 * Used for attractions in trip places
 */
function attractionOnlyToViewModel(dto: AttractionOnlyDTO): PlannedPOIViewModel {
  return {
    id: dto.id,
    googlePlaceId: dto.google_place_id,
    name: dto.name,
    latitude: dto.latitude,
    longitude: dto.longitude,
    rating: dto.rating ?? undefined,
    userRatingsTotal: dto.user_ratings_total ?? undefined,
    types: dto.types,
    vicinity: dto.vicinity,
    photos: dto.photos?.map((p) => photoToViewModel(p, dto.latitude, dto.longitude)),
    qualityScore: dto.quality_score ?? undefined,
    diversityScore: dto.diversity_score ?? undefined,
    confidenceScore: dto.confidence_score ?? undefined,
  };
}

/**
 * Map PlanRestaurantDTO to PlannedPOIViewModel
 * Used for restaurants in trip places
 */
function planRestaurantToViewModel(dto: PlanRestaurantDTO): PlannedPOIViewModel {
  return {
    id: dto.id,
    googlePlaceId: dto.google_place_id,
    name: dto.name,
    latitude: dto.latitude,
    longitude: dto.longitude,
    rating: dto.rating ?? undefined,
    userRatingsTotal: dto.user_ratings_total ?? undefined,
    types: dto.types,
    vicinity: dto.vicinity,
    photos: dto.photos?.map((p) => photoToViewModel(p, dto.latitude, dto.longitude)),
    priceLevel: dto.price_level ?? undefined,
    qualityScore: dto.quality_score ?? undefined,
    diversityScore: dto.diversity_score ?? undefined,
    confidenceScore: dto.confidence_score ?? undefined,
  };
}

/**
 * Map TripPlaceDTO to PlannedPlaceViewModel
 * Flattens nested structure for easier UI consumption
 */
function tripPlaceToViewModel(dto: TripPlaceDTO): PlannedPlaceViewModel {
  return {
    id: dto.place.id,
    name: dto.place.name,
    latitude: dto.place.latitude,
    longitude: dto.place.longitude,
    photos: dto.place.photos?.map((p) => photoToViewModel(p, dto.place.latitude, dto.place.longitude)),
    plannedAttractions: dto.attractions.map(attractionOnlyToViewModel),
    plannedRestaurants: dto.restaurants.map(planRestaurantToViewModel),
  };
}

/**
 * Map TripPlaceDTO[] to PlannedPlaceViewModel[]
 * Convenience batch mapper for trip loading
 */
function tripPlacesToViewModels(dtos: TripPlaceDTO[]): PlannedPlaceViewModel[] {
  return dtos.map(tripPlaceToViewModel);
}

// ============================================================================
// Reverse Mappers (ViewModel → Command DTOs for API requests)
// ============================================================================

// Note: Reverse mapping is intentionally not provided here.
// When saving data back to the API, construct UpdateTripCommandDTO directly
// from ViewModels or use the original DTOs. ViewModels are for display only.

// ============================================================================
// Exports
// ============================================================================

/**
 * Organized exports for DTO → ViewModel mapping
 * Usage: toViewModel.attraction(dto)
 */
export const toViewModel = {
  // Discovery
  attraction: attractionToViewModel,
  restaurant: restaurantToViewModel,
  attractions: attractionsToViewModels,
  restaurants: restaurantsToViewModels,

  // Plan
  tripPlace: tripPlaceToViewModel,
  tripPlaces: tripPlacesToViewModels,
  attractionOnly: attractionOnlyToViewModel,
  planRestaurant: planRestaurantToViewModel,

  // Photo
  photo: photoToViewModel,
} as const;
