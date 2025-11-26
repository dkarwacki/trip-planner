/**
 * Map Feature Use Case Commands
 *
 * Purpose: Domain input types for map feature use cases
 *
 * These types define the contracts for application layer use cases.
 * Infrastructure layer maps DTOs to these domain types.
 *
 * Pattern: Command/Query types live in domain, not infrastructure
 * - Commands: Write operations (mutations)
 * - Queries: Read operations (searches, lookups)
 */

import type { Latitude, Longitude, PlacePhoto } from "@/domain/common/models";
import type { PersonaType } from "@/domain/plan/models";

/**
 * Conversation message for AI context
 */
export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Planned attraction in a place
 */
export interface PlannedAttraction {
  id: string;
  name: string;
  rating: number;
  userRatingsTotal: number;
  types: string[];
  vicinity: string;
  priceLevel?: number;
  location: {
    lat: number;
    lng: number;
  };
  photos?: PlacePhoto[];
  editorialSummary?: string;
  qualityScore?: number;
  diversityScore?: number;
  confidenceScore?: number;
}

/**
 * Planned restaurant in a place
 */
export interface PlannedRestaurant {
  id: string;
  name: string;
  rating: number;
  userRatingsTotal: number;
  types: string[];
  vicinity: string;
  priceLevel?: number;
  location: {
    lat: number;
    lng: number;
  };
  photos?: PlacePhoto[];
  editorialSummary?: string;
  qualityScore?: number;
  confidenceScore?: number;
}

/**
 * Current place with planned items
 */
export interface CurrentPlace {
  id: string;
  name: string;
  plannedAttractions: PlannedAttraction[];
  plannedRestaurants: PlannedRestaurant[];
}

// ============================================================================
// Geocoding Commands
// ============================================================================

/**
 * Command: Reverse geocode coordinates to get place information
 */
export interface ReverseGeocodeCommand {
  lat: Latitude;
  lng: Longitude;
}

// ============================================================================
// Attraction Queries
// ============================================================================

/**
 * Query: Get top attractions near a location
 */
export interface GetAttractionsQuery {
  lat: Latitude;
  lng: Longitude;
  radius: number;
  limit: number;
  personas: PersonaType[];
}

/**
 * Query: Get top restaurants near a location
 */
export interface GetRestaurantsQuery {
  lat: Latitude;
  lng: Longitude;
  radius: number;
  limit: number;
}

/**
 * Command: Get AI suggestions for nearby attractions
 */
export interface SuggestNearbyAttractionsCommand {
  place: CurrentPlace;
  mapCoordinates: {
    lat: Latitude;
    lng: Longitude;
  };
  conversationHistory: ConversationMessage[];
  userMessage?: string;
}

// ============================================================================
// Place Queries
// ============================================================================

/**
 * Query: Search for a place by name
 */
export interface SearchPlaceQuery {
  query: string;
}

// ============================================================================
// Photo Queries
// ============================================================================

/**
 * Query: Get a photo by reference
 */
export interface GetPhotoQuery {
  photoReference: string;
  maxWidth: number;
  lat: Latitude;
  lng: Longitude;
  placeName: string;
}
