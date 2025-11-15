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
import { useMapState } from "../context";

interface MapViewProps {
  mapId?: string;
}

/**
 * Layer component for discovery markers
 * Gets data from context
 */
function DiscoveryMarkersLayer() {
  const { discoveryResults, filters, hoveredMarkerId, setHoveredMarker, setExpandedCard } = useMapState();

  // Filter discovery results by category
  const filteredResults = discoveryResults.filter((result: any) => {
    if (filters.category === "attractions") {
      return result.attraction?.type === "attraction";
    }
    if (filters.category === "restaurants") {
      return result.attraction?.type === "restaurant";
    }
    return true;
  });

  const handleMarkerClick = (attractionId: string) => {
    setExpandedCard(attractionId);
  };

  // Split into attractions and restaurants
  const attractions = filteredResults.filter((r: any) => r.attraction?.type === "attraction");
  const restaurants = filteredResults.filter((r: any) => r.attraction?.type === "restaurant");

  return (
    <>
      {attractions.length > 0 && (
        <DiscoveryMarkers
          attractions={attractions}
          category="attractions"
          onMarkerClick={handleMarkerClick}
          hoveredId={hoveredMarkerId}
        />
      )}
      {restaurants.length > 0 && (
        <DiscoveryMarkers
          attractions={restaurants}
          category="restaurants"
          onMarkerClick={handleMarkerClick}
          hoveredId={hoveredMarkerId}
        />
      )}
    </>
  );
}

/**
 * Layer component for place markers
 * Gets data from context
 */
function PlaceMarkersLayer() {
  const { places, selectedPlaceId, setSelectedPlace } = useMapState();

  const handlePlaceClick = (place: any) => {
    setSelectedPlace(place.id);
  };

  return <PlaceMarkers places={places} selectedPlaceId={selectedPlaceId} onPlaceClick={handlePlaceClick} />;
}

/**
 * Layer component for map backdrop
 * Gets state from context
 */
function MapBackdropLayer() {
  const { expandedCardPlaceId, closeCard } = useMapState();

  return <MapBackdrop isVisible={!!expandedCardPlaceId} onClick={closeCard} />;
}

export function MapView({ mapId }: MapViewProps) {
  return (
    <div className="relative h-full w-full">
      {/* Map Canvas */}
      <MapCanvas mapId={mapId} />

      {/* Map Markers */}
      <DiscoveryMarkersLayer />
      <PlaceMarkersLayer />

      {/* Map Backdrop (when bottom sheet is open) */}
      <MapBackdropLayer />

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
