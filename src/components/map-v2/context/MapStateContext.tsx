/**
 * Map state management provider
 * Simplified wrapper - all components now use useMapStore directly
 */

// @refresh reset
import React, { createContext, useEffect, type ReactNode } from "react";

// Context type - just a flag to ensure provider presence
interface MapStateContextValue {
  isInitialized: boolean;
}

// Create context
export const MapStateContext = createContext<MapStateContextValue | undefined>(undefined);

// Provider props
export interface MapStateProviderProps {
  children: ReactNode;
  tripId?: string;
  conversationId?: string;
}

// Provider component
export function MapStateProvider({ children, tripId, conversationId }: MapStateProviderProps) {
  // Load initial data on mount
  useEffect(() => {
    // TODO: Load places from Supabase based on tripId/conversationId
    // This will be implemented when we integrate with the backend
    if (tripId || conversationId) {
      // console.log("Loading data for:", { tripId, conversationId });
      // useMapStore.getState().setLoadingPlaces(true);
      // ... fetch and load places
    }
  }, [tripId, conversationId]);

  return <MapStateContext.Provider value={{ isInitialized: true }}>{children}</MapStateContext.Provider>;
}
