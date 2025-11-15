/**
 * Place Full View
 * 85% height full details with photo carousel, complete info, nearby attractions
 */

import React, { useState } from 'react';
import { Plus, MapPin, Clock, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import PhotoImage from '@/components/common/PhotoImage';
import { cn } from '@/lib/common/utils';
import type { Place } from '@/domain/map/models/Place';
import { useMapState } from '../context';

interface PlaceFullViewProps {
  place: Place;
}

export function PlaceFullView({ place }: PlaceFullViewProps) {
  const { addToPlanning } = useMapState();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handleAddToPlan = () => {
    addToPlanning(place);
  };

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev > 0 ? prev - 1 : place.photos.length - 1
    );
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev < place.photos.length - 1 ? prev + 1 : 0
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Photo Carousel */}
      {place.photos.length > 0 && (
        <div className="relative">
          <div className="aspect-[16/10] overflow-hidden bg-gray-100">
            <PhotoImage
              photoReference={place.photos[currentPhotoIndex].photoReference}
              alt={place.name}
              maxWidth={800}
              className="h-full w-full"
            />
          </div>

          {/* Carousel Controls */}
          {place.photos.length > 1 && (
            <>
              <button
                onClick={handlePrevPhoto}
                className={cn(
                  'absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-colors',
                  'hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
                )}
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5 text-gray-900" />
              </button>
              <button
                onClick={handleNextPhoto}
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg transition-colors',
                  'hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
                )}
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5 text-gray-900" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
                {currentPhotoIndex + 1} of {place.photos.length}
              </div>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-4 px-4">
        {/* Place Name & Category */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{place.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            {place.category && <span>{place.category}</span>}
            {place.rating && (
              <>
                {place.category && <span className="text-gray-400">•</span>}
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span className="font-medium">{place.rating.toFixed(1)}</span>
                  {place.userRatingsTotal && (
                    <span className="text-gray-500">({place.userRatingsTotal})</span>
                  )}
                </div>
              </>
            )}
            {place.priceLevel && (
              <>
                <span className="text-gray-400">•</span>
                <span>{getPriceLevelString(place.priceLevel)}</span>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {place.description && (
          <p className="text-sm leading-relaxed text-gray-700">
            {place.description}
          </p>
        )}

        {/* Details */}
        <div className="flex flex-col gap-3">
          {place.distance && (
            <DetailItem
              icon={<MapPin className="h-4 w-4" />}
              label="Distance"
              value={formatDistance(place.distance)}
            />
          )}
          {place.openingHours && (
            <DetailItem
              icon={<Clock className="h-4 w-4" />}
              label="Hours"
              value={place.openingHours}
            />
          )}
          {place.phone && (
            <DetailItem
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={place.phone}
            />
          )}
        </div>

        {/* Address */}
        {place.address && (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm text-gray-700">{place.address}</p>
          </div>
        )}

        {/* Nearby Attractions Preview */}
        {/* This would be implemented when we have nearby places data */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900">Nearby Attractions</h3>
          <p className="mt-2 text-sm text-gray-500">Coming soon...</p>
        </div>
      </div>

      {/* Sticky Add Button */}
      <div 
        className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={handleAddToPlan}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-white transition-colors',
            'hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
          )}
        >
          <Plus className="h-5 w-5" />
          <span className="font-semibold">Add to Plan</span>
        </button>
      </div>
    </div>
  );
}

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function DetailItem({ icon, label, value }: DetailItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gray-500">{icon}</div>
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function getPriceLevelString(level: number): string {
  return '$'.repeat(Math.max(1, Math.min(4, level)));
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m away`;
  }
  return `${(meters / 1000).toFixed(1)}km away`;
}

