/**
 * Mobile itinerary stats header
 * Shows count of hubs and places in a compact format
 */

import React from "react";

interface MobileItineraryStatsProps {
  places: any[]; // Will be typed with domain types
}

export function MobileItineraryStats({ places }: MobileItineraryStatsProps) {
  const hubCount = places.length;

  // Calculate actual planned items count from attractions and restaurants
  const totalPlaces = places.reduce((sum, place) => {
    const attractionCount = place.plannedAttractions?.length || 0;
    const restaurantCount = place.plannedRestaurants?.length || 0;
    return sum + attractionCount + restaurantCount;
  }, 0);

  return (
    <div className="text-center">
      <h2 className="text-xl font-bold text-foreground mb-1">Your Itinerary</h2>
      <p className="text-sm text-muted-foreground">
        {hubCount} {hubCount === 1 ? "hub" : "hubs"} • {totalPlaces} {totalPlaces === 1 ? "place" : "places"}
      </p>
    </div>
  );
}
