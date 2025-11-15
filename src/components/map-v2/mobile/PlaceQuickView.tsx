/**
 * Place Quick View
 * 30% height preview with hero photo and key info
 */

import React from 'react';
import { Plus, Info, ChevronDown } from 'lucide-react';
import PhotoImage from '@/components/common/PhotoImage';
import { cn } from '@/lib/common/utils';
import type { Place } from '@/domain/map/models/Place';
import { useMapState } from '../context';

interface PlaceQuickViewProps {
  place: Place;
  onExpandClick: () => void;
}

export function PlaceQuickView({ place, onExpandClick }: PlaceQuickViewProps) {
  const { addToPlanning } = useMapState();

  const handleAddToPlan = () => {
    addToPlanning(place);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Place Name */}
      <h2 className="text-xl font-bold text-gray-900">{place.name}</h2>

      {/* Hero Photo */}
      {place.photos.length > 0 && (
        <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
          <PhotoImage
            photoReference={place.photos[0].photoReference}
            alt={place.name}
            maxWidth={800}
            className="h-full w-full"
          />
        </div>
      )}

      {/* Key Info */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
        {place.rating && (
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            <span className="font-medium">{place.rating.toFixed(1)}</span>
            {place.userRatingsTotal && (
              <span className="text-gray-500">({place.userRatingsTotal})</span>
            )}
          </div>
        )}
        {place.priceLevel && (
          <>
            <span className="text-gray-400">•</span>
            <span>{getPriceLevelString(place.priceLevel)}</span>
          </>
        )}
        {place.distance && (
          <>
            <span className="text-gray-400">•</span>
            <span>{formatDistance(place.distance)}</span>
          </>
        )}
      </div>

      {/* Category/Type */}
      {place.category && (
        <p className="text-sm text-gray-600">{place.category}</p>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <ActionButton
          icon={<Plus className="h-4 w-4" />}
          label="Add"
          onClick={handleAddToPlan}
          variant="primary"
        />
        <ActionButton
          icon={<Info className="h-4 w-4" />}
          label="Details"
          onClick={onExpandClick}
          variant="secondary"
        />
        <ActionButton
          icon={<ChevronDown className="h-4 w-4" />}
          label="More"
          onClick={onExpandClick}
          variant="secondary"
        />
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary';
}

function ActionButton({ icon, label, onClick, variant }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-lg transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function getPriceLevelString(level: number): string {
  return '$'.repeat(Math.max(1, Math.min(4, level)));
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

