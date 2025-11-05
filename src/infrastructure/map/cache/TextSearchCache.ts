import { Effect, Cache, Duration, Context, Layer } from "effect";
import type { Attraction } from "@/domain/map/models";
import { AttractionNotFoundError, AttractionsAPIError } from "@/domain/map/errors";
import { GoogleMapsClient } from "@/infrastructure/common/google-maps";

interface CacheKey {
  query: string;
  includePhotos: boolean;
  requireRatings: boolean;
}

export class TextSearchCache extends Context.Tag("TextSearchCache")<
  TextSearchCache,
  Cache.Cache<CacheKey, Attraction, AttractionNotFoundError | AttractionsAPIError>
>() {}

export const TextSearchCacheLayer = Layer.effect(
  TextSearchCache,
  Effect.gen(function* () {
    const googleMaps = yield* GoogleMapsClient;

    const cache: Cache.Cache<CacheKey, Attraction, AttractionNotFoundError | AttractionsAPIError> = yield* Cache.make({
      capacity: 200, // Higher capacity since text searches are more varied
      timeToLive: Duration.minutes(60), // Longer TTL since place details don't change often
      lookup: (key: CacheKey) =>
        Effect.gen(function* () {
          const result = yield* googleMaps.textSearch(key.query, key.includePhotos, key.requireRatings);
          return result;
        }).pipe(
          Effect.catchTag("MissingGoogleMapsAPIKeyError", () =>
            Effect.fail(new AttractionsAPIError("Google Maps API key is missing"))
          ),
          Effect.catchTag("AttractionsAPIError", (error) => Effect.fail(new AttractionsAPIError(error.message))),
          Effect.catchTag("AttractionNotFoundError", (error) => Effect.fail(new AttractionNotFoundError(error.query)))
        ),
    });

    return cache;
  })
);
