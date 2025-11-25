/**
 * Data Mappers for Trip State
 *
 * Purpose: Convert between map-v2 ViewModels and database types
 * - PlannedPlaceViewModel <-> PlaceDAO
 * - PlannedPOIViewModel <-> AttractionDAO
 * - TripPlaceDTO -> PlaceDAO
 */

import type { PlannedPlaceViewModel, PlannedPOIViewModel, PhotoViewModel } from "@/lib/map-v2/types";
import type { PlaceDAO, AttractionDAO, PlacePhotoDAO } from "@/infrastructure/plan/database/types";
import type { TripPlaceDTO, AttractionOnlyDTO, RestaurantDTO } from "@/infrastructure/plan/api";

// ============================================================================
// Photo Conversions
// ============================================================================

export function placePhotoToDAO(photo: PhotoViewModel): PlacePhotoDAO {
  return {
    photoReference: photo.photoReference,
    width: photo.width,
    height: photo.height,
    attributions: photo.attributions || [],
  };
}

export function placePhotoFromDAO(dao: PlacePhotoDAO): PhotoViewModel {
  return {
    photoReference: dao.photoReference,
    width: dao.width,
    height: dao.height,
    attributions: dao.attributions,
  };
}

// ============================================================================
// Attraction Conversions
// ============================================================================

export function poiToDAO(poi: PlannedPOIViewModel): AttractionDAO {
  return {
    id: poi.id,
    googlePlaceId: poi.id,
    name: poi.name,
    rating: poi.rating,
    userRatingsTotal: poi.userRatingsTotal,
    types: poi.types,
    vicinity: poi.vicinity,
    priceLevel: poi.priceLevel,
    location: {
      lat: poi.latitude,
      lng: poi.longitude,
    },
    photos: poi.photos?.map(placePhotoToDAO),
    editorialSummary: undefined,
    qualityScore: poi.qualityScore,
    personaScore: poi.personaScore,
    diversityScore: poi.diversityScore,
    confidenceScore: poi.confidenceScore,
  };
}

export function poiFromDAO(dao: AttractionDAO): PlannedPOIViewModel {
  return {
    id: dao.id,
    googlePlaceId: dao.googlePlaceId,
    name: dao.name,
    latitude: dao.location.lat,
    longitude: dao.location.lng,
    rating: dao.rating,
    userRatingsTotal: dao.userRatingsTotal,
    types: dao.types,
    vicinity: dao.vicinity,
    priceLevel: dao.priceLevel,
    photos: dao.photos?.map(placePhotoFromDAO),
    qualityScore: dao.qualityScore,
    personaScore: dao.personaScore,
    diversityScore: dao.diversityScore,
    confidenceScore: dao.confidenceScore,
  };
}

// ============================================================================
// PlannedPlace Conversions
// ============================================================================

export function plannedPlaceToDAO(place: PlannedPlaceViewModel): PlaceDAO {
  return {
    id: place.id,
    name: place.name,
    address: undefined, // Not available in PlannedPlaceViewModel
    lat: place.latitude,
    lng: place.longitude,
    plannedAttractions: place.plannedAttractions.map(poiToDAO),
    plannedRestaurants: place.plannedRestaurants.map(poiToDAO),
    photos: place.photos?.map(placePhotoToDAO),
  };
}

export function plannedPlaceFromDAO(dao: PlaceDAO): PlannedPlaceViewModel {
  return {
    id: dao.id,
    name: dao.name || "",
    latitude: dao.lat,
    longitude: dao.lng,
    plannedAttractions: dao.plannedAttractions?.map(poiFromDAO) || [],
    plannedRestaurants: dao.plannedRestaurants?.map(poiFromDAO) || [],
    photos: dao.photos?.map(placePhotoFromDAO),
  };
}

// ============================================================================
// Batch Conversions
// ============================================================================

export function plannedPlacesToDAOs(places: PlannedPlaceViewModel[]): PlaceDAO[] {
  return places.map(plannedPlaceToDAO);
}

export function plannedPlacesFromDAOs(daos: PlaceDAO[]): PlannedPlaceViewModel[] {
  return daos.map(plannedPlaceFromDAO);
}

// ============================================================================
// TripPlaceDTO to PlaceDAO Conversions
// ============================================================================

/**
 * Convert AttractionOnlyDTO or RestaurantDTO to AttractionDAO
 * (Both use the same structure in map-v2)
 */
function poiDTOToAttractionDAO(poi: AttractionOnlyDTO | RestaurantDTO): AttractionDAO {
  return {
    id: poi.id,
    googlePlaceId: poi.id,
    name: poi.name,
    rating: poi.rating ?? undefined,
    userRatingsTotal: poi.user_ratings_total ?? undefined,
    types: poi.types,
    vicinity: poi.vicinity,
    priceLevel: (poi as RestaurantDTO).price_level ?? undefined,
    location: {
      lat: poi.latitude,
      lng: poi.longitude,
    },
    photos: poi.photos?.map(placePhotoFromDAO),
    editorialSummary: undefined,
    qualityScore: poi.quality_score ?? undefined,
    personaScore: poi.persona_score ?? undefined,
    diversityScore: poi.diversity_score ?? undefined,
    confidenceScore: poi.confidence_score ?? undefined,
  };
}

/**
 * Convert TripPlaceDTO (from API) to PlaceDAO (for map-v2 state)
 * Used when loading trips from /api/trips/:id or /api/trips/by-conversation/:conversationId
 */
export function tripPlaceDTOToPlaceDAO(dto: TripPlaceDTO): PlaceDAO {
  return {
    id: dto.place.id,
    name: dto.place.name,
    address: undefined, // Not available in TripPlaceDTO
    lat: dto.place.latitude,
    lng: dto.place.longitude,
    plannedAttractions: dto.attractions.map(poiDTOToAttractionDAO),
    plannedRestaurants: dto.restaurants.map(poiDTOToAttractionDAO),
    photos: dto.place.photos?.map(placePhotoFromDAO),
  };
}

/**
 * Convert TripPlaceDTO[] to PlaceDAO[] (batch conversion)
 */
export function tripPlaceDTOsToPlaceDAOs(dtos: TripPlaceDTO[]): PlaceDAO[] {
  return dtos.map(tripPlaceDTOToPlaceDAO);
}
