/**
 * Hook for Google Places Autocomplete functionality
 * Provides debounced place search with suggestions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useDebouncedCallback } from '@/components/hooks/useDebouncedCallback';

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface UsePlaceAutocompleteOptions {
  debounceMs?: number;
  types?: string[];
}

export function usePlaceAutocomplete(options: UsePlaceAutocompleteOptions = {}) {
  const { debounceMs = 300, types } = options;
  
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const placesLibrary = useMapsLibrary('places');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch predictions from Google Places Autocomplete API
  const fetchPredictionsImpl = useCallback(
    async (input: string) => {
      if (!input.trim() || !placesLibrary) {
        setSuggestions([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const PlacesLib = placesLibrary as typeof google.maps.places;
        const request: google.maps.places.AutocompleteRequest = {
          input: input.trim(),
          ...(types && { types }), // Only include types if provided
        };

        const { suggestions: autocompleteSuggestions } =
          await PlacesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (autocompleteSuggestions && autocompleteSuggestions.length > 0) {
          const formattedSuggestions: PlaceSuggestion[] = autocompleteSuggestions
            .filter((suggestion) => suggestion.placePrediction)
            .map((suggestion) => {
              const prediction = suggestion.placePrediction;
              if (!prediction) {
                return null;
              }
              return {
                placeId: prediction.placeId,
                description: prediction.text.text,
                mainText: prediction.mainText?.text || prediction.text.text,
                secondaryText: prediction.secondaryText?.text || '',
              };
            })
            .filter((suggestion): suggestion is PlaceSuggestion => suggestion !== null);

          setSuggestions(formattedSuggestions.slice(0, 8)); // Limit to 8 results
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('[usePlaceAutocomplete] Error fetching predictions:', err);
        setError('Failed to fetch suggestions');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [placesLibrary, types]
  );

  const [debouncedFetchPredictions] = useDebouncedCallback(
    fetchPredictionsImpl as (...args: unknown[]) => void,
    debounceMs
  );

  // Fetch detailed place information
  const fetchPlaceDetails = useCallback(
    async (placeId: string): Promise<PlaceDetails | null> => {
      if (!placesLibrary) {
        setError('Places library not loaded');
        return null;
      }

      try {
        const PlacesLib = placesLibrary as typeof google.maps.places;

        // Create a Place instance from the placeId
        const place = new PlacesLib.Place({
          id: placeId,
        });

        // Fetch the fields we need
        await place.fetchFields({
          fields: ['id', 'displayName', 'formattedAddress', 'location'],
        });

        if (!place.id || !place.location) {
          setError('Incomplete place data');
          return null;
        }

        // Extract lat/lng from LatLng object (methods, not properties)
        const lat = typeof place.location.lat === 'function' 
          ? place.location.lat() 
          : place.location.lat;
        const lng = typeof place.location.lng === 'function' 
          ? place.location.lng() 
          : place.location.lng;

        return {
          placeId: place.id,
          name: place.displayName || 'Unknown',
          formattedAddress: place.formattedAddress || '',
          location: {
            lat,
            lng,
          },
        };
      } catch (err) {
        console.error('[usePlaceAutocomplete] Error fetching place details:', err);
        setError('Failed to fetch place details');
        return null;
      }
    },
    [placesLibrary]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoize clearSuggestions to prevent infinite loops in dependent components
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    searchPlaces: debouncedFetchPredictions as (input: string) => void,
    fetchPlaceDetails,
    clearSuggestions,
    clearError,
  };
}

