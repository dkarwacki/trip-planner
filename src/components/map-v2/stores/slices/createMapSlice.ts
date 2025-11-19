import type { StateCreator } from "zustand";
import type { MapStore, MapState, MapActions } from "../types";

export const createMapSlice: StateCreator<
  MapStore,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [],
  MapState & MapActions
> = (set) => ({
  // State
  hoveredMarkerId: null,
  expandedCardPlaceId: null,
  searchCenters: [],
  centerRequestTimestamp: 0,
  shouldFitBounds: false,

  // Actions
  setHoveredMarker: (id) => set({ hoveredMarkerId: id }),

  setExpandedCard: (id) =>
    set({
      expandedCardPlaceId: id,
      hoveredMarkerId: null,
    }),

  closeCard: () =>
    set({
      expandedCardPlaceId: null,
      hoveredMarkerId: null,
    }),

  addSearchCenter: (center) =>
    set((state) => ({
      searchCenters: [...state.searchCenters, center],
    })),

  clearSearchCenters: () => set({ searchCenters: [] }),

  requestFitBounds: () => set({ shouldFitBounds: true }),
  
  clearFitBoundsRequest: () => set({ shouldFitBounds: false }),
});
