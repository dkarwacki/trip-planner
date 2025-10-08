import { Effect } from "effect";
import type { Place } from "@/types";
import { PlaceId, Latitude, Longitude } from "@/types";

export class PlaceNotFoundError {
  readonly _tag = "PlaceNotFoundError";
  constructor(readonly query: string) {}
}

export class PlacesAPIError {
  readonly _tag = "PlacesAPIError";
  constructor(readonly message: string) {}
}

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

export const searchPlace = (query: string, apiKey: string): Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError> =>
  Effect.gen(function* () {
    if (!query.trim()) {
      return yield* Effect.fail(new PlaceNotFoundError(query));
    }

    if (!apiKey) {
      return yield* Effect.fail(new PlacesAPIError("API key is required"));
    }

    const encodedQuery = encodeURIComponent(query.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedQuery}&key=${apiKey}`;

    const response = yield* Effect.tryPromise({
      try: () => fetch(url),
      catch: (error) =>
        new PlacesAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
    });

    const data: GeocodeResponse = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new PlacesAPIError("Failed to parse API response"),
    });

    if (data.status === "ZERO_RESULTS") {
      return yield* Effect.fail(new PlaceNotFoundError(query));
    }

    if (data.status !== "OK") {
      const errorMessage = data.error_message || `Geocoding API error: ${data.status}`;
      return yield* Effect.fail(new PlacesAPIError(errorMessage));
    }

    if (!data.results || data.results.length === 0) {
      return yield* Effect.fail(new PlaceNotFoundError(query));
    }

    const result = data.results[0];

    const place: Place = {
      id: crypto.randomUUID(),
      name: result.formatted_address,
      lat: Latitude(result.geometry.location.lat),
      lng: Longitude(result.geometry.location.lng),
      placeId: PlaceId(result.place_id),
    };

    return place;
  });

export const getPlaceDetails = (
  placeId: string,
  apiKey: string
): Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError> =>
  Effect.gen(function* () {
    if (!placeId.trim()) {
      return yield* Effect.fail(new PlaceNotFoundError(placeId));
    }

    if (!apiKey) {
      return yield* Effect.fail(new PlacesAPIError("API key is required"));
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=place_id,name,formatted_address,geometry&key=${apiKey}`;

    const response = yield* Effect.tryPromise({
      try: () => fetch(url),
      catch: (error) =>
        new PlacesAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
    });

    const data: PlaceDetailsResponse = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new PlacesAPIError("Failed to parse API response"),
    });

    if (data.status === "NOT_FOUND" || data.status === "ZERO_RESULTS") {
      return yield* Effect.fail(new PlaceNotFoundError(placeId));
    }

    if (data.status !== "OK") {
      const errorMessage = data.error_message || `Place Details API error: ${data.status}`;
      return yield* Effect.fail(new PlacesAPIError(errorMessage));
    }

    if (!data.result) {
      return yield* Effect.fail(new PlaceNotFoundError(placeId));
    }

    const result = data.result;

    const place: Place = {
      id: crypto.randomUUID(),
      name: result.name || result.formatted_address,
      lat: Latitude(result.geometry.location.lat),
      lng: Longitude(result.geometry.location.lng),
      placeId: PlaceId(result.place_id),
    };

    return place;
  });
