/**
 * Loading skeleton for PlaceCard
 * Shows while discovery results are loading
 */

import React from "react";

export function PlaceCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
      {/* Photo skeleton */}
      <div className="aspect-video bg-gray-200" />

      {/* Content skeleton */}
      <div className="p-4 space-y-2">
        {/* Name */}
        <div className="h-5 bg-gray-200 rounded w-3/4" />

        {/* Meta info */}
        <div className="h-4 bg-gray-200 rounded w-1/2" />

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>

        {/* Button */}
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    </div>
  );
}


