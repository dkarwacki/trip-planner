/**
 * ViewModels for map-v2 components
 *
 * Purpose: Enhance DTOs with UI-specific state and computed properties
 *
 * Design principles:
 * - Prefer DTOs over ViewModels when possible
 * - Create ViewModels only when DTOs need:
 *   - UI interaction state (isExpanded, isSelected, etc.)
 *   - Computed properties for display
 *   - Combining multiple DTOs
 *   - Transforming complex nested structures
 *
 * Mapping:
 * - All DTO → ViewModel mapping in /src/lib/map-v2/mappers.ts
 * - Backend handles all DAO → Domain → DTO mapping
 */

import type { PhotoDTO } from "@/infrastructure/map/api";

// ============================================================================
// Shared Photo ViewModel
// ============================================================================

/**
 * Photo with location context for optimized rendering
 * Extends PhotoDTO with latitude/longitude for location-aware features
 */
export interface PhotoViewModel extends PhotoDTO {
  lat?: number;
  lng?: number;
}

// ============================================================================
// Discovery ViewModels
// ============================================================================

/**
 * Base interface for discovery items (attractions and restaurants)
 * Combines common fields and adds UI state
 */
interface BaseDiscoveryItemViewModel {
  id: string;
  googlePlaceId: string;
  name: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingsTotal?: number;
  types: string[];
  vicinity: string;
  photos?: PhotoViewModel[];

  // Score fields
  score: number;
  qualityScore?: number;
  personaScore?: number;
  diversityScore?: number;
  confidenceScore?: number;
  scoresExplanation?: string; // Stringified JSON of score breakdown

  // Item type discriminator
  itemType: "attraction" | "restaurant";
}

/**
 * Attraction ViewModel for discovery results
 * Based on AttractionDTO with unified structure
 */
export interface AttractionViewModel extends BaseDiscoveryItemViewModel {
  itemType: "attraction";
}

/**
 * Restaurant ViewModel for discovery results
 * Based on RestaurantDTO with unified structure
 */
export interface RestaurantViewModel extends BaseDiscoveryItemViewModel {
  itemType: "restaurant";
  priceLevel?: number;
}

/**
 * Unified ViewModel for discovery results
 * Allows treating attractions and restaurants uniformly in components
 */
export type DiscoveryItemViewModel = AttractionViewModel | RestaurantViewModel;

// ============================================================================
// Plan ViewModels
// ============================================================================

/**
 * Simplified POI (Point of Interest) for planned items
 * Flattened structure from AttractionOnlyDTO/RestaurantDTO for easier consumption
 */
export interface PlannedPOIViewModel {
  id: string;
  googlePlaceId: string;
  name: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingsTotal?: number;
  types: string[];
  vicinity: string;
  photos?: PhotoViewModel[];
  priceLevel?: number; // Only for restaurants

  // Scores (optional, not always available in trip data)
  qualityScore?: number;
  personaScore?: number;
  diversityScore?: number;
  confidenceScore?: number;
}

/**
 * PlannedPlace ViewModel for plan state
 * Combines TripPlaceDTO data with flattened structure for UI consumption
 *
 * Use cases:
 * - Plan state management (stores/slices/createPlanSlice.ts)
 * - Plan item cards (components/map-v2/plan/)
 * - Map markers for planned items
 *
 * Differences from TripPlaceDTO:
 * - Flattened place properties for easier access
 * - Simplified attractions/restaurants structure
 * - Photos with location context
 */
export interface PlannedPlaceViewModel {
  // Place identity
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  photos?: PhotoViewModel[];

  // Planned POIs
  plannedAttractions: PlannedPOIViewModel[];
  plannedRestaurants: PlannedPOIViewModel[];
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for AttractionViewModel
 */
export function isAttractionViewModel(item: DiscoveryItemViewModel): item is AttractionViewModel {
  return item.itemType === "attraction";
}

/**
 * Type guard for RestaurantViewModel
 */
export function isRestaurantViewModel(item: DiscoveryItemViewModel): item is RestaurantViewModel {
  return item.itemType === "restaurant";
}
