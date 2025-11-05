import { Effect, Cache, Duration, Context, Layer } from "effect";
import type { Attraction } from "@/domain/map/models";
import { NoAttractionsFoundError, AttractionsAPIError } from "@/domain/map/errors";
import { GoogleMapsClient } from "@/infrastructure/common/google-maps";
import { ATTRACTION_TYPES } from "@/infrastructure/common/google-maps/constants";

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

    const cache: Cache.Cache<CacheKey, Attraction[], NoAttractionsFoundError | AttractionsAPIError> = yield* Cache.make(
      {
        capacity: 100,
        timeToLive: Duration.minutes(30),
        lookup: (key: CacheKey) =>
          Effect.gen(function* () {
            const result = yield* googleMaps.nearbySearch(key.lat, key.lng, key.radius, ATTRACTION_TYPES);
            return result;
          }).pipe(
            Effect.catchTag("MissingGoogleMapsAPIKeyError", () =>
              Effect.fail(new AttractionsAPIError("Google Maps API key is missing"))
            ),
            Effect.catchTag("AttractionsAPIError", (error) => Effect.fail(new AttractionsAPIError(error.message))),
            Effect.catchTag("NoAttractionsFoundError", (error) =>
              Effect.fail(new NoAttractionsFoundError(error.location, error.searchType))
            )
          ),
      }
    );

    return cache;
  })
);
