/**
 * Planned item markers component
 * Renders markers for attractions/restaurants that have been added to the plan
 * Color-coded: blue for attractions, red for restaurants
 */

import { useCallback, useEffect, useRef } from "react";
import { useMapInstance } from "./hooks/useMapInstance";
import type { Attraction } from "@/domain/map/models";

interface PlannedItem {
  attraction: Attraction;
  placeId: string;
  category: "attractions" | "restaurants";
}

interface PlannedItemMarkersProps {
  places: any[]; // Will be typed with domain Place type
  onMarkerClick: (attractionId: string, placeId: string) => void;
  onMarkerHover?: (attractionId: string | null) => void;
  hoveredId?: string | null;
  expandedCardPlaceId?: string | null;
}

interface MarkerData {
  marker: google.maps.marker.AdvancedMarkerElement;
  element: HTMLDivElement;
  plannedItem: PlannedItem;
  mouseEnterHandler: () => void;
  mouseLeaveHandler: () => void;
}

export function PlannedItemMarkers({
  places,
  onMarkerClick,
  onMarkerHover,
  hoveredId,
  expandedCardPlaceId,
}: PlannedItemMarkersProps) {
  const { map, markerLibrary, isReady } = useMapInstance();
  const markersRef = useRef<Map<string, MarkerData>>(new Map());
  const previousItemsRef = useRef<PlannedItem[]>([]);

  // Flatten all planned items from all places
  const plannedItems: PlannedItem[] = places.flatMap((place) => {
    const attractions: PlannedItem[] = (place.plannedAttractions || []).map((attraction: Attraction) => ({
      attraction,
      placeId: place.id,
      category: "attractions" as const,
    }));

    const restaurants: PlannedItem[] = (place.plannedRestaurants || []).map((restaurant: Attraction) => ({
      attraction: restaurant,
      placeId: place.id,
      category: "restaurants" as const,
    }));

    return [...attractions, ...restaurants];
  });

  // Create marker element
  const createMarkerElement = useCallback((category: "attractions" | "restaurants") => {
    const markerColor = "#22c55e"; // green-500 for all planned items
    const element = document.createElement("div");
    element.className = "cursor-pointer transition-all duration-200";
    element.style.width = "20px";
    element.style.height = "20px";

    element.innerHTML = `
      <div class="w-full h-full rounded-full border-2 border-white shadow-md" style="background-color: ${markerColor};"></div>
    `;

    return element;
  }, []);

  // Incremental marker updates
  useEffect(() => {
    if (!isReady || !map || !markerLibrary) {
      return;
    }

    if (!plannedItems || !Array.isArray(plannedItems)) {
      // Clear all markers if plannedItems is invalid
      markersRef.current.forEach(({ marker, element, mouseEnterHandler, mouseLeaveHandler }) => {
        marker.map = null;
        element.removeEventListener("mouseenter", mouseEnterHandler);
        element.removeEventListener("mouseleave", mouseLeaveHandler);
      });
      markersRef.current.clear();
      previousItemsRef.current = [];
      return;
    }

    const previousItems = previousItemsRef.current;
    const currentItemIds = new Set(plannedItems.map((item) => item.attraction.id));
    const previousItemIds = new Set(previousItems.map((item) => item.attraction.id));

    // If previousItems is empty (component just mounted/remounted), clear any stale markers
    // and treat all current items as new to ensure they're all recreated
    if (previousItems.length === 0) {
      // Clear any existing markers that might be stale (shouldn't happen on fresh mount, but be safe)
      markersRef.current.forEach(({ marker, element, mouseEnterHandler, mouseLeaveHandler }) => {
        marker.map = null;
        element.removeEventListener("mouseenter", mouseEnterHandler);
        element.removeEventListener("mouseleave", mouseLeaveHandler);
      });
      markersRef.current.clear();
    }

    // Find removed items
    const removedItemIds = previousItems
      .filter((item) => !currentItemIds.has(item.attraction.id))
      .map((item) => item.attraction.id);

    // Find added items
    const addedItems = plannedItems.filter((item) => !previousItemIds.has(item.attraction.id));

    // Remove markers for removed items
    removedItemIds.forEach((attractionId) => {
      const markerData = markersRef.current.get(attractionId);
      if (markerData) {
        markerData.marker.map = null;
        markerData.element.removeEventListener("mouseenter", markerData.mouseEnterHandler);
        markerData.element.removeEventListener("mouseleave", markerData.mouseLeaveHandler);
        markersRef.current.delete(attractionId);
      }
    });

    // Add markers for new items
    addedItems.forEach((plannedItem) => {
      const { attraction, placeId, category } = plannedItem;
      const element = createMarkerElement(category);

      const marker = new markerLibrary.AdvancedMarkerElement({
        map,
        position: { lat: attraction.location.lat, lng: attraction.location.lng },
        content: element,
        title: attraction.name,
      });

      // Click handler
      marker.addListener("click", () => {
        onMarkerClick(attraction.id, placeId);
      });

      // Hover handlers (desktop only)
      const mouseEnterHandler = () => {
        if (onMarkerHover) {
          onMarkerHover(attraction.id);
        }
      };

      const mouseLeaveHandler = () => {
        if (onMarkerHover) {
          onMarkerHover(null);
        }
      };

      if (onMarkerHover) {
        element.addEventListener("mouseenter", mouseEnterHandler);
        element.addEventListener("mouseleave", mouseLeaveHandler);
      }

      markersRef.current.set(attraction.id, {
        marker,
        element,
        plannedItem,
        mouseEnterHandler,
        mouseLeaveHandler,
      });
    });

    // Update previous items reference
    previousItemsRef.current = plannedItems;
  }, [plannedItems, map, markerLibrary, isReady, onMarkerClick, onMarkerHover, createMarkerElement]);

  // Update marker styles on hover or when card is expanded (separate effect to avoid recreating markers)
  useEffect(() => {
    markersRef.current.forEach(({ element }, id) => {
      const isHighlighted = id === hoveredId || id === expandedCardPlaceId;
      if (isHighlighted) {
        element.style.transform = "scale(1.3)";
        element.style.zIndex = "1000";
      } else {
        element.style.transform = "scale(1)";
        element.style.zIndex = "auto";
      }
    });
  }, [hoveredId, expandedCardPlaceId]);

  // Cleanup on unmount
  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      markers.forEach(({ marker, element, mouseEnterHandler, mouseLeaveHandler }) => {
        marker.map = null;
        element.removeEventListener("mouseenter", mouseEnterHandler);
        element.removeEventListener("mouseleave", mouseLeaveHandler);
      });
      markers.clear();
    };
  }, []);

  return null;
}
