/**
 * Hook to fetch nearby places (attractions and restaurants)
 * Implements Stage 3.5 of the UX implementation plan
 *
 * Uses existing API endpoints from v1 with smart caching and parallel requests
 */

import { useCallback, useEffect, useMemo } from "react";
import { useMapStore } from "../stores/mapStore";
import { NEARBY_SEARCH_RADIUS_METERS } from "@/lib/map-v2/search-constants";

interface FetchNearbyOptions {
  lat: number;
  lng: number;
  radius?: number; // in meters, defaults to NEARBY_SEARCH_RADIUS_METERS
  append?: boolean; // if true, add to existing results instead of replacing
}

export function useNearbyPlaces() {
  // Selectors
  const selectedPlaceId = useMapStore((state) => state.selectedPlaceId);

  // Select lat and lng separately to avoid creating new object references
  const selectedPlaceLat = useMapStore((state) => {
    if (!state.selectedPlaceId) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectedPlace = state.places.find((p: any) => p.id === state.selectedPlaceId);
    return selectedPlace?.lat ? Number(selectedPlace.lat) : null;
  });

  const selectedPlaceLng = useMapStore((state) => {
    if (!state.selectedPlaceId) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectedPlace = state.places.find((p: any) => p.id === state.selectedPlaceId);
    return selectedPlace?.lng ? Number(selectedPlace.lng) : null;
  });

  // Create stable location object only when lat/lng values actually change
  const selectedPlaceLocation = useMemo(() => {
    if (selectedPlaceLat === null || selectedPlaceLng === null) return null;
    return { lat: selectedPlaceLat, lng: selectedPlaceLng };
  }, [selectedPlaceLat, selectedPlaceLng]);

  const isLoadingDiscovery = useMapStore((state) => state.isLoadingDiscovery);
  const discoveryResults = useMapStore((state) => state.discoveryResults);

  // Actions
  const setLoadingDiscovery = useMapStore((state) => state.setLoadingDiscovery);
  const setDiscoveryResults = useMapStore((state) => state.setDiscoveryResults);
  const addDiscoveryResults = useMapStore((state) => state.addDiscoveryResults);
  const addSearchCenter = useMapStore((state) => state.addSearchCenter);

  /**
   * Fetch nearby places for a given location
   * Fetches both attractions and restaurants in parallel
   */
  const fetchNearbyPlaces = useCallback(
    async (options: FetchNearbyOptions) => {
      const { lat, lng, radius = NEARBY_SEARCH_RADIUS_METERS, append = false } = options;

      setLoadingDiscovery(true);

      try {
        // Parallel POST requests for attractions and restaurants
        // Handle each independently so one failure doesn't block the other
        const [attractionsResult, restaurantsResult] = await Promise.allSettled([
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
          }).then(async (response) => {
            if (!response.ok) {
              throw new Error("Failed to fetch attractions");
            }
            return response.json();
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
          }).then(async (response) => {
            if (!response.ok) {
              throw new Error("Failed to fetch restaurants");
            }
            return response.json();
          }),
        ]);

        // Extract attractions if successful
        const attractions = attractionsResult.status === "fulfilled" ? attractionsResult.value.attractions || [] : [];

        // Extract restaurants if successful
        const restaurants = restaurantsResult.status === "fulfilled" ? restaurantsResult.value.restaurants || [] : [];

        // Combine results (even if one failed, we still show what we got)
        const allResults = [...attractions, ...restaurants];

        // Either append to existing results or replace them
        if (append) {
          addDiscoveryResults(allResults);
        } else {
          setDiscoveryResults(allResults);
        }

        // Add this search center to the list of searched areas
        addSearchCenter({ lat, lng });
      } catch {
        // On error, only clear results if we're replacing (not appending)
        if (!append) {
          setDiscoveryResults([]);
        }
      } finally {
        setLoadingDiscovery(false);
      }
    },
    [setLoadingDiscovery, setDiscoveryResults, addDiscoveryResults, addSearchCenter]
  );

  /**
   * Clear discovery results
   */
  const clearResults = useCallback(() => {
    setDiscoveryResults([]);
  }, [setDiscoveryResults]);

  /**
   * Refresh current results (refetch for selected place)
   */
  const refresh = useCallback(() => {
    if (selectedPlaceLocation) {
      fetchNearbyPlaces({
        lat: selectedPlaceLocation.lat,
        lng: selectedPlaceLocation.lng,
      });
    }
  }, [selectedPlaceLocation, fetchNearbyPlaces]);

  // Auto-fetch when a place is selected or its location changes
  // Note: This will NOT trigger when attractions/restaurants are added to the place
  useEffect(() => {
    if (selectedPlaceLocation) {
      fetchNearbyPlaces({
        lat: selectedPlaceLocation.lat,
        lng: selectedPlaceLocation.lng,
      });
    }
  }, [selectedPlaceLocation, fetchNearbyPlaces]);

  return {
    isLoading: isLoadingDiscovery,
    results: discoveryResults,
    fetchNearbyPlaces,
    clearResults,
    refresh,
  };
}
