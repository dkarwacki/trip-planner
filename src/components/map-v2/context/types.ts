/**
 * State management types for map-v2
 */

import type { ViewMode, DesktopMode, MobileTab, SaveStatus, FilterState, AIMessage } from "../types";

// Main state interface
export interface MapStateV2 {
  // Core data
  places: any[]; // Will be typed with domain Place type
  selectedPlaceId: string | null;
  discoveryResults: any[]; // Will be typed with domain Attraction/Restaurant types
  searchCenters: Array<{ lat: number; lng: number }>; // Track all search locations for "search this area" button

  // Desktop UI state
  activeMode: DesktopMode;
  sidebarCollapsed: boolean;

  // Mobile UI state
  activeMobileTab: MobileTab;
  bottomSheetOpen: boolean;
  aiChatModalOpen: boolean;
  filterSheetOpen: boolean;

  // View preferences
  viewMode: ViewMode;

  // Filters
  filters: FilterState;

  // AI conversation
  aiConversation: AIMessage[];
  aiContext: string | null; // Place ID that AI is helping with

  // Auto-save state
  saveStatus: SaveStatus;
  lastSaved: Date | null;

  // Loading states
  isLoadingPlaces: boolean;
  isLoadingDiscovery: boolean;
  isLoadingAI: boolean;

  // Progressive disclosure card state
  hoveredMarkerId: string | null;
  expandedCardPlaceId: string | null;
  highlightedPlaceId: string | null;

  // Map centering
  centerRequestTimestamp: number | null;
}

// Action types
export type MapAction =
  // Place management
  | { type: "SET_PLACES"; payload: any[] }
  | { type: "ADD_PLACE"; payload: any }
  | { type: "REMOVE_PLACE"; payload: string }
  | { type: "REORDER_PLACES"; payload: { sourceIndex: number; destinationIndex: number } }
  | { type: "ADD_ATTRACTION_TO_PLACE"; payload: { placeId: string; attraction: any } }
  | { type: "ADD_RESTAURANT_TO_PLACE"; payload: { placeId: string; restaurant: any } }
  | { type: "REMOVE_ATTRACTION_FROM_PLACE"; payload: { placeId: string; attractionId: string } }
  | { type: "REMOVE_RESTAURANT_FROM_PLACE"; payload: { placeId: string; restaurantId: string } }

  // Selection
  | { type: "SELECT_PLACE"; payload: string | null }

  // Discovery
  | { type: "SET_DISCOVERY_RESULTS"; payload: any[] }
  | { type: "ADD_DISCOVERY_RESULTS"; payload: any[] }
  | { type: "ADD_SEARCH_CENTER"; payload: { lat: number; lng: number } }
  | { type: "CLEAR_SEARCH_CENTERS" }

  // UI modes
  | { type: "SET_ACTIVE_MODE"; payload: DesktopMode }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR_COLLAPSED"; payload: boolean }
  | { type: "SET_MOBILE_TAB"; payload: MobileTab }
  | { type: "SET_BOTTOM_SHEET_OPEN"; payload: boolean }
  | { type: "SET_AI_CHAT_MODAL_OPEN"; payload: boolean }
  | { type: "SET_FILTER_SHEET_OPEN"; payload: boolean }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }

  // Filters
  | { type: "UPDATE_FILTERS"; payload: Partial<FilterState> }
  | { type: "CLEAR_FILTERS" }

  // AI
  | { type: "ADD_AI_MESSAGE"; payload: AIMessage }
  | { type: "CLEAR_AI_CONVERSATION" }
  | { type: "SET_AI_CONTEXT"; payload: string | null }

  // Save status
  | { type: "SET_SAVE_STATUS"; payload: SaveStatus }
  | { type: "SET_LAST_SAVED"; payload: Date }

  // Loading states
  | { type: "SET_LOADING_PLACES"; payload: boolean }
  | { type: "SET_LOADING_DISCOVERY"; payload: boolean }
  | { type: "SET_LOADING_AI"; payload: boolean }

  // Progressive disclosure cards
  | { type: "SET_HOVERED_MARKER"; payload: string | null }
  | { type: "SET_EXPANDED_CARD"; payload: string | null }
  | { type: "CLOSE_CARD" }
  | { type: "SET_HIGHLIGHTED_PLACE"; payload: string | null }

  // Map centering
  | { type: "REQUEST_CENTER_ON_PLACE"; payload: string };

// Initial state
export const initialMapState: MapStateV2 = {
  // Core data
  places: [],
  selectedPlaceId: null,
  discoveryResults: [],
  searchCenters: [],

  // Desktop UI state
  activeMode: "discover",
  sidebarCollapsed: false,

  // Mobile UI state
  activeMobileTab: "map",
  bottomSheetOpen: false,
  aiChatModalOpen: false,
  filterSheetOpen: false,

  // View preferences
  viewMode: "cards",

  // Filters
  filters: {
    category: "all",
    minScore: 7,
    showHighQualityOnly: false,
  },

  // AI conversation
  aiConversation: [],
  aiContext: null,

  // Auto-save state
  saveStatus: "idle",
  lastSaved: null,

  // Loading states
  isLoadingPlaces: false,
  isLoadingDiscovery: false,
  isLoadingAI: false,

  // Progressive disclosure cards
  hoveredMarkerId: null,
  expandedCardPlaceId: null,
  highlightedPlaceId: null,

  // Map centering
  centerRequestTimestamp: null,
};
