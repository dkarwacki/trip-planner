/**
 * Discover header - shows selected place context and result counts
 */

import React from "react";
import { useMapStore } from "../stores/mapStore";

interface DiscoverHeaderProps {
  selectedPlaceId: string | null;
  totalCount: number;
  filteredCount: number;
}

export function DiscoverHeader({ selectedPlaceId, totalCount, filteredCount }: DiscoverHeaderProps) {
  const places = useMapStore((state) => state.places);
  const discoveryResults = useMapStore((state) => state.discoveryResults);

  // Look up the place name from the places array
  const selectedPlace = selectedPlaceId ? places.find((p) => p.id === selectedPlaceId) : null;
  const placeName = selectedPlace?.name || selectedPlaceId || "Unknown";

  // Count actual attractions vs restaurants from results
  const attractionsCount = discoveryResults.filter((item) => {
    const isRestaurant = item.attraction?.types?.some((t: string) =>
      ["restaurant", "food", "cafe", "bar", "bakery"].includes(t)
    );
    return !isRestaurant;
  }).length;
  const restaurantsCount = discoveryResults.filter((item) => {
    const isRestaurant = item.attraction?.types?.some((t: string) =>
      ["restaurant", "food", "cafe", "bar", "bakery"].includes(t)
    );
    return isRestaurant;
  }).length;

  if (!selectedPlaceId) {
    return null;
  }

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Selected: {placeName}</h2>
          <p className="text-xs text-gray-600">
            {attractionsCount} attractions • {restaurantsCount} restaurants
          </p>
        </div>
        {filteredCount < totalCount && (
          <div className="text-xs font-medium text-blue-600">
            Showing {filteredCount} of {totalCount}
          </div>
        )}
      </div>
    </div>
  );
}
