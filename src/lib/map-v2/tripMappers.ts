/**
 * Data Mappers for Trip State
 *
 * Purpose: Convert between map-v2 component types and database types
 * - PlannedPlace <-> PlaceDAO
 * - Attraction <-> AttractionDAO
 */

import type { PlannedPlace } from "@/components/map-v2/types";
import type { PlaceDAO, AttractionDAO, PlacePhotoDAO } from "@/infrastructure/plan/database/types";
import type { Attraction } from "@/domain/map/models";
import type { PlacePhoto } from "@/domain/common/models";

// ============================================================================
// Photo Conversions
// ============================================================================

export function placePhotoToDAO(photo: PlacePhoto): PlacePhotoDAO {
  return {
    photoReference: photo.photoReference,
    width: photo.width,
    height: photo.height,
    attributions: photo.attributions || [],
  };
}

export function placePhotoFromDAO(dao: PlacePhotoDAO): PlacePhoto {
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

export function attractionToDAO(attraction: Attraction): AttractionDAO {
  return {
    id: attraction.id,
    googlePlaceId: attraction.googlePlaceId || attraction.id,
    name: attraction.name,
    rating: attraction.rating,
    userRatingsTotal: attraction.userRatingsTotal,
    types: attraction.types || [],
    vicinity: attraction.vicinity || "",
    priceLevel: attraction.priceLevel,
    location: {
      lat: attraction.location.lat,
      lng: attraction.location.lng,
    },
    photos: attraction.photos?.map(placePhotoToDAO),
    editorialSummary: attraction.editorialSummary,
    qualityScore: attraction.qualityScore,
    diversityScore: attraction.diversityScore,
    confidenceScore: attraction.confidenceScore,
  };
}

export function attractionFromDAO(dao: AttractionDAO): Attraction {
  return {
    id: dao.id,
    googlePlaceId: dao.googlePlaceId || dao.id,
    name: dao.name,
    rating: dao.rating,
    userRatingsTotal: dao.userRatingsTotal,
    types: dao.types,
    vicinity: dao.vicinity,
    priceLevel: dao.priceLevel,
    location: {
      lat: dao.location.lat,
      lng: dao.location.lng,
    },
    photos: dao.photos?.map(placePhotoFromDAO),
    editorialSummary: dao.editorialSummary,
    qualityScore: dao.qualityScore,
    diversityScore: dao.diversityScore,
    confidenceScore: dao.confidenceScore,
  };
}

// ============================================================================
// PlannedPlace Conversions
// ============================================================================

export function plannedPlaceToDAO(place: PlannedPlace): PlaceDAO {
  return {
    id: place.id,
    name: place.name,
    address: (place as any).address,
    lat: place.lat,
    lng: place.lng,
    plannedAttractions: (place.plannedAttractions || []).map(attractionToDAO),
    plannedRestaurants: (place.plannedRestaurants || []).map(attractionToDAO),
    photos: place.photos?.map(placePhotoToDAO),
  };
}

export function plannedPlaceFromDAO(dao: PlaceDAO): PlannedPlace {
  return {
    id: dao.id,
    name: dao.name || "",
    address: dao.address,
    lat: dao.lat,
    lng: dao.lng,
    plannedAttractions: dao.plannedAttractions?.map(attractionFromDAO) || [],
    plannedRestaurants: dao.plannedRestaurants?.map(attractionFromDAO) || [],
    photos: dao.photos?.map(placePhotoFromDAO),
  };
}

// ============================================================================
// Batch Conversions
// ============================================================================

export function plannedPlacesToDAOs(places: PlannedPlace[]): PlaceDAO[] {
  return places.map(plannedPlaceToDAO);
}

export function plannedPlacesFromDAOs(daos: PlaceDAO[]): PlannedPlace[] {
  return daos.map(plannedPlaceFromDAO);
}

