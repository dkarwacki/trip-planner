/**
 * Individual discovery marker component
 * Memoized to prevent re-renders when marker props haven't changed
 */

import React from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { Attraction } from "@/domain/map/models";
import { Utensils, Landmark } from "lucide-react";

interface DiscoveryMarkerProps {
  place: Attraction;
  isHovered: boolean;
  isSelected: boolean;
  isRestaurant: boolean;
  onMarkerClick: (placeId: string) => void;
  onMarkerHover: (placeId: string | null) => void;
}

export const DiscoveryMarker = React.memo(
  function DiscoveryMarker({
    place,
    isHovered,
    isSelected,
    isRestaurant,
    onMarkerClick,
    onMarkerHover,
  }: DiscoveryMarkerProps) {
    return (
      <AdvancedMarker
        key={place.id}
        position={place.location}
        onClick={() => onMarkerClick(place.id)}
        zIndex={isSelected ? 200 : isHovered ? 150 : 100}
        className="custom-marker"
      >
        <div
          className={`
            relative transition-all duration-300 cursor-pointer group
            ${isSelected ? "scale-125 z-50" : isHovered ? "scale-110 z-40" : "scale-100 z-30"}
          `}
          onMouseEnter={() => onMarkerHover(place.id)}
          onMouseLeave={() => onMarkerHover(null)}
        >
          {/* Marker Pin */}
          <div
            className={`
              flex items-center justify-center w-7 h-7 rounded-full shadow-lg border-2 transition-colors
              ${
                isSelected
                  ? "bg-blue-600 border-white text-white"
                  : isRestaurant
                    ? "bg-white border-orange-500 text-orange-600 hover:bg-orange-50"
                    : "bg-white border-blue-600 text-blue-600 hover:bg-blue-50"
              }
            `}
          >
            {isRestaurant ? <Utensils className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
          </div>

          {/* Pulse effect for selected marker */}
          {isSelected && <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30 -z-10" />}
        </div>
      </AdvancedMarker>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.place.id === nextProps.place.id &&
      prevProps.isHovered === nextProps.isHovered &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isRestaurant === nextProps.isRestaurant
    );
  }
);
