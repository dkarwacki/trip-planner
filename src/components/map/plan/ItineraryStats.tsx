/**
 * Header showing itinerary statistics
 * Displays hub count, attraction count, restaurant count
 */

import React from "react";
import type { PlannedPlaceViewModel } from "@/lib/map/types";

interface ItineraryStatsProps {
  places: PlannedPlaceViewModel[];
}

export default function ItineraryStats({ places }: ItineraryStatsProps) {
  // Count hubs (unique places)
  const hubCount = places.length;

  // Count attractions and restaurants from the data structure
  const attractionCount = places.reduce((sum, place) => {
    return sum + (place.plannedAttractions?.length || 0);
  }, 0);

  const restaurantCount = places.reduce((sum, place) => {
    return sum + (place.plannedRestaurants?.length || 0);
  }, 0);

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Your Itinerary</h2>
      <p className="text-sm text-muted-foreground">
        {hubCount} {hubCount === 1 ? "place" : "places"}
        {attractionCount > 0 && (
          <span>
            {" "}
            • {attractionCount} {attractionCount === 1 ? "attraction" : "attractions"}
          </span>
        )}
        {restaurantCount > 0 && (
          <span>
            {" "}
            • {restaurantCount} {restaurantCount === 1 ? "restaurant" : "restaurants"}
          </span>
        )}
      </p>
    </div>
  );
}
