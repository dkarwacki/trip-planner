/**
 * Individual planned item marker component
 * Memoized to prevent re-renders when marker props haven't changed
 */

import React from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { PlannedPOIViewModel } from "@/lib/map/types";
import { Utensils, Landmark } from "lucide-react";

interface PlannedItemMarkerProps {
  poi: PlannedPOIViewModel;
  placeId: string;
  isRestaurant: boolean;
  isHovered: boolean;
  isExpanded: boolean;
  onMarkerClick: (poiId: string, placeId: string) => void;
  onMarkerHover?: (poiId: string | null) => void;
}

export const PlannedItemMarker = React.memo(
  function PlannedItemMarker({
    poi,
    placeId,
    isRestaurant,
    isHovered,
    isExpanded,
    onMarkerClick,
    onMarkerHover,
  }: PlannedItemMarkerProps) {
    return (
      <AdvancedMarker
        key={poi.id}
        position={{ lat: poi.latitude, lng: poi.longitude }}
        onClick={() => onMarkerClick(poi.id, placeId)}
        zIndex={isExpanded ? 200 : isHovered ? 150 : 140}
        className="custom-marker"
      >
        <div
          className={`
            relative transition-all duration-300 cursor-pointer group
            ${isExpanded ? "scale-125 z-50" : isHovered ? "scale-110 z-40" : "scale-100 z-30"}
          `}
          onMouseEnter={() => onMarkerHover?.(poi.id)}
          onMouseLeave={() => onMarkerHover?.(null)}
        >
          {/* Marker Pin */}
          <div
            className={`
              flex items-center justify-center w-7 h-7 rounded-full shadow-lg border-2 transition-colors
              ${
                isExpanded
                  ? "bg-green-600 border-white text-white"
                  : "bg-white border-green-500 text-green-600 hover:bg-green-50"
              }
            `}
          >
            {isRestaurant ? <Utensils className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
          </div>

          {/* Pulse effect for expanded marker */}
          {isExpanded && <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30 -z-10" />}
        </div>
      </AdvancedMarker>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.poi.id === nextProps.poi.id &&
      prevProps.isHovered === nextProps.isHovered &&
      prevProps.isExpanded === nextProps.isExpanded &&
      prevProps.isRestaurant === nextProps.isRestaurant
    );
  }
);
