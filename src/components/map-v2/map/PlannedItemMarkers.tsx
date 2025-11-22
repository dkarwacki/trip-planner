/**
 * Planned item markers component
 * Renders markers for attractions/restaurants that have been added to the plan
 * Color-coded: green for all planned items to distinguish from discovery markers
 */

import React from "react";
import type { Attraction } from "@/domain/map/models";
import { PlannedItemMarker } from "./PlannedItemMarker";

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

export const PlannedItemMarkers = React.memo(function PlannedItemMarkers({
  places,
  onMarkerClick,
  onMarkerHover,
  hoveredId,
  expandedCardPlaceId,
}: PlannedItemMarkersProps) {
  // Flatten all planned items from all places
  // Memoized to prevent expensive flatMap on every render (critical for large trip plans)
  const plannedItems: PlannedItem[] = React.useMemo(() => {
    return places.flatMap((place) => {
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
  }, [places]);

  return (
    <>
      {plannedItems.map(({ attraction, placeId, category }) => (
        <PlannedItemMarker
          key={attraction.id}
          attraction={attraction}
          placeId={placeId}
          isRestaurant={category === "restaurants"}
          isHovered={hoveredId === attraction.id}
          isExpanded={expandedCardPlaceId === attraction.id}
          onMarkerClick={onMarkerClick}
          onMarkerHover={onMarkerHover}
        />
      ))}
    </>
  );
});
