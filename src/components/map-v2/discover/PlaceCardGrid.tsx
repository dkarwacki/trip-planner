/**
 * Place card grid - displays places in large card view (default)
 * Implements Stage 3.2 of the UX implementation plan
 */

import React from 'react';
import { PlaceCard } from './PlaceCard';
import { useMapState } from '../context';
import type { Attraction, AttractionScore } from '@/domain/map/models';

interface PlaceCardGridProps {
  places: Array<Attraction | AttractionScore>;
}

export function PlaceCardGrid({ places }: PlaceCardGridProps) {
  const { state, dispatch } = useMapState();

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
    // Simple fallback score calculation
    if (attraction.rating && attraction.userRatingsTotal) {
      return (attraction.rating / 5) * 10;
    }
    return 0;
  };

  const handleAddClick = (placeId: string) => {
    // TODO: Implement add to plan logic
    console.log('Add place to plan:', placeId);
  };

  const handleCardClick = (placeId: string) => {
    // Open details dialog (to be implemented)
    console.log('Open place details:', placeId);
  };

  return (
    <div className="p-4 space-y-4">
      {places.map((place) => {
        const attraction = getAttraction(place);
        const score = getScore(place);
        const isAdded = false; // TODO: Check if place is in plan

        return (
          <PlaceCard
            key={attraction.id}
            place={attraction}
            score={score}
            isAdded={isAdded}
            onAddClick={handleAddClick}
            onCardClick={handleCardClick}
          />
        );
      })}
    </div>
  );
}

