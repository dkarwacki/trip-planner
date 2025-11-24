import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import type { MapStore, FilterState } from "./types";
import { createDiscoverSlice } from "./slices/createDiscoverSlice";
import { createPlanSlice } from "./slices/createPlanSlice";
import { createMapSlice } from "./slices/createMapSlice";
import { createAISlice } from "./slices/createAISlice";
import { createUISlice } from "./slices/createUISlice";
import type { DiscoveryItemViewModel } from "@/lib/map-v2/types";

// ============= STORE IMPLEMENTATION =============

export const useMapStore = create<MapStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createDiscoverSlice(...a),
        ...createPlanSlice(...a),
        ...createMapSlice(...a),
        ...createAISlice(...a),
        ...createUISlice(...a),
      }),
      {
        name: "map-storage", // Renamed from map-v2-storage to be cleaner
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          // Persist UI prefs only
          viewMode: state.viewMode,
          sidebarCollapsed: state.sidebarCollapsed,
          filters: state.filters,
          activeMode: state.activeMode,
          // Cache discovery for session
          discoveryCache: state.discoveryCache,
        }),
      }
    ),
    { name: "MapStore" }
  )
);

// ========== SELECTOR HELPERS ==========

// Get planned attraction IDs (with shallow comparison)
export const selectPlannedIds = (state: MapStore) => {
  const ids = new Set<string>();
  state.places.forEach((p) => {
    p.plannedAttractions?.forEach((a) => ids.add(a.id));
    p.plannedRestaurants?.forEach((r) => ids.add(r.id));
  });
  return ids;
};

// Check if attraction is in plan
export const selectIsInPlan = (attractionId: string) => (state: MapStore) => {
  const ids = selectPlannedIds(state);
  return ids.has(attractionId);
};

/**
 * Pure function to filter discovery results
 * Can be used by both the store selector and hooks
 */
export const filterDiscoveryResults = (
  results: DiscoveryItemViewModel[],
  filters: FilterState
): DiscoveryItemViewModel[] => {
  let filtered = [...results];

  // Apply filters (same logic as DiscoverPanel)
  if (filters.category !== "all") {
    filtered = filtered.filter((item) => {
      const isRestaurant = item.types?.some((t) => ["restaurant", "food", "cafe", "bar", "bakery"].includes(t));
      return filters.category === "restaurants" ? isRestaurant : !isRestaurant;
    });
  }

  if (filters.showHighQualityOnly) {
    filtered = filtered.filter((item) => {
      const score = item.score || 0;
      return score >= filters.minScore * 10;
    });
  }

  return filtered;
};

// Get filtered discovery results
export const selectFilteredDiscovery = (state: MapStore) => {
  return filterDiscoveryResults(state.discoveryResults, state.filters);
};
