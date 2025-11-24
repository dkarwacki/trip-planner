/**
 * Mobile Map View
 * Fullscreen map with floating buttons (Filter + AI)
 */

import React, { useEffect } from "react";
import { MapCanvas } from "../map/MapCanvas";
import { DiscoveryMarkersLayer } from "../map/DiscoveryMarkersLayer";
import { PlaceMarkers } from "../map/PlaceMarkers";
import { MapBackdrop } from "../map/MapBackdrop";
import { FilterButton } from "./FilterButton";
import { FilterBottomSheet } from "../filters/FilterBottomSheet";
import { useMapStore } from "../stores/mapStore";
import { getPersistedFilters, persistFilters } from "@/lib/map-v2/filterPersistence";

interface MapViewProps {
  mapId?: string;
  onMapLoad?: (map: google.maps.Map) => void;
}

/**
 * Layer component for discovery markers
 * Gets data from context
 */
function MobileDiscoveryMarkersLayer() {
  const discoveryResults = useMapStore((state) => state.discoveryResults);
  const filters = useMapStore((state) => state.filters);
  const selectedPlaceId = useMapStore((state) => state.selectedPlaceId);
  const setExpandedCard = useMapStore((state) => state.setExpandedCard);
  const setHoveredMarker = useMapStore((state) => state.setHoveredMarker);

  const handleMarkerClick = (attractionId: string) => {
    setExpandedCard(attractionId);
  };

  const handleMarkerHover = (attractionId: string | null) => {
    setHoveredMarker(attractionId);
  };

  // Helper to check if item is a restaurant
  const isRestaurant = (item: { types?: string[] }) => {
    return item.types?.some((t: string) => ["restaurant", "food", "cafe", "bar", "bakery"].includes(t));
  };

  // Apply quality filter first
  let results = discoveryResults;
  if (filters.showHighQualityOnly) {
    results = results.filter((item) => {
      const score = item.score || 0;
      return score >= filters.minScore * 10; // Convert 7/8/9 to 70/80/90
    });
  }

  // Apply category filter
  if (filters.category === "attractions") {
    results = results.filter((r) => !isRestaurant(r));
  } else if (filters.category === "restaurants") {
    results = results.filter((r) => isRestaurant(r));
  }

  return (
    <DiscoveryMarkersLayer
      places={results}
      hoveredMarkerId={null}
      selectedPlaceId={selectedPlaceId}
      onMarkerClick={handleMarkerClick}
      onMarkerHover={handleMarkerHover}
    />
  );
}

/**
 * Layer component for place markers
 * Gets data from context
 */
function PlaceMarkersLayer() {
  const places = useMapStore((state) => state.places);
  const selectedPlaceId = useMapStore((state) => state.selectedPlaceId);
  const setSelectedPlace = useMapStore((state) => state.setSelectedPlace);

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
  const expandedCardPlaceId = useMapStore((state) => state.expandedCardPlaceId);
  const closeCard = useMapStore((state) => state.closeCard);

  return <MapBackdrop isVisible={!!expandedCardPlaceId} onClick={closeCard} />;
}

export function MapView({ mapId, onMapLoad }: MapViewProps) {
  const filters = useMapStore((state) => state.filters);
  const filterSheetOpen = useMapStore((state) => state.filterSheetOpen);
  const setFilterSheetOpen = useMapStore((state) => state.setFilterSheetOpen);
  const selectedPlaceId = useMapStore((state) => state.selectedPlaceId);
  const updateFilters = useMapStore((state) => state.updateFilters);
  const clearFilters = useMapStore((state) => state.clearFilters);

  // Load persisted filters when place is selected
  useEffect(() => {
    if (selectedPlaceId) {
      const persistedFilters = getPersistedFilters(selectedPlaceId);
      if (persistedFilters) {
        updateFilters(persistedFilters);
      } else {
        // Reset to defaults for new place
        clearFilters();
      }
    }
  }, [selectedPlaceId, updateFilters, clearFilters]);

  // Save filters when they change
  useEffect(() => {
    if (selectedPlaceId) {
      persistFilters(selectedPlaceId, filters);
    }
  }, [filters, selectedPlaceId]);

  const handleApplyFilters = (newFilters: typeof filters) => {
    updateFilters(newFilters);
  };

  return (
    <div className="relative h-full w-full">
      {/* Map Canvas */}
      <MapCanvas mapId={mapId} onMapLoad={onMapLoad} />

      {/* Map Markers */}
      <MobileDiscoveryMarkersLayer />
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
