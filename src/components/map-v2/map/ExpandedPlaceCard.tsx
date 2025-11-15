/**
 * Expanded place card component
 * Shows on marker click with action buttons
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2, Check } from 'lucide-react';
import type { Attraction } from '@/domain/map/models';
import { calculateCardPosition } from './CardPositioning';

interface ExpandedPlaceCardProps {
  attraction: Attraction;
  markerPosition: { x: number; y: number };
  viewportSize: { width: number; height: number };
  score?: number;
  isAddedToPlan: boolean;
  isAddingToPlan?: boolean;
  onClose: () => void;
  onAddToPlan: (attractionId: string) => void;
  onViewDetails: (attractionId: string) => void;
}

const CARD_WIDTH = 280;
const CARD_HEIGHT = 380;

export function ExpandedPlaceCard({
  attraction,
  markerPosition,
  viewportSize,
  score,
  isAddedToPlan,
  isAddingToPlan,
  onClose,
  onAddToPlan,
  onViewDetails,
}: ExpandedPlaceCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Fade-in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Calculate position
  const position = calculateCardPosition({
    markerPosition,
    cardSize: { width: CARD_WIDTH, height: CARD_HEIGHT },
    viewportSize,
    offset: 20,
    preferredSide: 'right',
  });

  // Get hero photo
  const photoUrl = attraction.photos?.[0]?.url;

  // Format rating
  const rating = attraction.rating || 0;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const reviewCount = attraction.userRatingsTotal || 0;

  // Score badge color
  const scoreColor = score
    ? score >= 9.0
      ? 'bg-green-500'
      : score >= 8.0
      ? 'bg-blue-500'
      : 'bg-gray-500'
    : 'bg-gray-500';

  return (
    <div
      className={`fixed bg-white rounded-xl shadow-2xl overflow-hidden transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${CARD_WIDTH}px`,
        zIndex: 60,
      }}
    >
      {/* Hero Photo with Score Badge */}
      <div className="relative w-full h-44 bg-gray-200">
        {photoUrl ? (
          <img src={photoUrl} alt={attraction.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400">No photo</span>
          </div>
        )}

        {/* Score Badge */}
        {score && (
          <div className={`absolute top-2 right-2 ${scoreColor} text-white px-3 py-1 rounded-md font-bold text-sm`}>
            {score.toFixed(1)}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 left-2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-gray-700" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Place Name */}
        <h2 className="text-lg font-bold text-gray-900 leading-tight">{attraction.name}</h2>

        {/* Metadata */}
        <div className="text-sm text-gray-600">
          {attraction.types && attraction.types[0] && (
            <>
              <span className="capitalize">{attraction.types[0].replace(/_/g, ' ')}</span>
              {attraction.priceLevel && <span> • {'$'.repeat(attraction.priceLevel)}</span>}
            </>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 text-sm">
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
          <span className="text-gray-700 font-medium">{rating.toFixed(1)}</span>
          {reviewCount > 0 && <span className="text-gray-500">({reviewCount} reviews)</span>}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onAddToPlan(attraction.id)}
            disabled={isAddedToPlan || isAddingToPlan}
            className="flex-1 h-11"
          >
            {isAddingToPlan ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : isAddedToPlan ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                In Plan
              </>
            ) : (
              'Add to Plan'
            )}
          </Button>
          <Button onClick={() => onViewDetails(attraction.id)} variant="outline" className="flex-1 h-11">
            Details
          </Button>
        </div>
      </div>
    </div>
  );
}

