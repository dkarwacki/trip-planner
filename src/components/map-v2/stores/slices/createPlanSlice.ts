import type { StateCreator } from "zustand";
import type { MapStore, PlanState, PlanActions } from "../types";
import type { PlannedPlace } from "../../types";

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

  // Trip sync state
  tripId: null,
  tripTitle: null,
  conversationId: null,
  isDirty: false,
  lastSyncedPlaces: [],
  syncError: null,

  // Actions
  setPlaces: (places) => set({ places }),

  addPlace: (place) =>
    set((state) => ({
      places: [...state.places, place],
      selectedPlaceId: place.id,
      centerRequestTimestamp: Date.now(),
      isDirty: true,
    })),

  removePlace: (placeId) =>
    set((state) => ({
      places: state.places.filter((p) => p.id !== placeId),
      isDirty: true,
    })),

  reorderPlaces: (sourceIndex, destIndex) =>
    set((state) => {
      const newPlaces = Array.from(state.places);
      const [removed] = newPlaces.splice(sourceIndex, 1);
      newPlaces.splice(destIndex, 0, removed);
      return { places: newPlaces, isDirty: true };
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
      isDirty: true,
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
      isDirty: true,
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
      isDirty: true,
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
      isDirty: true,
    })),

  setSelectedPlace: (id) =>
    set((state) => ({
      selectedPlaceId: id,
      activeMode: id && state.activeMode !== "plan" ? "discover" : state.activeMode,
    })),

  getSelectedPlace: () => {
    const state = get();
    if (!state.selectedPlaceId) return null;
    return (state.discoveryResults.find((p) => p.id === state.selectedPlaceId) ||
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

  // Trip sync actions
  setTripId: (tripId) => set({ tripId }),

  setTripTitle: (tripTitle) => set({ tripTitle }),

  setConversationId: (conversationId) => set({ conversationId }),

  setDirty: (isDirty) => set({ isDirty }),

  setSyncError: (syncError) => set({ syncError }),

  markSynced: (places) =>
    set({
      lastSyncedPlaces: places,
      isDirty: false,
      syncError: null,
    }),

  triggerSync: () => {
    // This will be called by the auto-save hook
    // The actual sync logic is handled by the hook
    set({ isDirty: true });
  },
});
