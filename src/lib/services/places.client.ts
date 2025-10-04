import { Effect } from "effect";
import type { Place } from "@/types";

// Tagged errors (same as server-side for consistency)
export class PlaceNotFoundError {
  readonly _tag = "PlaceNotFoundError";
  constructor(readonly query: string) {}
}

export class PlacesAPIError {
  readonly _tag = "PlacesAPIError";
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
 * Search for a place by calling the backend API (client-side)
 * @param query - Place name or address to search for
 * @returns Effect that resolves to a Place or fails with PlaceNotFoundError or PlacesAPIError
 */
export const searchPlace = (query: string): Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError> =>
  Effect.gen(function* () {
    // Validate query
    if (!query.trim()) {
      return yield* Effect.fail(new PlaceNotFoundError(query));
    }

    // Call backend API
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch("/api/places/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: query.trim() }),
        }),
      catch: (error) =>
        new PlacesAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
    });

    // Parse response
    const data: APIResponse = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new PlacesAPIError("Failed to parse API response"),
    });

    // Handle error responses
    if (!data.success) {
      // Determine error type based on HTTP status
      if (response.status === 404) {
        return yield* Effect.fail(new PlaceNotFoundError(query));
      }
      return yield* Effect.fail(new PlacesAPIError(data.error || "Unknown error occurred"));
    }

    // Return the place
    return data.place;
  });
