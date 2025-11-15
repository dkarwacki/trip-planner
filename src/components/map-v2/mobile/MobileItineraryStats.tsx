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
  const totalPlaces = places.length; // TODO: Calculate actual planned items count when data structure is ready

  return (
    <div className="text-center">
      <h2 className="text-xl font-bold text-foreground mb-1">Your Itinerary</h2>
      <p className="text-sm text-muted-foreground">
        {hubCount} {hubCount === 1 ? "hub" : "hubs"} • {totalPlaces} {totalPlaces === 1 ? "place" : "places"}
      </p>
    </div>
  );
}
