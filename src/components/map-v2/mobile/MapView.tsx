/**
 * Mobile Map View
 * Fullscreen map with floating buttons (Filter + AI)
 */

import React, { useEffect } from "react";
import { MapCanvas } from "../map/MapCanvas";
import { DiscoveryMarkers } from "../map/DiscoveryMarkers";
import { PlaceMarkers } from "../map/PlaceMarkers";
import { MapBackdrop } from "../map/MapBackdrop";
import { FilterButton } from "./FilterButton";
import { FilterBottomSheet } from "../filters/FilterBottomSheet";
import { useMapState } from "../context";
import { getPersistedFilters, persistFilters } from "@/lib/map-v2/filterPersistence";

interface MapViewProps {
  mapId?: string;
  onMapLoad?: (map: google.maps.Map) => void;
}

/**
 * Layer component for discovery markers
 * Gets data from context
 */
function DiscoveryMarkersLayer() {
  const { discoveryResults, filters, setExpandedCard } = useMapState();

  const handleMarkerClick = (attractionId: string) => {
    setExpandedCard(attractionId);
  };

  // Helper to check if attraction is a restaurant
  const isRestaurant = (item: { attraction?: { types?: string[] } }) => {
    return item.attraction?.types?.some((t: string) => ["restaurant", "food", "cafe", "bar", "bakery"].includes(t));
  };

  // Apply quality filter first
  let results = discoveryResults;
  if (filters.showHighQualityOnly) {
    results = results.filter((item: any) => {
      const score = item.score || 0;
      return score >= filters.minScore * 10; // Convert 7/8/9 to 70/80/90
    });
  }

  // Split into attractions and restaurants based on types
  const attractions = results.filter((r: { attraction?: { types?: string[] } }) => !isRestaurant(r));
  const restaurants = results.filter((r: { attraction?: { types?: string[] } }) => isRestaurant(r));

  // Apply category filter
  let filteredAttractions = attractions;
  let filteredRestaurants = restaurants;

  if (filters.category === "attractions") {
    filteredRestaurants = [];
  } else if (filters.category === "restaurants") {
    filteredAttractions = [];
  }

  return (
    <>
      {filteredAttractions.length > 0 && (
        <DiscoveryMarkers
          attractions={filteredAttractions}
          category="attractions"
          onMarkerClick={handleMarkerClick}
          hoveredId={null}
        />
      )}
      {filteredRestaurants.length > 0 && (
        <DiscoveryMarkers
          attractions={filteredRestaurants}
          category="restaurants"
          onMarkerClick={handleMarkerClick}
          hoveredId={null}
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

  const handlePlaceClick = (place: { id: string }) => {
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

export function MapView({ mapId, onMapLoad }: MapViewProps) {
  const { filters, filterSheetOpen, setFilterSheetOpen, selectedPlaceId, dispatch } = useMapState();

  // Load persisted filters when place is selected
  useEffect(() => {
    if (selectedPlaceId) {
      const persistedFilters = getPersistedFilters(selectedPlaceId);
      if (persistedFilters) {
        dispatch({ type: "UPDATE_FILTERS", payload: persistedFilters });
      } else {
        // Reset to defaults for new place
        dispatch({ type: "CLEAR_FILTERS" });
      }
    }
  }, [selectedPlaceId, dispatch]);

  // Save filters when they change
  useEffect(() => {
    if (selectedPlaceId) {
      persistFilters(selectedPlaceId, filters);
    }
  }, [filters, selectedPlaceId]);

  const handleApplyFilters = (newFilters: typeof filters) => {
    dispatch({ type: "UPDATE_FILTERS", payload: newFilters });
  };

  return (
    <div className="relative h-full w-full">
      {/* Map Canvas */}
      <MapCanvas mapId={mapId} onMapLoad={onMapLoad} />

      {/* Map Markers */}
      <DiscoveryMarkersLayer />
      <PlaceMarkersLayer />

      {/* Map Backdrop (when bottom sheet is open) */}
      <MapBackdropLayer />

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />

      {/* Floating Filter Button */}
      <div className="pointer-events-none fixed inset-0 z-30">
        {/* Filter Button - Bottom Left */}
        <div className="pointer-events-auto absolute bottom-[92px] left-4">
          <FilterButton />
        </div>
      </div>
    </div>
  );
}
