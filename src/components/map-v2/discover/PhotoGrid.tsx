/**
 * Photo grid - masonry-style grid view emphasizing photos
 * Implements Stage 3.3 of the UX implementation plan
 */

import React from 'react';
import { PhotoGridItem } from './PhotoGridItem';
import type { Attraction, AttractionScore } from '@/domain/map/models';

interface PhotoGridProps {
  places: Array<Attraction | AttractionScore>;
}

export function PhotoGrid({ places }: PhotoGridProps) {
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

  // Filter places that have photos
  const placesWithPhotos = places.filter((place) => {
    const attraction = getAttraction(place);
    return attraction.photos && attraction.photos.length > 0;
  });

  if (placesWithPhotos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-center p-8">
        <div>
          <div className="text-4xl mb-2">📷</div>
          <p className="text-sm text-gray-600">No photos available for these places</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Simple 2-column grid (masonry would require a library like react-masonry-css) */}
      <div className="grid grid-cols-2 gap-3">
        {placesWithPhotos.map((place) => {
          const attraction = getAttraction(place);
          const score = getScore(place);

          return (
            <PhotoGridItem
              key={attraction.id}
              place={attraction}
              score={score}
            />
          );
        })}
      </div>
    </div>
  );
}

