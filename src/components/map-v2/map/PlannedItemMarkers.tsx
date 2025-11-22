/**
 * Planned item markers component
 * Renders markers for attractions/restaurants that have been added to the plan
 * Color-coded: green for all planned items to distinguish from discovery markers
 */

import React from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { Attraction } from "@/domain/map/models";
import { Utensils, Landmark } from "lucide-react";

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

  return (
    <>
      {plannedItems.map(({ attraction, placeId, category }) => {
        const isHovered = hoveredId === attraction.id;
        const isExpanded = expandedCardPlaceId === attraction.id;
        const isRestaurant = category === "restaurants";

        return (
          <AdvancedMarker
            key={attraction.id}
            position={attraction.location}
            onClick={() => onMarkerClick(attraction.id, placeId)}
            zIndex={isExpanded ? 200 : isHovered ? 150 : 140}
            className="custom-marker"
          >
            <div
              className={`
                relative transition-all duration-300 cursor-pointer group
                ${isExpanded ? "scale-125 z-50" : isHovered ? "scale-110 z-40" : "scale-100 z-30"}
              `}
              onMouseEnter={() => onMarkerHover?.(attraction.id)}
              onMouseLeave={() => onMarkerHover?.(null)}
            >
              {/* Marker Pin */}
              <div
                className={`
                  flex items-center justify-center w-7 h-7 rounded-full shadow-lg border-2 transition-colors
                  ${
                    isExpanded
                      ? "bg-green-600 border-white text-white"
                      : "bg-white border-green-500 text-green-600 hover:bg-green-50"
                  }
                `}
              >
                {isRestaurant ? <Utensils className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
              </div>

              {/* Pulse effect for expanded marker */}
              {isExpanded && (
                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30 -z-10" />
              )}
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
});
