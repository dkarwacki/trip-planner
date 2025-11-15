/**
 * State management types for map-v2
 */

import type { ViewMode, DesktopMode, MobileTab, SaveStatus, FilterState, AIMessage } from '../types';

// Main state interface
export interface MapStateV2 {
  // Core data
  places: any[]; // Will be typed with domain Place type
  selectedPlaceId: string | null;
  discoveryResults: any[]; // Will be typed with domain Attraction/Restaurant types
  
  // Desktop UI state
  activeMode: DesktopMode;
  sidebarCollapsed: boolean;
  
  // Mobile UI state
  activeMobileTab: MobileTab;
  bottomSheetOpen: boolean;
  
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
}

// Action types
export type MapAction =
  // Place management
  | { type: 'SET_PLACES'; payload: any[] }
  | { type: 'ADD_PLACE'; payload: any }
  | { type: 'REMOVE_PLACE'; payload: string }
  | { type: 'REORDER_PLACES'; payload: { sourceIndex: number; destinationIndex: number } }
  
  // Selection
  | { type: 'SELECT_PLACE'; payload: string | null }
  
  // Discovery
  | { type: 'SET_DISCOVERY_RESULTS'; payload: any[] }
  
  // UI modes
  | { type: 'SET_ACTIVE_MODE'; payload: DesktopMode }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'SET_MOBILE_TAB'; payload: MobileTab }
  | { type: 'SET_BOTTOM_SHEET_OPEN'; payload: boolean }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  
  // Filters
  | { type: 'UPDATE_FILTERS'; payload: Partial<FilterState> }
  | { type: 'CLEAR_FILTERS' }
  
  // AI
  | { type: 'ADD_AI_MESSAGE'; payload: AIMessage }
  | { type: 'CLEAR_AI_CONVERSATION' }
  | { type: 'SET_AI_CONTEXT'; payload: string | null }
  
  // Save status
  | { type: 'SET_SAVE_STATUS'; payload: SaveStatus }
  | { type: 'SET_LAST_SAVED'; payload: Date }
  
  // Loading states
  | { type: 'SET_LOADING_PLACES'; payload: boolean }
  | { type: 'SET_LOADING_DISCOVERY'; payload: boolean }
  | { type: 'SET_LOADING_AI'; payload: boolean }

  // Progressive disclosure cards
  | { type: 'SET_HOVERED_MARKER'; payload: string | null }
  | { type: 'SET_EXPANDED_CARD'; payload: string | null }
  | { type: 'CLOSE_CARD' };

// Initial state
export const initialMapState: MapStateV2 = {
  // Core data
  places: [],
  selectedPlaceId: null,
  discoveryResults: [],
  
  // Desktop UI state
  activeMode: 'discover',
  sidebarCollapsed: false,
  
  // Mobile UI state
  activeMobileTab: 'map',
  bottomSheetOpen: false,
  
  // View preferences
  viewMode: 'cards',
  
  // Filters
  filters: {
    category: 'all',
    minScore: 7,
    showHighQualityOnly: false,
  },
  
  // AI conversation
  aiConversation: [],
  aiContext: null,
  
  // Auto-save state
  saveStatus: 'idle',
  lastSaved: null,
  
  // Loading states
  isLoadingPlaces: false,
  isLoadingDiscovery: false,
  isLoadingAI: false,

  // Progressive disclosure cards
  hoveredMarkerId: null,
  expandedCardPlaceId: null,
};

