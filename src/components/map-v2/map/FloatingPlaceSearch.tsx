import React, { useCallback } from "react";
import { PlaceSearchBar } from "../search/PlaceSearchBar";
import { useMapState } from "../context";

interface FloatingPlaceSearchProps {
  mapInstance?: google.maps.Map | null;
}

/**
 * Floating search bar that sits on top of the map (similar to Google Maps)
 */
export function FloatingPlaceSearch({ mapInstance }: FloatingPlaceSearchProps) {
  const { dispatch } = useMapState();

  const handlePlaceSelect = useCallback(
    (placeDetails: {
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
        address: placeDetails.formattedAddress,
        lat,
        lng,
        plannedAttractions: [],
        plannedRestaurants: [],
      };

      dispatch({ type: "ADD_PLACE", payload: newPlace });
      dispatch({ type: "SET_ACTIVE_MODE", payload: "discover" });

      // Zoom in if needed
      if (mapInstance) {
        const currentZoom = mapInstance.getZoom() || 0;
        if (currentZoom < 13) {
          mapInstance.setZoom(13);
        }
      }
    },
    [dispatch, mapInstance]
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


