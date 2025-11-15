/**
 * Map state management with Context API and reducer
 */

import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { MapStateV2, MapAction } from './types';
import { initialMapState } from './types';

// Context type
interface MapStateContextValue {
  state: MapStateV2;
  dispatch: React.Dispatch<MapAction>;
}

// Create context
const MapStateContext = createContext<MapStateContextValue | undefined>(undefined);

// Reducer function
function mapStateReducer(state: MapStateV2, action: MapAction): MapStateV2 {
  switch (action.type) {
    // Place management
    case 'SET_PLACES':
      return { ...state, places: action.payload };
    
    case 'ADD_PLACE':
      return { ...state, places: [...state.places, action.payload] };
    
    case 'REMOVE_PLACE':
      return {
        ...state,
        places: state.places.filter((p: any) => p.id !== action.payload),
      };
    
    case 'REORDER_PLACES': {
      const { sourceIndex, destinationIndex } = action.payload;
      const newPlaces = Array.from(state.places);
      const [removed] = newPlaces.splice(sourceIndex, 1);
      newPlaces.splice(destinationIndex, 0, removed);
      return { ...state, places: newPlaces };
    }
    
    // Selection - auto-switch to discover mode when place selected
    case 'SELECT_PLACE':
      return {
        ...state,
        selectedPlaceId: action.payload,
        activeMode: action.payload ? 'discover' : state.activeMode,
      };
    
    // Discovery
    case 'SET_DISCOVERY_RESULTS':
      return { ...state, discoveryResults: action.payload };
    
    // UI modes
    case 'SET_ACTIVE_MODE':
      return { ...state, activeMode: action.payload };
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    
    case 'SET_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: action.payload };
    
    case 'SET_MOBILE_TAB':
      return { ...state, activeMobileTab: action.payload };
    
    case 'SET_BOTTOM_SHEET_OPEN':
      return { ...state, bottomSheetOpen: action.payload };
    
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    
    // Filters - just update, results will be filtered in DiscoverPanel
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: initialMapState.filters,
      };
    
    // AI
    case 'ADD_AI_MESSAGE':
      return {
        ...state,
        aiConversation: [...state.aiConversation, action.payload],
      };
    
    case 'CLEAR_AI_CONVERSATION':
      return {
        ...state,
        aiConversation: [],
      };
    
    case 'SET_AI_CONTEXT':
      return { ...state, aiContext: action.payload };
    
    // Save status
    case 'SET_SAVE_STATUS':
      return { ...state, saveStatus: action.payload };
    
    case 'SET_LAST_SAVED':
      return { ...state, lastSaved: action.payload };
    
    // Loading states
    case 'SET_LOADING_PLACES':
      return { ...state, isLoadingPlaces: action.payload };
    
    case 'SET_LOADING_DISCOVERY':
      return { ...state, isLoadingDiscovery: action.payload };
    
    case 'SET_LOADING_AI':
      return { ...state, isLoadingAI: action.payload };

    // Progressive disclosure cards
    case 'SET_HOVERED_MARKER':
      return { ...state, hoveredMarkerId: action.payload };
    
    case 'SET_EXPANDED_CARD':
      return { 
        ...state, 
        expandedCardPlaceId: action.payload,
        hoveredMarkerId: null, // Close hover card when expanded card opens
      };
    
    case 'CLOSE_CARD':
      return {
        ...state,
        expandedCardPlaceId: null,
        hoveredMarkerId: null,
      };
    
    default:
      return state;
  }
}

// Provider props
interface MapStateProviderProps {
  children: ReactNode;
  tripId?: string;
  conversationId?: string;
}

// Provider component
export function MapStateProvider({ children, tripId, conversationId }: MapStateProviderProps) {
  const [state, dispatch] = useReducer(mapStateReducer, initialMapState);

  // Load initial data on mount
  useEffect(() => {
    // TODO: Load places from Supabase based on tripId/conversationId
    // This will be implemented when we integrate with the backend
    if (tripId || conversationId) {
      console.log('Loading data for:', { tripId, conversationId });
      // dispatch({ type: 'SET_LOADING_PLACES', payload: true });
      // ... fetch and load places
    }
  }, [tripId, conversationId]);

  // Persist UI preferences to localStorage
  useEffect(() => {
    const preferences = {
      sidebarCollapsed: state.sidebarCollapsed,
      viewMode: state.viewMode,
      filters: state.filters,
    };
    localStorage.setItem('map-v2-preferences', JSON.stringify(preferences));
  }, [state.sidebarCollapsed, state.viewMode, state.filters]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('map-v2-preferences');
    if (stored) {
      try {
        const preferences = JSON.parse(stored);
        if (preferences.sidebarCollapsed !== undefined) {
          dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: preferences.sidebarCollapsed });
        }
        if (preferences.viewMode) {
          dispatch({ type: 'SET_VIEW_MODE', payload: preferences.viewMode });
        }
        if (preferences.filters) {
          dispatch({ type: 'UPDATE_FILTERS', payload: preferences.filters });
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }
  }, []);

  return (
    <MapStateContext.Provider value={{ state, dispatch }}>
      {children}
    </MapStateContext.Provider>
  );
}

// Custom hook to use the map state
export function useMapState() {
  const context = useContext(MapStateContext);
  if (!context) {
    throw new Error('useMapState must be used within MapStateProvider');
  }
  
  const { state, dispatch } = context;
  
  // Convenience methods
  return {
    // State
    ...state,
    
    // Direct access to dispatch for advanced use cases
    dispatch,
    
    // Place management
    addToPlanning: (place: any) => {
      dispatch({ type: 'ADD_PLACE', payload: place });
    },
    removeFromPlanning: (placeId: string) => {
      dispatch({ type: 'REMOVE_PLACE', payload: placeId });
    },
    reorderPlaces: (sourceIndex: number, destinationIndex: number) => {
      dispatch({ type: 'REORDER_PLACES', payload: { sourceIndex, destinationIndex } });
    },
    
    // Selection
    setSelectedPlace: (placeId: string | null) => {
      dispatch({ type: 'SELECT_PLACE', payload: placeId });
    },
    getSelectedPlace: () => {
      if (!state.selectedPlaceId) return null;
      // Try to find in discovery results first, then in places
      return state.discoveryResults.find((p: any) => p.id === state.selectedPlaceId) 
        || state.places.find((p: any) => p.id === state.selectedPlaceId)
        || null;
    },
    
    // Discovery
    setDiscoveryResults: (results: any[]) => {
      dispatch({ type: 'SET_DISCOVERY_RESULTS', payload: results });
    },
    
    // UI modes
    setActiveMode: (mode: any) => {
      dispatch({ type: 'SET_ACTIVE_MODE', payload: mode });
    },
    toggleSidebar: () => {
      dispatch({ type: 'TOGGLE_SIDEBAR' });
    },
    setSidebarCollapsed: (collapsed: boolean) => {
      dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: collapsed });
    },
    
    // Filters
    updateFilters: (filters: any) => {
      dispatch({ type: 'UPDATE_FILTERS', payload: filters });
    },
    clearFilters: () => {
      dispatch({ type: 'CLEAR_FILTERS' });
    },
    
    // Progressive disclosure
    setHoveredMarker: (markerId: string | null) => {
      dispatch({ type: 'SET_HOVERED_MARKER', payload: markerId });
    },
    setExpandedCard: (placeId: string | null) => {
      dispatch({ type: 'SET_EXPANDED_CARD', payload: placeId });
    },
    closeCard: () => {
      dispatch({ type: 'CLOSE_CARD' });
    },
    
    // AI
    addAIMessage: (message: any) => {
      dispatch({ type: 'ADD_AI_MESSAGE', payload: message });
    },
    clearAIConversation: () => {
      dispatch({ type: 'CLEAR_AI_CONVERSATION' });
    },
    setAIContext: (placeId: string | null) => {
      dispatch({ type: 'SET_AI_CONTEXT', payload: placeId });
    },
    
    // Renamed for clarity
    planItems: state.places,
    
    // Also return state object for components that need it
    state,
  };
}

