import React from "react";
import { MapPinned } from "lucide-react";

/**
 * ItineraryEmptyState - Empty state when no places added
 *
 * Features:
 * - Helpful guidance message
 * - Visual icon
 * - Encourages user action
 */
export function ItineraryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <MapPinned className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 font-semibold">No places yet</h3>
      <p className="text-sm text-muted-foreground">
        Add places from chat suggestions to build your itinerary
      </p>
    </div>
  );
}
