/**
 * Hook to fetch nearby places (attractions and restaurants)
 * Implements Stage 3.5 of the UX implementation plan
 * 
 * Uses existing API endpoints from v1 with smart caching and parallel requests
 */

import { useEffect, useCallback } from 'react';
import { useMapState } from '../context';

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
  const fetchNearbyPlaces = useCallback(async (options: FetchNearbyOptions) => {
    const { lat, lng, radius = 5000 } = options;

    dispatch({ type: 'SET_LOADING_DISCOVERY', payload: true });

    try {
      // Parallel requests for attractions and restaurants
      const [attractionsResponse, restaurantsResponse] = await Promise.all([
        fetch(`/api/attractions/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
        fetch(`/api/restaurants/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
      ]);

      if (!attractionsResponse.ok || !restaurantsResponse.ok) {
        throw new Error('Failed to fetch nearby places');
      }

      const attractions = await attractionsResponse.json();
      const restaurants = await restaurantsResponse.json();

      // Combine and store results
      const allResults = [...attractions, ...restaurants];
      dispatch({ type: 'SET_DISCOVERY_RESULTS', payload: allResults });
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      dispatch({ type: 'SET_DISCOVERY_RESULTS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING_DISCOVERY', payload: false });
    }
  }, [dispatch]);

  /**
   * Clear discovery results
   */
  const clearResults = useCallback(() => {
    dispatch({ type: 'SET_DISCOVERY_RESULTS', payload: [] });
  }, [dispatch]);

  /**
   * Refresh current results (refetch for selected place)
   */
  const refresh = useCallback(() => {
    if (state.selectedPlaceId && state.places.length > 0) {
      const selectedPlace = state.places.find(p => p.id === state.selectedPlaceId);
      if (selectedPlace?.location) {
        fetchNearbyPlaces({
          lat: selectedPlace.location.lat,
          lng: selectedPlace.location.lng,
        });
      }
    }
  }, [state.selectedPlaceId, state.places, fetchNearbyPlaces]);

  // Auto-fetch when a place is selected
  useEffect(() => {
    if (state.selectedPlaceId && state.places.length > 0) {
      const selectedPlace = state.places.find(p => p.id === state.selectedPlaceId);
      if (selectedPlace?.location) {
        fetchNearbyPlaces({
          lat: selectedPlace.location.lat,
          lng: selectedPlace.location.lng,
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

