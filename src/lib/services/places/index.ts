import { Effect } from "effect";
import type { Place } from "@/types";

// Tagged errors for better error handling
export class PlaceNotFoundError {
  readonly _tag = "PlaceNotFoundError";
  constructor(readonly query: string) {}
}

export class PlacesAPIError {
  readonly _tag = "PlacesAPIError";
  constructor(readonly message: string) {}
}

// Google Geocoding API response types
interface GeocodeResult {
  formatted_address: string;
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface GeocodeResponse {
  status: string;
  results: GeocodeResult[];
  error_message?: string;
}

// Google Place Details API response types
interface PlaceDetailsResult {
  place_id: string;
  formatted_address: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface PlaceDetailsResponse {
  status: string;
  result?: PlaceDetailsResult;
  error_message?: string;
}

/**
 * Search for a place using Google Geocoding API (server-side only)
 * @param query - Place name or address to search for
 * @param apiKey - Google Maps API key (server-side)
 * @returns Effect that resolves to a Place or fails with PlaceNotFoundError or PlacesAPIError
 */
export const searchPlace = (query: string, apiKey: string): Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError> =>
  Effect.gen(function* () {
    // Validate inputs
    if (!query.trim()) {
      return yield* Effect.fail(new PlaceNotFoundError(query));
    }

    if (!apiKey) {
      return yield* Effect.fail(new PlacesAPIError("API key is required"));
    }

    // Build API URL
    const encodedQuery = encodeURIComponent(query.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedQuery}&key=${apiKey}`;

    // Fetch from Google Geocoding API
    const response = yield* Effect.tryPromise({
      try: () => fetch(url),
      catch: (error) =>
        new PlacesAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
    });

    // Parse JSON response
    const data: GeocodeResponse = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new PlacesAPIError("Failed to parse API response"),
    });

    // Handle API status codes
    if (data.status === "ZERO_RESULTS") {
      return yield* Effect.fail(new PlaceNotFoundError(query));
    }

    if (data.status !== "OK") {
      const errorMessage = data.error_message || `Geocoding API error: ${data.status}`;
      return yield* Effect.fail(new PlacesAPIError(errorMessage));
    }

    // Validate results
    if (!data.results || data.results.length === 0) {
      return yield* Effect.fail(new PlaceNotFoundError(query));
    }

    // Extract first result
    const result = data.results[0];

    // Create Place object with unique ID
    const place: Place = {
      id: crypto.randomUUID(),
      name: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      placeId: result.place_id,
    };

    return place;
  });

/**
 * Get place details using Google Place Details API (server-side only)
 * @param placeId - Google Place ID
 * @param apiKey - Google Maps API key (server-side)
 * @returns Effect that resolves to a Place or fails with PlaceNotFoundError or PlacesAPIError
 */
export const getPlaceDetails = (
  placeId: string,
  apiKey: string
): Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError> =>
  Effect.gen(function* () {
    // Validate inputs
    if (!placeId.trim()) {
      return yield* Effect.fail(new PlaceNotFoundError(placeId));
    }

    if (!apiKey) {
      return yield* Effect.fail(new PlacesAPIError("API key is required"));
    }

    // Build API URL
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=place_id,name,formatted_address,geometry&key=${apiKey}`;

    // Fetch from Google Place Details API
    const response = yield* Effect.tryPromise({
      try: () => fetch(url),
      catch: (error) =>
        new PlacesAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
    });

    // Parse JSON response
    const data: PlaceDetailsResponse = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new PlacesAPIError("Failed to parse API response"),
    });

    // Handle API status codes
    if (data.status === "NOT_FOUND" || data.status === "ZERO_RESULTS") {
      return yield* Effect.fail(new PlaceNotFoundError(placeId));
    }

    if (data.status !== "OK") {
      const errorMessage = data.error_message || `Place Details API error: ${data.status}`;
      return yield* Effect.fail(new PlacesAPIError(errorMessage));
    }

    // Validate result
    if (!data.result) {
      return yield* Effect.fail(new PlaceNotFoundError(placeId));
    }

    const result = data.result;

    // Create Place object with unique ID
    const place: Place = {
      id: crypto.randomUUID(),
      name: result.name || result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      placeId: result.place_id,
    };

    return place;
  });
