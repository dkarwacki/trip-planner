import { Effect } from "effect";
import type { Place } from "@/types";

// Tagged errors (same as server-side for consistency)
export class NoResultsError {
  readonly _tag = "NoResultsError";
  constructor(
    readonly lat: number,
    readonly lng: number
  ) {}
}

export class GeocodingError {
  readonly _tag = "GeocodingError";
  constructor(readonly message: string) {}
}

// API response types
interface SuccessResponse {
  success: true;
  place: Place;
}

interface ErrorResponse {
  success: false;
  error: string;
}

type APIResponse = SuccessResponse | ErrorResponse;

/**
 * Reverse geocode coordinates by calling the backend API (client-side)
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @returns Effect that resolves to a Place or fails with NoResultsError or GeocodingError
 */
export const reverseGeocode = (lat: number, lng: number): Effect.Effect<Place, NoResultsError | GeocodingError> =>
  Effect.gen(function* () {
    // Validate coordinates
    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
      return yield* Effect.fail(new GeocodingError("Invalid coordinates"));
    }

    // Call backend API
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch("/api/geocoding/reverse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lat, lng }),
        }),
      catch: (error) =>
        new GeocodingError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
    });

    // Parse response
    const data: APIResponse = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new GeocodingError("Failed to parse API response"),
    });

    // Handle error responses
    if (!data.success) {
      // Determine error type based on HTTP status
      if (response.status === 404) {
        return yield* Effect.fail(new NoResultsError(lat, lng));
      }
      return yield* Effect.fail(new GeocodingError(data.error || "Unknown error occurred"));
    }

    // Return the place
    return data.place;
  });
