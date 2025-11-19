import type { StateCreator } from "zustand";
import type { MapStore, PlanState, PlanActions, PlannedPlace } from "../types";

export const createPlanSlice: StateCreator<
  MapStore,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [],
  PlanState & PlanActions
> = (set, get) => ({
  // State
  places: [],
  selectedPlaceId: null,
  isLoadingPlaces: false,

  // Actions
  setPlaces: (places) => set({ places }),

  addPlace: (place) =>
    set((state) => ({
      places: [...state.places, place],
      selectedPlaceId: place.id,
      centerRequestTimestamp: Date.now(),
    })),

  removePlace: (placeId) =>
    set((state) => ({
      places: state.places.filter((p) => p.id !== placeId),
    })),

  reorderPlaces: (sourceIndex, destIndex) =>
    set((state) => {
      const newPlaces = Array.from(state.places);
      const [removed] = newPlaces.splice(sourceIndex, 1);
      newPlaces.splice(destIndex, 0, removed);
      return { places: newPlaces };
    }),

  addAttractionToPlace: (placeId, attraction) =>
    set((state) => ({
      places: state.places.map((place) => {
        if (place.id === placeId) {
          return {
            ...place,
            plannedAttractions: [...(place.plannedAttractions || []), attraction],
          };
        }
        return place;
      }),
    })),

  addRestaurantToPlace: (placeId, restaurant) =>
    set((state) => ({
      places: state.places.map((place) => {
        if (place.id === placeId) {
          return {
            ...place,
            plannedRestaurants: [...(place.plannedRestaurants || []), restaurant],
          };
        }
        return place;
      }),
    })),

  removeAttractionFromPlace: (placeId, attractionId) =>
    set((state) => ({
      places: state.places.map((place) => {
        if (place.id === placeId) {
          return {
            ...place,
            plannedAttractions: (place.plannedAttractions || []).filter((a) => a.id !== attractionId),
          };
        }
        return place;
      }),
    })),

  removeRestaurantFromPlace: (placeId, restaurantId) =>
    set((state) => ({
      places: state.places.map((place) => {
        if (place.id === placeId) {
          return {
            ...place,
            plannedRestaurants: (place.plannedRestaurants || []).filter((r) => r.id !== restaurantId),
          };
        }
        return place;
      }),
    })),

  setSelectedPlace: (id) =>
    set((state) => ({
      selectedPlaceId: id,
      activeMode: id && state.activeMode !== "plan" ? "discover" : state.activeMode,
    })),

  getSelectedPlace: () => {
    const state = get();
    if (!state.selectedPlaceId) return null;
    return (state.discoveryResults.find((p: any) => p.id === state.selectedPlaceId) ||
      state.places.find((p) => p.id === state.selectedPlaceId) ||
      null) as PlannedPlace | null;
  },

  centerOnPlace: (placeId) =>
    set({
      selectedPlaceId: placeId,
      centerRequestTimestamp: Date.now(),
    }),

  getPlannedAttractionIds: () => {
    const state = get();
    const ids = new Set<string>();
    state.places.forEach((p) => {
      p.plannedAttractions?.forEach((a) => ids.add(a.id));
      p.plannedRestaurants?.forEach((r) => ids.add(r.id));
    });
    return ids;
  },
});
