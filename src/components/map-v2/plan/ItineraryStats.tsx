/**
 * Header showing itinerary statistics
 * Displays hub count, attraction count, restaurant count
 */

import React from 'react';

interface ItineraryStatsProps {
  places: any[]; // Will be typed with domain types
}

export default function ItineraryStats({ places }: ItineraryStatsProps) {
  // Count hubs (unique places)
  const hubCount = places.length;

  // TODO: Count attractions and restaurants when we have the proper data structure
  // For now, we'll use placeholder counts
  const attractionCount = 0;
  const restaurantCount = 0;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">
        Your Itinerary
      </h2>
      <p className="text-sm text-muted-foreground">
        {hubCount} {hubCount === 1 ? 'hub' : 'hubs'}
        {attractionCount > 0 && (
          <span> • {attractionCount} {attractionCount === 1 ? 'attraction' : 'attractions'}</span>
        )}
        {restaurantCount > 0 && (
          <span> • {restaurantCount} {restaurantCount === 1 ? 'restaurant' : 'restaurants'}</span>
        )}
      </p>
    </div>
  );
}

