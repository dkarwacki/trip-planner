/**
 * Map state management provider
 * Handles trip data loading and auto-save setup
 */

// @refresh reset
import React, { createContext, useEffect, type ReactNode } from "react";
import { useMapStore } from "../stores/mapStore";
import { useAutoSave } from "../hooks/useAutoSave";
import { plannedPlacesFromDAOs, tripPlaceDTOsToPlaceDAOs } from "@/lib/map-v2/tripMappers";
import type { TripPlaceDTO } from "@/infrastructure/plan/api";

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
  const setTripId = useMapStore((state) => state.setTripId);
  const setTripTitle = useMapStore((state) => state.setTripTitle);
  const setConversationId = useMapStore((state) => state.setConversationId);
  const setPlaces = useMapStore((state) => state.setPlaces);
  const markSynced = useMapStore((state) => state.markSynced);
  const setActiveMode = useMapStore((state) => state.setActiveMode);
  const setMobileTab = useMapStore((state) => state.setMobileTab);
  const setSelectedPlace = useMapStore((state) => state.setSelectedPlace);
  const centerOnPlace = useMapStore((state) => state.centerOnPlace);

  // Set up auto-save
  useAutoSave({ enabled: true });

  // Load trip data on mount
  useEffect(() => {
    let cancelled = false;

    async function loadTripData() {
      try {
        let trip;

        if (tripId) {
          // Load specific trip by ID
          const response = await fetch(`/api/trips/${tripId}`);
          if (!response.ok) throw new Error("Failed to load trip");
          trip = await response.json();
        } else if (conversationId) {
          // Load trip by conversation ID
          const response = await fetch(`/api/trips/by-conversation/${conversationId}`);
          if (response.ok) {
            trip = await response.json();
          } else if (response.status === 404) {
            // No trip for this conversation yet, create one
            const createResponse = await fetch("/api/trips", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: `Trip Plan - ${new Date().toLocaleDateString()}`,
                conversation_id: conversationId,
                places: [],
              }),
            });
            if (!createResponse.ok) throw new Error("Failed to create trip");
            trip = await createResponse.json();
          } else {
            throw new Error("Failed to load trip by conversation");
          }
        } else {
          // No tripId or conversationId provided - get or create current trip
          const response = await fetch("/api/trips/current");
          if (!response.ok) throw new Error("Failed to load current trip");
          trip = await response.json();
        }

        if (cancelled) return;

        // Update store with loaded trip
        setTripId(trip.id);
        setTripTitle(trip.title);
        setConversationId(trip.conversation_id);

        // Handle different response structures:
        // - /api/trips/current returns { places_data: PlaceDAO[] }
        // - /api/trips/:id and /api/trips/by-conversation/:conversationId return { places: TripPlaceDTO[] }
        let placeDAOs;
        if (trip.places_data) {
          // Response from /api/trips/current
          placeDAOs = trip.places_data;
        } else if (trip.places) {
          // Response from /api/trips/:id or /api/trips/by-conversation/:conversationId
          // Convert TripPlaceDTO[] to PlaceDAO[]
          placeDAOs = tripPlaceDTOsToPlaceDAOs(trip.places as TripPlaceDTO[]);
        } else {
          placeDAOs = [];
        }

        // Convert PlaceDAOs to PlannedPlaces
        const places = plannedPlacesFromDAOs(placeDAOs);
        setPlaces(places);
        markSynced(places);

        // Focus on first place if navigated from plan-v2 (tripId or conversationId provided) and places exist
        if ((tripId || conversationId) && places.length > 0) {
          const firstPlaceId = places[0].id;
          setSelectedPlace(firstPlaceId);
          centerOnPlace(firstPlaceId);

          // Check for mode query param to override default plan mode
          // This allows "Show on Map" to open in Discover mode
          const urlParams = new URLSearchParams(window.location.search);
          const modeParam = urlParams.get("mode");

          if (modeParam === "discover") {
            setActiveMode("discover");
            setMobileTab("discover");
          } else {
            setActiveMode("plan");
            setMobileTab("plan");
          }
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load trip data:", error);
      }
    }

    loadTripData();

    return () => {
      cancelled = true;
    };
    // Zustand actions are stable and don't need to be in dependencies
    // Only tripId and conversationId should trigger re-loading
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, conversationId]);

  return <MapStateContext.Provider value={{ isInitialized: true }}>{children}</MapStateContext.Provider>;
}
