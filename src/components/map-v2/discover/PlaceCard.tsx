/**
 * Place card - large photo card with details
 * Stage 3.2: Large Photo Card View
 */

import React from 'react';
import type { Attraction } from '@/domain/map/models';
import { MapPin, Star } from 'lucide-react';

interface PlaceCardProps {
  place: Attraction;
  score: number;
  isAdded: boolean;
  onAddClick: (placeId: string) => void;
  onCardClick: (placeId: string) => void;
}

export function PlaceCard({ place, score, isAdded, onAddClick, onCardClick }: PlaceCardProps) {
  // Get photo URL from place photos
  const photoUrl = place.photos?.[0]?.photoReference
    ? `/api/photos/proxy?reference=${place.photos[0].photoReference}&maxwidth=800`
    : undefined;

  // Format rating
  const rating = place.rating || 0;
  const totalRatings = place.userRatingsTotal || 0;

  // Get category from types (simplified)
  const category = place.types?.[0]?.replace(/_/g, ' ') || 'Place';
  const priceLevel = place.priceLevel ? '💰'.repeat(place.priceLevel) : '';

  // Score badge color
  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-600 text-white';
    if (score >= 80) return 'bg-blue-600 text-white';
    return 'bg-gray-600 text-white';
  };

  const handleAddButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddClick(place.id);
  };

  return (
    <div
      onClick={() => onCardClick(place.id)}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all duration-200"
    >
      {/* Hero Photo */}
      <div className="relative aspect-video bg-gray-100">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={place.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <MapPin className="w-12 h-12" />
          </div>
        )}
        
        {/* Score Badge */}
        {score > 0 && (
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-sm font-bold shadow-lg ${getScoreBadgeColor(score)}`}>
            {(score / 10).toFixed(1)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Place Name */}
        <h3 className="font-semibold text-gray-900 text-base line-clamp-1">
          {place.name}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="capitalize">{category}</span>
          {priceLevel && (
            <>
              <span>•</span>
              <span>{priceLevel}</span>
            </>
          )}
          {place.vicinity && (
            <>
              <span>•</span>
              <span className="line-clamp-1">{place.vicinity}</span>
            </>
          )}
        </div>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-current' : ''}`}
                />
              ))}
            </div>
            <span className="text-gray-600">
              ({totalRatings.toLocaleString()} reviews)
            </span>
          </div>
        )}

        {/* Add to Plan Button */}
        <button
          onClick={handleAddButtonClick}
          disabled={isAdded}
          className={`
            w-full py-2.5 rounded-lg font-medium transition-colors
            ${
              isAdded
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            }
          `}
        >
          {isAdded ? '✓ Added' : '+ Add to Plan'}
        </button>
      </div>
    </div>
  );
}

