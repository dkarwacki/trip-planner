import type { Attraction, AttractionScore } from "@/domain/map/models";
import type { AIMessage } from "../types";
import type { PlannedPlace } from "../types";

// ============= STATE INTERFACES =============

export interface FilterState {
  category: "all" | "attractions" | "restaurants";
  minScore: 7 | 8 | 9;
  showHighQualityOnly: boolean;
}

export interface CachedDiscovery {
  results: AttractionScore[];
  timestamp: number;
  center: { lat: number; lng: number };
  radius: number;
}

export interface DiscoverState {
  discoveryCache: Map<string, CachedDiscovery>;
  currentDiscoveryKey: string | null;
  discoveryResults: AttractionScore[];
  highlightedPlaceId: string | null;
  filters: FilterState;
  viewMode: "cards" | "grid" | "list";
  isLoadingDiscovery: boolean;
}

export interface PlanState {
  places: PlannedPlace[];
  selectedPlaceId: string | null;
  isLoadingPlaces: boolean;

  // Trip sync state
  tripId: string | null;
  tripTitle: string | null;
  conversationId: string | null;
  isDirty: boolean;
  lastSyncedPlaces: PlannedPlace[];
  syncError: Error | null;
}

export interface MapState {
  hoveredMarkerId: string | null;
  expandedCardPlaceId: string | null;
  searchCenters: { lat: number; lng: number }[];
  centerRequestTimestamp: number;
  shouldFitBounds: boolean;
}

export interface AIState {
  conversation: AIMessage[];
  context: string | null; // Place ID
  isLoading: boolean;
  modalOpen: boolean; // Mobile
}

export interface UIState {
  // Desktop
  activeMode: "discover" | "plan" | "ai";
  sidebarCollapsed: boolean;

  // Mobile
  activeMobileTab: "map" | "discover" | "plan";
  bottomSheetOpen: boolean;
  filterSheetOpen: boolean;

  // Save status
  saveStatus: "idle" | "saving" | "saved" | "error";
  lastSaved: Date | null;
}

// ============= ACTION INTERFACES =============

export interface DiscoverActions {
  // Results
  fetchDiscoveryResults: (lat: number, lng: number, radius: number) => Promise<void>;
  setDiscoveryResults: (results: AttractionScore[]) => void;
  addDiscoveryResults: (results: AttractionScore[]) => void;
  clearDiscoveryCache: (olderThanMs?: number) => void;

  // Highlighting
  setHighlightedPlace: (id: string | null) => void;

  // Filters
  updateFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;

  // View mode
  setViewMode: (mode: "cards" | "grid" | "list") => void;

  // Loading
  setLoadingDiscovery: (isLoading: boolean) => void;
}

export interface PlanActions {
  // Place CRUD
  setPlaces: (places: PlannedPlace[]) => void;
  addPlace: (place: PlannedPlace) => void;
  removePlace: (placeId: string) => void;
  reorderPlaces: (sourceIndex: number, destIndex: number) => void;

  // Attraction/Restaurant CRUD
  addAttractionToPlace: (placeId: string, attraction: Attraction) => void;
  addRestaurantToPlace: (placeId: string, restaurant: Attraction) => void;
  removeAttractionFromPlace: (placeId: string, attractionId: string) => void;
  removeRestaurantFromPlace: (placeId: string, restaurantId: string) => void;

  // Selection
  setSelectedPlace: (id: string | null) => void;
  getSelectedPlace: () => PlannedPlace | null;
  centerOnPlace: (placeId: string) => void;

  // Derived selectors
  getPlannedAttractionIds: () => Set<string>;

  // Trip sync actions
  setTripId: (tripId: string | null) => void;
  setTripTitle: (title: string | null) => void;
  setConversationId: (conversationId: string | null) => void;
  setDirty: (isDirty: boolean) => void;
  setSyncError: (error: Error | null) => void;
  markSynced: (places: PlannedPlace[]) => void;
  triggerSync: () => void;
}

export interface MapActions {
  setHoveredMarker: (id: string | null) => void;
  setExpandedCard: (id: string | null) => void;
  closeCard: () => void;
  addSearchCenter: (center: { lat: number; lng: number }) => void;
  clearSearchCenters: () => void;
  requestFitBounds: () => void;
  clearFitBoundsRequest: () => void;
}

export interface AIActions {
  addAIMessage: (message: AIMessage) => void;
  clearAIConversation: () => void;
  setAIContext: (placeId: string | null) => void;
  setAIChatModalOpen: (open: boolean) => void;
}

export interface UIActions {
  // Desktop
  setActiveMode: (mode: "discover" | "plan" | "ai") => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Mobile
  setMobileTab: (tab: "map" | "discover" | "plan") => void;
  setBottomSheetOpen: (open: boolean) => void;
  setFilterSheetOpen: (open: boolean) => void;

  // Save status
  setSaveStatus: (status: UIState["saveStatus"]) => void;
  setLastSaved: (date: Date) => void;
}

// ============= COMBINED STORE TYPE =============

export type MapStore = DiscoverState &
  PlanState &
  MapState &
  AIState &
  UIState &
  DiscoverActions &
  PlanActions &
  MapActions &
  AIActions &
  UIActions;
