import React, { useMemo } from "react";
import type { Attraction } from "@/domain/map/models";
import { getPlaceTypeCategory } from "@/lib/map-v2/placeTypeUtils";
import { DiscoveryMarker } from "./DiscoveryMarker";

interface DiscoveryMarkersLayerProps {
  places: Attraction[];
  hoveredMarkerId: string | null;
  selectedPlaceId: string | null;
  onMarkerClick: (placeId: string) => void;
  onMarkerHover: (placeId: string | null) => void;
}

interface PlaceWithCategory extends Attraction {
  isRestaurant: boolean;
}

export const DiscoveryMarkersLayer = React.memo(function DiscoveryMarkersLayer({
  places,
  hoveredMarkerId,
  selectedPlaceId,
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
          isSelected={selectedPlaceId === place.id}
          isRestaurant={place.isRestaurant}
          onMarkerClick={onMarkerClick}
          onMarkerHover={onMarkerHover}
        />
      ))}
    </>
  );
});
