/**
 * Place list - compact list view for browsing many places
 * Implements Stage 3.4 of the UX implementation plan
 */

import React from 'react';
import { PlaceListItem } from './PlaceListItem';
import type { Attraction, AttractionScore } from '@/domain/map/models';

interface PlaceListProps {
  places: Array<Attraction | AttractionScore>;
}

export function PlaceList({ places }: PlaceListProps) {
  // Extract attraction from AttractionScore if needed
  const getAttraction = (place: Attraction | AttractionScore): Attraction => {
    if ('attraction' in place) {
      return place.attraction;
    }
    return place;
  };

  // Get score from AttractionScore or calculate basic score
  const getScore = (place: Attraction | AttractionScore): number => {
    if ('score' in place && typeof place.score === 'number') {
      return place.score;
    }
    const attraction = getAttraction(place);
    if (attraction.rating && attraction.userRatingsTotal) {
      return (attraction.rating / 5) * 10;
    }
    return 0;
  };

  return (
    <div className="divide-y divide-gray-200">
      {places.map((place) => {
        const attraction = getAttraction(place);
        const score = getScore(place);

        return (
          <PlaceListItem
            key={attraction.id}
            place={attraction}
            score={score}
          />
        );
      })}
    </div>
  );
}

