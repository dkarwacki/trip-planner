/**
 * Mobile Map View
 * Fullscreen map with floating buttons (Filter + AI)
 */

import React, { useEffect } from "react";
import { MapCanvas } from "../map/MapCanvas";
import { FilterButton } from "./FilterButton";
import { FilterBottomSheet } from "../filters/FilterBottomSheet";
import { FloatingAIButton } from "./FloatingAIButton";
import { useMapStore } from "../stores/mapStore";
import { getPersistedFilters, persistFilters } from "@/lib/map/filterPersistence";

interface MapViewProps {
  mapId?: string;
  onMapLoad?: (map: google.maps.Map) => void;
  onOpenChat?: () => void;
}

export function MapView({ mapId, onMapLoad, onOpenChat }: MapViewProps) {
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

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />

      {/* Floating Buttons */}
      <div className="pointer-events-none fixed inset-0 z-30">
        {/* Filter Button */}
        <div className="pointer-events-auto absolute bottom-[92px] left-4">
          <FilterButton />
        </div>

        {/* AI Button */}
        {onOpenChat && (
          <div className="pointer-events-auto absolute bottom-[92px] left-[76px]">
            <FloatingAIButton onOpenChat={onOpenChat} />
          </div>
        )}
      </div>
    </div>
  );
}
