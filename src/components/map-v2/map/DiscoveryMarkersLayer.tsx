import React from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { Attraction } from "@/domain/map/models";
import { getPlaceTypeCategory } from "@/lib/map-v2/placeTypeUtils";
import { Utensils, Landmark } from "lucide-react";

interface DiscoveryMarkersLayerProps {
  places: Attraction[];
  hoveredMarkerId: string | null;
  selectedPlaceId: string | null;
  onMarkerClick: (placeId: string) => void;
  onMarkerHover: (placeId: string | null) => void;
}

export const DiscoveryMarkersLayer = React.memo(function DiscoveryMarkersLayer({
  places,
  hoveredMarkerId,
  selectedPlaceId,
  onMarkerClick,
  onMarkerHover,
}: DiscoveryMarkersLayerProps) {
  return (
    <>
      {places.map((place) => {
        const isHovered = hoveredMarkerId === place.id;
        const isSelected = selectedPlaceId === place.id;
        const category = getPlaceTypeCategory(place.types);
        const isRestaurant = category === "restaurant";

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
                  flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 transition-colors
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
              {isSelected && (
                <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30 -z-10" />
              )}
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
});
