/**
 * Place markers component
 * Renders hub markers (places in itinerary) on the map
 * Optimized with incremental updates to prevent full re-renders
 */

import { useCallback, useEffect, useRef } from "react";
import { useMapInstance } from "./hooks/useMapInstance";
import { useMapStore } from "../stores/mapStore";
import type { PlannedPlaceViewModel } from "@/lib/map/types";

interface PlaceMarkersProps {
  places: PlannedPlaceViewModel[];
  selectedPlaceId: string | null;
  onPlaceClick: (place: PlannedPlaceViewModel) => void;
}

interface MarkerData {
  marker: google.maps.marker.AdvancedMarkerElement;
  element: HTMLDivElement;
  place: PlannedPlaceViewModel;
}

export function PlaceMarkers({ places, selectedPlaceId, onPlaceClick }: PlaceMarkersProps) {
  const { map, markerLibrary, isReady } = useMapInstance();
  const shouldFitBounds = useMapStore((state) => state.shouldFitBounds);
  const clearFitBoundsRequest = useMapStore((state) => state.clearFitBoundsRequest);
  const markersRef = useRef<Map<string, MarkerData>>(new Map());
  const previousPlacesRef = useRef<PlannedPlaceViewModel[]>([]);
  const hasFitBoundsRef = useRef(false);

  // Create marker element with proper styling
  const createMarkerElement = useCallback((place: PlannedPlaceViewModel, index: number, isSelected: boolean) => {
    const element = document.createElement("div");
    element.className = "relative cursor-pointer transition-all duration-200";
    element.style.width = isSelected ? "48px" : "36px";
    element.style.height = isSelected ? "48px" : "36px";

    element.innerHTML = `
      <div class="w-full h-full rounded-full bg-blue-600 border-4 border-white shadow-lg flex items-center justify-center ${
        isSelected ? "ring-2 ring-blue-400" : ""
      }">
        <span class="text-white font-bold text-sm">${index + 1}</span>
      </div>
    `;

    return element;
  }, []);

  // Update marker visual state when selection changes
  const updateMarkerVisualState = useCallback((element: HTMLDivElement, index: number, isSelected: boolean) => {
    element.style.width = isSelected ? "44px" : "36px";
    element.style.height = isSelected ? "44px" : "36px";

    const innerDiv = element.querySelector("div");
    if (innerDiv) {
      if (isSelected) {
        innerDiv.classList.add("ring-2", "ring-blue-400");
      } else {
        innerDiv.classList.remove("ring-2", "ring-blue-400");
      }

      const span = innerDiv.querySelector("span");
      if (span) {
        span.textContent = `${index + 1}`;
      }
    }
  }, []);

  // Incremental marker updates - only add/remove/update changed markers
  useEffect(() => {
    if (!isReady || !map || !markerLibrary) {
      return;
    }

    if (!places || !Array.isArray(places)) {
      // Clear all markers if places is invalid
      markersRef.current.forEach(({ marker }) => {
        marker.map = null;
      });
      markersRef.current.clear();
      previousPlacesRef.current = [];
      return;
    }

    const previousPlaces = previousPlacesRef.current;
    const currentPlaceIds = new Set(places.map((p) => p.id));
    const previousPlaceIds = new Set(previousPlaces.map((p) => p.id));

    // Find removed places
    const removedPlaceIds = previousPlaces.filter((p) => !currentPlaceIds.has(p.id)).map((p) => p.id);

    // Find added places
    const addedPlaces = places.filter((p) => !previousPlaceIds.has(p.id));

    // Remove markers for removed places
    removedPlaceIds.forEach((placeId) => {
      const markerData = markersRef.current.get(placeId);
      if (markerData) {
        markerData.marker.map = null;
        markersRef.current.delete(placeId);
      }
    });

    // Add markers for new places
    addedPlaces.forEach((place) => {
      const index = places.findIndex((p) => p.id === place.id);
      const isSelected = place.id === selectedPlaceId;

      const lat = place.latitude;
      const lng = place.longitude;

      // Skip invalid coordinates
      if (!isFinite(lat) || !isFinite(lng)) {
        return;
      }

      // Create marker element
      const element = createMarkerElement(place, index, isSelected);

      const marker = new markerLibrary.AdvancedMarkerElement({
        map,
        position: { lat, lng },
        content: element,
        title: place.name,
      });

      // Click handler
      marker.addListener("click", () => {
        onPlaceClick(place);
      });

      markersRef.current.set(place.id, { marker, element, place });
    });

    // Update existing markers (for index changes or selection state)
    places.forEach((place, index) => {
      const markerData = markersRef.current.get(place.id);
      if (markerData && !addedPlaces.includes(place)) {
        const isSelected = place.id === selectedPlaceId;
        updateMarkerVisualState(markerData.element, index, isSelected);
        markerData.place = place;
      }
    });

    // Fit bounds only on initial load or when places change significantly
    const shouldDoFitBounds = !hasFitBoundsRef.current || removedPlaceIds.length > 0 || addedPlaces.length > 0;

    if (shouldDoFitBounds && places.length > 0) {
      if (places.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        places.forEach((place) => {
          const lat = place.latitude;
          const lng = place.longitude;
          if (isFinite(lat) && isFinite(lng)) {
            bounds.extend({ lat, lng });
          }
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 400 });
          hasFitBoundsRef.current = true;
        }
      } else if (places.length === 1) {
        const place = places[0];
        const lat = place.latitude;
        const lng = place.longitude;
        if (isFinite(lat) && isFinite(lng)) {
          map.panTo({ lat, lng });
          map.setZoom(14);
          hasFitBoundsRef.current = true;
        }
      }
    }

    // Update previous places reference
    previousPlacesRef.current = places;
  }, [
    places,
    selectedPlaceId,
    map,
    markerLibrary,
    isReady,
    onPlaceClick,
    createMarkerElement,
    updateMarkerVisualState,
  ]);

  // Handle explicit fit bounds requests (e.g., when switching trips)
  useEffect(() => {
    if (!map || !shouldFitBounds) return;

    if (places.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      places.forEach((place) => {
        const lat = place.latitude;
        const lng = place.longitude;
        if (isFinite(lat) && isFinite(lng)) {
          bounds.extend({ lat, lng });
        }
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 400 });
      }
    } else if (places.length === 1) {
      const place = places[0];
      const lat = place.latitude;
      const lng = place.longitude;
      if (isFinite(lat) && isFinite(lng)) {
        map.panTo({ lat, lng });
        map.setZoom(14);
      }
    } else {
      // No places - reset to world view
      map.setCenter({ lat: 0, lng: 0 });
      map.setZoom(2);
    }

    // Reset the flag after handling
    clearFitBoundsRequest();
  }, [map, shouldFitBounds, places, clearFitBoundsRequest]);

  // Cleanup on unmount
  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      markers.forEach(({ marker }) => {
        marker.map = null;
      });
      markers.clear();
    };
  }, []);

  return null; // This component doesn't render DOM directly
}
