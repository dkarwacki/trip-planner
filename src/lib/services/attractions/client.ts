import { Effect, Cache, Duration } from "effect";
import type { AttractionScore } from "@/types";

// Tagged errors
export class AttractionsAPIError {
  readonly _tag = "AttractionsAPIError";
  constructor(readonly message: string) {}
}

export class NoAttractionsFoundError {
  readonly _tag = "NoAttractionsFoundError";
  constructor(readonly location: { lat: number; lng: number }) {}
}

// Cache for attractions (5 minutes TTL)
const attractionsCache = Cache.make({
  capacity: 50,
  timeToLive: Duration.minutes(5),
  lookup: (key: { lat: number; lng: number }) => fetchNearbyAttractionsUncached(key.lat, key.lng),
});

// Cache for restaurants (5 minutes TTL)
const restaurantsCache = Cache.make({
  capacity: 50,
  timeToLive: Duration.minutes(5),
  lookup: (key: { lat: number; lng: number }) => fetchNearbyRestaurantsUncached(key.lat, key.lng),
});

// API response types
interface SuccessResponse {
  success: true;
  attractions: AttractionScore[];
}

interface ErrorResponse {
  success: false;
  error: string;
}

type APIResponse = SuccessResponse | ErrorResponse;

/**
 * Fetch top scored attractions from backend API (uncached)
 * Backend handles scoring logic
 */
const fetchNearbyAttractionsUncached = (
  lat: number,
  lng: number
): Effect.Effect<AttractionScore[], AttractionsAPIError> =>
  Effect.gen(function* () {
    // Call backend API (backend handles radius and scoring)
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch("/api/attractions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lat, lng }),
        }),
      catch: (error) =>
        new AttractionsAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
    });

    // Parse response
    const data: APIResponse = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new AttractionsAPIError("Failed to parse API response"),
    });

    // Handle error responses
    if (!data.success) {
      return yield* Effect.fail(new AttractionsAPIError(data.error || "Unknown error occurred"));
    }

    return data.attractions;
  });

/**
 * Fetch top scored restaurants from backend API (uncached)
 * Backend handles scoring logic
 */
const fetchNearbyRestaurantsUncached = (
  lat: number,
  lng: number
): Effect.Effect<AttractionScore[], AttractionsAPIError> =>
  Effect.gen(function* () {
    // Call backend API (backend handles radius and scoring)
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch("/api/restaurants", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lat, lng }),
        }),
      catch: (error) =>
        new AttractionsAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
    });

    // Parse response
    const data: APIResponse = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new AttractionsAPIError("Failed to parse API response"),
    });

    // Handle error responses
    if (!data.success) {
      return yield* Effect.fail(new AttractionsAPIError(data.error || "Unknown error occurred"));
    }

    return data.attractions;
  });

/**
 * Get top attractions for a location with caching (5-minute TTL)
 * Returns pre-scored results from backend API
 */
export const getTopAttractions = (
  lat: number,
  lng: number
): Effect.Effect<AttractionScore[], AttractionsAPIError | NoAttractionsFoundError> =>
  Effect.gen(function* () {
    // Fetch pre-scored attractions from backend (cached)
    const cache = yield* attractionsCache;
    const scoredAttractions = yield* cache.get({ lat, lng });

    // Check if we got results
    if (scoredAttractions.length === 0) {
      return yield* Effect.fail(new NoAttractionsFoundError({ lat, lng }));
    }

    return scoredAttractions;
  });

/**
 * Get top restaurants for a location with caching (5-minute TTL)
 * Returns pre-scored results from backend API
 */
export const getTopRestaurants = (
  lat: number,
  lng: number
): Effect.Effect<AttractionScore[], AttractionsAPIError | NoAttractionsFoundError> =>
  Effect.gen(function* () {
    // Fetch pre-scored restaurants from backend (cached)
    const cache = yield* restaurantsCache;
    const scoredRestaurants = yield* cache.get({ lat, lng });

    // Check if we got results
    if (scoredRestaurants.length === 0) {
      return yield* Effect.fail(new NoAttractionsFoundError({ lat, lng }));
    }

    return scoredRestaurants;
  });
