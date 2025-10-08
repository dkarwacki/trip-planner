import { Effect, Cache, Duration, Data, Layer, Context } from "effect";
import type { Attraction, AttractionScore } from "@/types";
import { PlaceId, Latitude, Longitude } from "@/types";
import { scoreAttractions, scoreRestaurants } from "./scoring";
import { ATTRACTION_TYPES, RESTAURANT_TYPES, BLOCKED_PLACE_TYPES } from "./constants";

export class NoAttractionsFoundError {
  readonly _tag = "NoAttractionsFoundError";
  constructor(readonly location: { lat: number; lng: number }) {}
}

export class AttractionsAPIError {
  readonly _tag = "AttractionsAPIError";
  constructor(readonly message: string) {}
}

interface ServerCacheKey {
  lat: number;
  lng: number;
  radius: number;
  apiKey: string;
}

// Define cache service tags
class AttractionsCache extends Context.Tag("AttractionsCache")<
  AttractionsCache,
  Cache.Cache<ServerCacheKey, Attraction[], NoAttractionsFoundError | AttractionsAPIError>
>() {}

class RestaurantsCache extends Context.Tag("RestaurantsCache")<
  RestaurantsCache,
  Cache.Cache<ServerCacheKey, Attraction[], NoAttractionsFoundError | AttractionsAPIError>
>() {}

// Create cache layers
const AttractionsCacheLayer = Layer.effect(
  AttractionsCache,
  Cache.make({
    capacity: 100,
    timeToLive: Duration.minutes(5),
    lookup: (key: ServerCacheKey) => fetchNearbyAttractionsUncached(key.lat, key.lng, key.radius, key.apiKey),
  })
);

const RestaurantsCacheLayer = Layer.effect(
  RestaurantsCache,
  Cache.make({
    capacity: 100,
    timeToLive: Duration.minutes(5),
    lookup: (key: ServerCacheKey) => fetchNearbyRestaurantsUncached(key.lat, key.lng, key.radius, key.apiKey),
  })
);

// Export layers for use in API endpoints
export { AttractionsCacheLayer, RestaurantsCacheLayer, AttractionsCache, RestaurantsCache };

interface PlaceResult {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  vicinity?: string;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
  };
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface NearbySearchResponse {
  status: string;
  results: PlaceResult[];
  error_message?: string;
}

const fetchNearbyAttractionsUncached = (
  lat: number,
  lng: number,
  radius: number,
  apiKey: string
): Effect.Effect<Attraction[], NoAttractionsFoundError | AttractionsAPIError> =>
  Effect.gen(function* () {
    if (!apiKey) {
      return yield* Effect.fail(new AttractionsAPIError("API key is required"));
    }

    if (radius < 100 || radius > 50000) {
      return yield* Effect.fail(new AttractionsAPIError("Radius must be between 100 and 50000 meters"));
    }

    const allAttractions: Attraction[] = [];
    const seenPlaceIds = new Set<string>();

    for (const type of ATTRACTION_TYPES) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;

      const response = yield* Effect.tryPromise({
        try: () => fetch(url),
        catch: (error) =>
          new AttractionsAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
      });

      const data: NearbySearchResponse = yield* Effect.tryPromise({
        try: () => response.json(),
        catch: () => new AttractionsAPIError("Failed to parse API response"),
      });

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        const errorMessage = data.error_message || `Places API error: ${data.status}`;
        return yield* Effect.fail(new AttractionsAPIError(errorMessage));
      }

      if (data.results && data.results.length > 0) {
        for (const result of data.results) {
          if (seenPlaceIds.has(result.place_id)) continue;

          if (result.types && result.types.some((type) => BLOCKED_PLACE_TYPES.has(type))) {
            const blockedType = result.types.find((type) => BLOCKED_PLACE_TYPES.has(type));
            yield* Effect.logDebug("Filtered out place due to blocked type", {
              place: result.name,
              blockedType,
            });
            continue;
          }

          if (!result.rating || !result.user_ratings_total || result.user_ratings_total < 10) {
            yield* Effect.logDebug("Filtered out place due to low ratings", {
              place: result.name,
              rating: result.rating,
              reviews: result.user_ratings_total,
            });
            continue;
          }

          if (!result.geometry?.location) {
            yield* Effect.logDebug("Filtered out place due to missing geometry", {
              place: result.name,
            });
            continue;
          }

          seenPlaceIds.add(result.place_id);

          const attraction: Attraction = {
            placeId: PlaceId(result.place_id),
            name: result.name,
            rating: result.rating,
            userRatingsTotal: result.user_ratings_total,
            types: result.types || [],
            vicinity: result.vicinity || "",
            priceLevel: result.price_level,
            openNow: result.opening_hours?.open_now,
            location: {
              lat: Latitude(result.geometry.location.lat),
              lng: Longitude(result.geometry.location.lng),
            },
          };

          allAttractions.push(attraction);
        }
      }
    }

    if (allAttractions.length === 0) {
      return yield* Effect.fail(new NoAttractionsFoundError({ lat, lng }));
    }

    return allAttractions;
  });

const fetchNearbyRestaurantsUncached = (
  lat: number,
  lng: number,
  radius: number,
  apiKey: string
): Effect.Effect<Attraction[], NoAttractionsFoundError | AttractionsAPIError> =>
  Effect.gen(function* () {
    if (!apiKey) {
      return yield* Effect.fail(new AttractionsAPIError("API key is required"));
    }

    if (radius < 100 || radius > 50000) {
      return yield* Effect.fail(new AttractionsAPIError("Radius must be between 100 and 50000 meters"));
    }

    const allRestaurants: Attraction[] = [];
    const seenPlaceIds = new Set<string>();

    for (const type of RESTAURANT_TYPES) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;

      const response = yield* Effect.tryPromise({
        try: () => fetch(url),
        catch: (error) =>
          new AttractionsAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
      });

      const data: NearbySearchResponse = yield* Effect.tryPromise({
        try: () => response.json(),
        catch: () => new AttractionsAPIError("Failed to parse API response"),
      });

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        const errorMessage = data.error_message || `Places API error: ${data.status}`;
        return yield* Effect.fail(new AttractionsAPIError(errorMessage));
      }

      if (data.results && data.results.length > 0) {
        for (const result of data.results) {
          if (seenPlaceIds.has(result.place_id)) continue;

          if (!result.rating || !result.user_ratings_total || result.user_ratings_total < 10) {
            yield* Effect.logDebug("Filtered out restaurant due to low ratings", {
              place: result.name,
              rating: result.rating,
              reviews: result.user_ratings_total,
            });
            continue;
          }

          if (!result.geometry?.location) {
            yield* Effect.logDebug("Filtered out restaurant due to missing geometry", {
              place: result.name,
            });
            continue;
          }

          seenPlaceIds.add(result.place_id);

          const restaurant: Attraction = {
            placeId: PlaceId(result.place_id),
            name: result.name,
            rating: result.rating,
            userRatingsTotal: result.user_ratings_total,
            types: result.types || [],
            vicinity: result.vicinity || "",
            priceLevel: result.price_level,
            openNow: result.opening_hours?.open_now,
            location: {
              lat: Latitude(result.geometry.location.lat),
              lng: Longitude(result.geometry.location.lng),
            },
          };

          allRestaurants.push(restaurant);
        }
      }
    }

    if (allRestaurants.length === 0) {
      return yield* Effect.fail(new NoAttractionsFoundError({ lat, lng }));
    }

    return allRestaurants;
  });

export const getTopAttractions = (
  lat: number,
  lng: number,
  apiKey: string,
  limit = 10
): Effect.Effect<AttractionScore[], NoAttractionsFoundError | AttractionsAPIError, AttractionsCache> =>
  Effect.gen(function* () {
    const cache = yield* AttractionsCache;
    const cacheKey = Data.struct({ lat, lng, radius: 1500, apiKey });
    const attractions = yield* cache.get(cacheKey);

    const scored = scoreAttractions(attractions);
    return scored.slice(0, limit);
  });

export const getTopRestaurants = (
  lat: number,
  lng: number,
  apiKey: string,
  limit = 10
): Effect.Effect<AttractionScore[], NoAttractionsFoundError | AttractionsAPIError, RestaurantsCache> =>
  Effect.gen(function* () {
    const cache = yield* RestaurantsCache;
    const cacheKey = Data.struct({ lat, lng, radius: 1500, apiKey });
    const restaurants = yield* cache.get(cacheKey);

    const scored = scoreRestaurants(restaurants);
    return scored.slice(0, limit);
  });
