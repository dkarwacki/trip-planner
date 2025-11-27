import React, { useMemo } from "react";
import type { DiscoveryItemViewModel } from "@/lib/map-v2/types";
import { getPlaceTypeCategory } from "@/lib/map-v2/placeTypeUtils";
import { DiscoveryMarker } from "./DiscoveryMarker";

interface DiscoveryMarkersLayerProps {
  places: DiscoveryItemViewModel[];
  hoveredMarkerId: string | null;
  selectedPlaceId: string | null;
  highlightedPlaceId?: string | null;
  onMarkerClick: (placeId: string) => void;
  onMarkerHover: (placeId: string | null) => void;
}

type PlaceWithCategory = DiscoveryItemViewModel & {
  isRestaurant: boolean;
};

export const DiscoveryMarkersLayer = React.memo(function DiscoveryMarkersLayer({
  places,
  hoveredMarkerId,
  selectedPlaceId,
  highlightedPlaceId,
  onMarkerClick,
  onMarkerHover,
}: DiscoveryMarkersLayerProps) {
  // Pre-compute categories to avoid calling getPlaceTypeCategory on every render
  const placesWithCategories = useMemo<PlaceWithCategory[]>(() => {
    return places.map((place) => ({
      ...place,
      isRestaurant: getPlaceTypeCategory(place.types) === "restaurant",
    }));
  }, [places]);

  return (
    <>
      {placesWithCategories.map((place) => (
        <DiscoveryMarker
          key={place.id}
          place={place}
          isHovered={hoveredMarkerId === place.id}
          isSelected={selectedPlaceId === place.id || highlightedPlaceId === place.id}
          isRestaurant={place.isRestaurant}
          onMarkerClick={onMarkerClick}
          onMarkerHover={onMarkerHover}
        />
      ))}
    </>
  );
});
