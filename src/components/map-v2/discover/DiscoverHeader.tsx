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

export const DiscoverHeader = React.memo(function DiscoverHeader({
  selectedPlaceId,
  totalCount,
  filteredCount,
}: DiscoverHeaderProps) {
  // Optimized: Only subscribe to the selected place name, not entire places array
  const placeName = useMapStore((state) => {
    if (!selectedPlaceId) return null;
    const place = state.places.find((p) => p.id === selectedPlaceId);
    return place?.name || selectedPlaceId || "Unknown";
  });

  const discoveryResults = useMapStore((state) => state.discoveryResults);

  // Count actual attractions vs restaurants from results - memoized to prevent infinite loops
  const { attractionsCount, restaurantsCount } = React.useMemo(() => {
    const restaurantTypes = ["restaurant", "food", "cafe", "bar", "bakery"];

    let attractions = 0;
    let restaurants = 0;

    for (const item of discoveryResults) {
      const isRestaurant = item.attraction?.types?.some(restaurantTypes.includes);
      if (isRestaurant) {
        restaurants++;
      } else {
        attractions++;
      }
    }

    return { attractionsCount: attractions, restaurantsCount: restaurants };
  }, [discoveryResults]);

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
});
