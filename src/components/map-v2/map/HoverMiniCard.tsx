/**
 * Hover mini card component
 * Shows on marker hover after 300ms delay (desktop only)
 */

import React, { useEffect, useState } from 'react';
import type { Attraction } from '@/domain/map/models';
import { calculateCardPosition } from './CardPositioning';

interface HoverMiniCardProps {
  attraction: Attraction;
  markerPosition: { x: number; y: number };
  viewportSize: { width: number; height: number };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

const CARD_WIDTH = 200;
const CARD_HEIGHT = 120;

export function HoverMiniCard({
  attraction,
  markerPosition,
  viewportSize,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: HoverMiniCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Fade-in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Calculate position
  const position = calculateCardPosition({
    markerPosition,
    cardSize: { width: CARD_WIDTH, height: CARD_HEIGHT },
    viewportSize,
    offset: 12,
    preferredSide: 'right',
  });

  // Get first photo (if available)
  const photoUrl = attraction.photos?.[0]?.url;

  // Format rating
  const rating = attraction.rating || 0;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div
      className={`fixed bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden cursor-pointer transition-opacity duration-150 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${CARD_WIDTH}px`,
        zIndex: 50,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {/* Photo Thumbnail */}
      {photoUrl ? (
        <div className="w-full h-20 bg-gray-200 overflow-hidden">
          <img src={photoUrl} alt={attraction.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-20 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-xs">No photo</span>
        </div>
      )}

      {/* Content */}
      <div className="p-2">
        <h3 className="font-bold text-sm text-gray-900 truncate mb-1">{attraction.name}</h3>
        <div className="flex items-center gap-1 text-xs">
          {/* Rating Stars */}
          <div className="flex items-center text-yellow-500">
            {Array.from({ length: 5 }).map((_, i) => {
              if (i < fullStars) {
                return <span key={i}>★</span>;
              }
              if (i === fullStars && hasHalfStar) {
                return <span key={i}>⯪</span>;
              }
              return <span key={i} className="text-gray-300">★</span>;
            })}
          </div>
          <span className="text-gray-600 font-medium">{rating.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

