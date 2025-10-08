import { Effect, Cache, Duration, Context, Layer } from "effect";
import type { Attraction } from "@/domain/models";
import { NoAttractionsFoundError, AttractionsAPIError } from "@/domain/errors";
import { GoogleMapsClient } from "@/infrastructure/google-maps";
import { ATTRACTION_TYPES } from "@/infrastructure/google-maps/constants";

interface CacheKey {
  lat: number;
  lng: number;
  radius: number;
}

export class AttractionsCache extends Context.Tag("AttractionsCache")<
  AttractionsCache,
  Cache.Cache<CacheKey, Attraction[], NoAttractionsFoundError | AttractionsAPIError>
>() {}

export const AttractionsCacheLayer = Layer.effect(
  AttractionsCache,
  Effect.gen(function* () {
    const googleMaps = yield* GoogleMapsClient;

    const cache = yield* Cache.make({
      capacity: 100,
      timeToLive: Duration.minutes(5),
      lookup: (key: CacheKey) => googleMaps.nearbySearch(key.lat, key.lng, key.radius, ATTRACTION_TYPES),
    });

    return cache;
  })
);
