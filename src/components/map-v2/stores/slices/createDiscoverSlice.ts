import type { StateCreator } from "zustand";
import type { MapStore, DiscoverState, DiscoverActions } from "../types";

export const createDiscoverSlice: StateCreator<
  MapStore,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [],
  DiscoverState & DiscoverActions
> = (set) => ({
  // State
  discoveryCache: new Map(),
  currentDiscoveryKey: null,
  discoveryResults: [],
  highlightedPlaceId: null,
  filters: {
    category: "all",
    minScore: 7,
    showHighQualityOnly: false,
  },
  viewMode: "cards",
  isLoadingDiscovery: false,

  // Results
  fetchDiscoveryResults: async (_lat, _lng, _radius) => {
    // TODO: Implement actual discovery fetching logic
    // This will be implemented when we migrate the discovery fetching logic
    // For now, this is a placeholder that does nothing
    return Promise.resolve();
  },

  setDiscoveryResults: (results) => set({ discoveryResults: results }),

  addDiscoveryResults: (newResults) =>
    set((state) => {
      const existingIds = new Set(state.discoveryResults.map((r) => r.attraction?.id));
      const uniqueNewResults = newResults.filter((r) => !existingIds.has(r.attraction?.id));
      return { discoveryResults: [...state.discoveryResults, ...uniqueNewResults] };
    }),

  clearDiscoveryCache: (olderThanMs = 30 * 60 * 1000) =>
    set((state) => {
      const newCache = new Map(state.discoveryCache);
      const now = Date.now();
      for (const [key, entry] of newCache.entries()) {
        if (now - entry.timestamp > olderThanMs) {
          newCache.delete(key);
        }
      }
      return { discoveryCache: newCache };
    }),

  setHighlightedPlace: (id) => set({ highlightedPlaceId: id }),

  updateFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

  clearFilters: () =>
    set({
      filters: { category: "all", minScore: 7, showHighQualityOnly: false },
    }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setLoadingDiscovery: (isLoading) => set({ isLoadingDiscovery: isLoading }),
});
