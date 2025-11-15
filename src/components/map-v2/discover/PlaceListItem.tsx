/**
 * Place list item - compact view with thumbnail
 */

import React from 'react';
import type { Attraction } from '@/domain/map/models';
import { MapPin, Star, Plus } from 'lucide-react';

interface PlaceListItemProps {
  place: Attraction;
  score: number;
}

export function PlaceListItem({ place, score }: PlaceListItemProps) {
  const photoUrl = place.photos?.[0]?.photoReference
    ? `/api/photos/proxy?reference=${place.photos[0].photoReference}&maxwidth=200`
    : undefined;

  const rating = place.rating || 0;
  const totalRatings = place.userRatingsTotal || 0;
  const category = place.types?.[0]?.replace(/_/g, ' ') || 'Place';
  const priceLevel = place.priceLevel ? '💰'.repeat(place.priceLevel) : '';

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    return 'text-gray-600';
  };

  const handleClick = () => {
    // Select place on map and open details
    console.log('Open place:', place.id);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Add to plan:', place.id);
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      {/* Thumbnail Photo */}
      <div className="flex-shrink-0 w-[60px] h-[60px] rounded-lg overflow-hidden bg-gray-100">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={place.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <MapPin className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        {/* Place name */}
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">
          {place.name}
        </h3>

        {/* Meta info */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
          <span className="capitalize">{category}</span>
          {priceLevel && (
            <>
              <span>•</span>
              <span>{priceLevel}</span>
            </>
          )}
        </div>

        {/* Rating and score */}
        <div className="flex items-center gap-2 mt-1">
          {rating > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span className="text-gray-700">{rating.toFixed(1)}</span>
              <span className="text-gray-500">({totalRatings})</span>
            </div>
          )}
          {score > 0 && (
            <span className={`text-xs font-semibold ${getScoreBadgeColor(score)}`}>
              Score: {(score / 10).toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Add button */}
      <button
        onClick={handleAddClick}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
        aria-label={`Add ${place.name} to plan`}
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}

