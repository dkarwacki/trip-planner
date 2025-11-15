import { useState, useCallback, useEffect } from "react";
import type { ItineraryPlace } from "../types";
import type { PlaceSuggestion } from "@/domain/plan/models/ChatMessage";
import { saveCurrentItinerary, loadCurrentItinerary, clearCurrentItinerary } from "@/lib/common/storage";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";
import type { Place } from "@/domain/common/models";

export interface UseItineraryReturn {
  places: ItineraryPlace[];
  addPlace: (suggestion: PlaceSuggestion) => void;
  removePlace: (placeId: string) => void;
  reorderPlaces: (newPlaces: ItineraryPlace[]) => void;
  clearItinerary: () => void;
  hasPlace: (placeId: string) => boolean;
  setPlaces: (places: ItineraryPlace[]) => void;
}

/**
 * Convert ItineraryPlace to domain Place model
 */
function itineraryPlaceToPlace(itineraryPlace: ItineraryPlace): Place {
  return {
    id: PlaceId(itineraryPlace.id),
    name: itineraryPlace.name,
    lat: Latitude(itineraryPlace.coordinates.lat),
    lng: Longitude(itineraryPlace.coordinates.lng),
    plannedAttractions: [],
    plannedRestaurants: [],
    photos: itineraryPlace.photos,
  };
}

/**
 * Convert domain Place model to ItineraryPlace
 */
function placeToItineraryPlace(place: Place): ItineraryPlace {
  return {
    id: place.id,
    name: place.name,
    description: undefined,
    coordinates: {
      lat: place.lat,
      lng: place.lng,
    },
    photos: place.photos,
  };
}

/**
 * useItinerary - Manage itinerary state
 *
 * Features:
 * - Add places from suggestions
 * - Remove places
 * - Reorder places (for drag-drop)
 * - Check if place already added (duplicate detection)
 * - Clear entire itinerary
 * - Persist to localStorage (like old plan view)
 *
 * Note: This is temporary state - will be synced with server in Phase 10
 */
export function useItinerary(): UseItineraryReturn {
  // Load from localStorage on mount (only if no conversationId in URL)
  const [places, setPlaces] = useState<ItineraryPlace[]>(() => {
    if (typeof window === "undefined") return [];

    // Only load from localStorage if no conversationId in URL
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get("conversationId");

    if (!conversationId) {
      const loadedPlaces = loadCurrentItinerary();
      return loadedPlaces.map(placeToItineraryPlace);
    }

    return [];
  });

  const addPlace = useCallback((suggestion: PlaceSuggestion) => {
    const newPlace: ItineraryPlace = {
      id: suggestion.id || suggestion.name,
      name: suggestion.name,
      description: suggestion.description,
      coordinates: {
        lat: suggestion.lat || 0,
        lng: suggestion.lng || 0,
      },
      photos: suggestion.photos,
    };

    setPlaces((current) => {
      // Check if place already exists
      if (current.some((p) => p.id === newPlace.id)) {
        return current;
      }
      return [...current, newPlace];
    });
  }, []);

  const removePlace = useCallback((placeId: string) => {
    setPlaces((current) => current.filter((p) => p.id !== placeId));
  }, []);

  const reorderPlaces = useCallback((newPlaces: ItineraryPlace[]) => {
    setPlaces(newPlaces);
  }, []);

  const clearItinerary = useCallback(() => {
    setPlaces([]);
    clearCurrentItinerary();
  }, []);

  const hasPlace = useCallback(
    (placeId: string) => {
      return places.some((p) => p.id === placeId);
    },
    [places]
  );

  const setPlacesDirectly = useCallback((newPlaces: ItineraryPlace[]) => {
    setPlaces(newPlaces);
  }, []);

  // Save to localStorage whenever places change (like old plan view)
  useEffect(() => {
    // Only save to localStorage if no conversationId in URL
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get("conversationId");

    if (!conversationId) {
      const domainPlaces = places.map(itineraryPlaceToPlace);
      saveCurrentItinerary(domainPlaces);
    }
  }, [places]);

  return {
    places,
    addPlace,
    removePlace,
    reorderPlaces,
    clearItinerary,
    hasPlace,
    setPlaces: setPlacesDirectly,
  };
}
