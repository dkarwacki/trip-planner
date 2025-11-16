/**
 * Hook to fetch nearby places (attractions and restaurants)
 * Implements Stage 3.5 of the UX implementation plan
 *
 * Uses existing API endpoints from v1 with smart caching and parallel requests
 */

import { useCallback, useEffect } from "react";
import { useMapState } from "../context";

interface FetchNearbyOptions {
  lat: number;
  lng: number;
  radius?: number; // in meters, default 5000
}

export function useNearbyPlaces() {
  const { state, dispatch } = useMapState();

  /**
   * Fetch nearby places for a given location
   * Fetches both attractions and restaurants in parallel
   */
  const fetchNearbyPlaces = useCallback(
    async (options: FetchNearbyOptions) => {
      const { lat, lng, radius = 5000 } = options;

      dispatch({ type: "SET_LOADING_DISCOVERY", payload: true });

      try {
        // Parallel POST requests for attractions and restaurants
        const [attractionsResponse, restaurantsResponse] = await Promise.all([
          fetch("/api/attractions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lat,
              lng,
              radius,
              limit: 20,
            }),
          }),
          fetch("/api/restaurants", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lat,
              lng,
              radius: Math.min(radius, 10000), // Restaurants API max radius is 10km
              limit: 20,
            }),
          }),
        ]);

        if (!attractionsResponse.ok || !restaurantsResponse.ok) {
          throw new Error("Failed to fetch nearby places");
        }

        const attractionsData = await attractionsResponse.json();
        const restaurantsData = await restaurantsResponse.json();

        // Extract arrays from response objects
        const attractions = attractionsData.attractions || [];
        const restaurants = restaurantsData.restaurants || [];

        // Combine and store results
        const allResults = [...attractions, ...restaurants];
        dispatch({ type: "SET_DISCOVERY_RESULTS", payload: allResults });
      } catch {
        dispatch({ type: "SET_DISCOVERY_RESULTS", payload: [] });
      } finally {
        dispatch({ type: "SET_LOADING_DISCOVERY", payload: false });
      }
    },
    [dispatch]
  );

  /**
   * Clear discovery results
   */
  const clearResults = useCallback(() => {
    dispatch({ type: "SET_DISCOVERY_RESULTS", payload: [] });
  }, [dispatch]);

  /**
   * Refresh current results (refetch for selected place)
   */
  const refresh = useCallback(() => {
    if (state.selectedPlaceId && state.places.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selectedPlace = state.places.find((p: any) => p.id === state.selectedPlaceId);
      if (selectedPlace?.lat !== undefined && selectedPlace?.lng !== undefined) {
        fetchNearbyPlaces({
          lat: Number(selectedPlace.lat),
          lng: Number(selectedPlace.lng),
        });
      }
    }
  }, [state.selectedPlaceId, state.places, fetchNearbyPlaces]);

  // Auto-fetch when a place is selected
  useEffect(() => {
    if (state.selectedPlaceId && state.places.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selectedPlace = state.places.find((p: any) => p.id === state.selectedPlaceId);
      if (selectedPlace?.lat !== undefined && selectedPlace?.lng !== undefined) {
        fetchNearbyPlaces({
          lat: Number(selectedPlace.lat),
          lng: Number(selectedPlace.lng),
        });
      }
    }
  }, [state.selectedPlaceId, state.places, fetchNearbyPlaces]);

  return {
    isLoading: state.isLoadingDiscovery,
    results: state.discoveryResults,
    fetchNearbyPlaces,
    clearResults,
    refresh,
  };
}
