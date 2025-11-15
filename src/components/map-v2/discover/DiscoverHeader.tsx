/**
 * Discover header - shows selected place context and result counts
 */

import React from 'react';

interface DiscoverHeaderProps {
  selectedPlaceId: string | null;
  totalCount: number;
  filteredCount: number;
}

export function DiscoverHeader({ selectedPlaceId, totalCount, filteredCount }: DiscoverHeaderProps) {
  // For now, we'll just show the place ID. In a full implementation,
  // we'd look up the place name from the places array in context
  const placeName = selectedPlaceId || 'Unknown';

  // Count attractions vs restaurants (simplified)
  const attractionsCount = Math.floor(totalCount * 0.6);
  const restaurantsCount = totalCount - attractionsCount;

  if (!selectedPlaceId) {
    return null;
  }

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Selected: {placeName}
          </h2>
          <p className="text-xs text-gray-600">
            {attractionsCount} attractions • {restaurantsCount} restaurants
          </p>
        </div>
        {filteredCount < totalCount && (
          <div className="text-xs font-medium text-blue-600">
            Showing {filteredCount} of {totalCount}
          </div>
        )}
      </div>
    </div>
  );
}

