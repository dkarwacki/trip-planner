import type { StateCreator } from "zustand";
import type { MapStore, UIState, UIActions } from "../types";

export const createUISlice: StateCreator<
  MapStore,
  [["zustand/devtools", never], ["zustand/persist", unknown]],
  [],
  UIState & UIActions
> = (set) => ({
  // State
  activeMode: "discover",
  sidebarCollapsed: false,
  activeMobileTab: "map",
  bottomSheetOpen: false,
  filterSheetOpen: false,
  saveStatus: "idle",
  lastSaved: null,

  // Actions
  setActiveMode: (mode) => set({ activeMode: mode }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setMobileTab: (tab) => set({ activeMobileTab: tab }),

  setBottomSheetOpen: (open) => set({ bottomSheetOpen: open }),

  setFilterSheetOpen: (open) => set({ filterSheetOpen: open }),

  setSaveStatus: (status) => set({ saveStatus: status }),

  setLastSaved: (date) => set({ lastSaved: date }),
});
