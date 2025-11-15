/**
 * Mobile Map View
 * Fullscreen map with floating buttons (Filter + AI)
 */

import React from "react";
import { MapCanvas } from "../map/MapCanvas";
import { DiscoveryMarkers } from "../map/DiscoveryMarkers";
import { PlaceMarkers } from "../map/PlaceMarkers";
import { MapBackdrop } from "../map/MapBackdrop";
import { FloatingAIButton } from "./FloatingAIButton";
import { FilterButton } from "./FilterButton";
import { PlaceBottomSheet } from "./PlaceBottomSheet";

interface MapViewProps {
  mapId?: string;
}

export function MapView({ mapId }: MapViewProps) {
  return (
    <div className="relative h-full w-full">
      {/* Map Canvas */}
      <MapCanvas mapId={mapId} />

      {/* Map Markers */}
      <DiscoveryMarkers />
      <PlaceMarkers />

      {/* Map Backdrop (when bottom sheet is open) */}
      <MapBackdrop />

      {/* Place Bottom Sheet (replaces ExpandedPlaceCard on mobile) */}
      <PlaceBottomSheet />

      {/* Floating Buttons */}
      <div className="pointer-events-none fixed inset-0 z-30">
        {/* Filter Button - Bottom Left */}
        <div className="pointer-events-auto absolute bottom-[92px] left-4">
          <FilterButton />
        </div>

        {/* AI Button - Bottom Right */}
        <div className="pointer-events-auto absolute bottom-[92px] right-4">
          <FloatingAIButton />
        </div>
      </div>
    </div>
  );
}
