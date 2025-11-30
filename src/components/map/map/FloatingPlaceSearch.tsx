import React, { useCallback } from "react";
import { PlaceSearchBar } from "../search/PlaceSearchBar";
import { useMapStore } from "../stores/mapStore";
import { useNearbyPlaces } from "../hooks/useNearbyPlaces";
import { NEARBY_SEARCH_RADIUS_METERS } from "@/lib/map/search-constants";

interface FloatingPlaceSearchProps {
  mapInstance?: google.maps.Map | null;
}

/**
 * Floating search bar that sits on top of the map (similar to Google Maps)
 */
export function FloatingPlaceSearch({ mapInstance }: FloatingPlaceSearchProps) {
  // Actions
  const addPlace = useMapStore((state) => state.addPlace);
  const setActiveMode = useMapStore((state) => state.setActiveMode);
  const { fetchNearbyPlaces } = useNearbyPlaces();

  const handlePlaceSelect = useCallback(
    async (placeDetails: {
      placeId: string;
      name: string;
      formattedAddress: string;
      location: { lat: number | (() => number); lng: number | (() => number) };
    }) => {
      const latRaw = placeDetails.location.lat;
      const lngRaw = placeDetails.location.lng;

      const lat = typeof latRaw === "function" ? latRaw() : Number(latRaw);
      const lng = typeof lngRaw === "function" ? lngRaw() : Number(lngRaw);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        console.error("Invalid coordinates:", placeDetails.location);
        return;
      }

      const newPlace = {
        id: placeDetails.placeId,
        name: placeDetails.name,
        latitude: lat,
        longitude: lng,
        plannedAttractions: [],
        plannedRestaurants: [],
      };

      addPlace(newPlace);
      setActiveMode("discover");

      // Center map and zoom in
      if (mapInstance) {
        mapInstance.setCenter({ lat, lng });
        const currentZoom = mapInstance.getZoom() || 0;
        if (currentZoom < 13) {
          mapInstance.setZoom(13);
        }
      }

      // Trigger search for nearby attractions
      try {
        await fetchNearbyPlaces({
          lat,
          lng,
          radius: NEARBY_SEARCH_RADIUS_METERS,
          append: false, // Replace existing results for a new place search
        });
      } catch (error) {
        console.error("Failed to fetch nearby places:", error);
      }
    },
    [addPlace, setActiveMode, mapInstance, fetchNearbyPlaces]
  );

  return (
    <div
      className="pointer-events-none absolute z-[120]"
      style={{ top: "0.5rem", left: "12rem", width: "min(23rem, calc(100% - 13rem))" }}
    >
      <div className="pointer-events-auto drop-shadow-lg">
        <PlaceSearchBar onPlaceSelect={handlePlaceSelect} placeholder="Search for a place..." size="md" />
      </div>
    </div>
  );
}
