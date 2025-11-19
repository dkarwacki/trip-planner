import { useMemo, useCallback, useEffect } from "react";
import { useMapStore } from "../../stores/mapStore";
import { getPersistedFilters, persistFilters } from "@/lib/map-v2/filterPersistence";

export function useDiscoverFilters() {
  const selectedPlaceId = useMapStore((state) => state.selectedPlaceId);
  const discoveryResults = useMapStore((state) => state.discoveryResults);
  const filters = useMapStore((state) => state.filters);
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

  // Filter and sort results based on active filters
  const filteredResults = useMemo(() => {
    let results = [...discoveryResults];

    // Category filter
    if (filters.category !== "all") {
      results = results.filter((item) => {
        // Simple type detection based on Google Place types
        // Note: data structure has types nested under attraction object
        const isRestaurant = item.attraction?.types?.some((t: string) =>
          ["restaurant", "food", "cafe", "bar", "bakery"].includes(t)
        );
        return filters.category === "restaurants" ? isRestaurant : !isRestaurant;
      });
    }

    // High quality filter
    if (filters.showHighQualityOnly) {
      results = results.filter((item) => {
        const score = item.score || 0;
        return score >= filters.minScore * 10; // Convert 7/8/9 to 70/80/90
      });
    }

    // Sort results: attractions first, then restaurants, both sorted by score (descending)
    results.sort((a, b) => {
      const isRestaurantA = a.attraction?.types?.some((t: string) =>
        ["restaurant", "food", "cafe", "bar", "bakery"].includes(t)
      );
      const isRestaurantB = b.attraction?.types?.some((t: string) =>
        ["restaurant", "food", "cafe", "bar", "bakery"].includes(t)
      );

      // Group by type: attractions (false) before restaurants (true)
      if (isRestaurantA !== isRestaurantB) {
        return isRestaurantA ? 1 : -1;
      }

      // Within same type, sort by score (descending - highest first)
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return scoreB - scoreA;
    });

    return results;
  }, [discoveryResults, filters]);

  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      updateFilters(newFilters);
    },
    [updateFilters]
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  return {
    filters,
    filteredResults,
    handleFilterChange,
    handleClearFilters,
  };
}
