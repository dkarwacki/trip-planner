/**
 * Photo grid item - individual photo with overlay information
 */

import React, { useState } from 'react';
import type { Attraction } from '@/domain/map/models';
import { Plus } from 'lucide-react';

interface PhotoGridItemProps {
  place: Attraction;
  score: number;
}

export function PhotoGridItem({ place, score }: PhotoGridItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const photoUrl = place.photos?.[0]?.photoReference
    ? `/api/photos/proxy?reference=${place.photos[0].photoReference}&maxwidth=600`
    : undefined;

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-600/90';
    if (score >= 80) return 'bg-blue-600/90';
    return 'bg-gray-600/90';
  };

  const handleClick = () => {
    // Open lightbox or place details
    console.log('Open photo lightbox for:', place.id);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Add to plan:', place.id);
  };

  if (!photoUrl) {
    return null;
  }

  return (
    <div
      className="relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Photo */}
      <img
        src={photoUrl}
        alt={place.name}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Score badge */}
      {score > 0 && (
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white ${getScoreBadgeColor(score)}`}>
          {(score / 10).toFixed(1)}
        </div>
      )}

      {/* Place name overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white font-semibold text-sm line-clamp-2">
          {place.name}
        </h3>
      </div>

      {/* Quick add button (visible on hover) */}
      {isHovered && (
        <button
          onClick={handleAddClick}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all animate-in fade-in zoom-in duration-200"
          aria-label={`Add ${place.name} to plan`}
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

