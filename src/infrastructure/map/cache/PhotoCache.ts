import { Effect, Cache, Duration, Context, Layer } from "effect";
import { MissingGoogleMapsAPIKeyError } from "@/domain/common/errors";
import { ConfigService } from "@/infrastructure/common/config";
import { incrementPhotoCallCount } from "@/infrastructure/common/google-maps/GoogleMapsClient";

export interface PhotoCacheKey {
  photoReference: string;
  maxWidth: number;
}

export interface PhotoData {
  data: Buffer;
  contentType: string;
}

export class PhotoCacheError {
  readonly _tag = "PhotoCacheError";
  constructor(readonly message: string) {}
}

export class PhotoCache extends Context.Tag("PhotoCache")<
  PhotoCache,
  Cache.Cache<PhotoCacheKey, PhotoData, PhotoCacheError | MissingGoogleMapsAPIKeyError>
>() {}

export const PhotoCacheLayer = Layer.effect(
  PhotoCache,
  Effect.gen(function* () {
    const config = yield* ConfigService;
    const isDev = config.isDev();

    const cache: Cache.Cache<PhotoCacheKey, PhotoData, PhotoCacheError | MissingGoogleMapsAPIKeyError> =
      yield* Cache.make({
        capacity: 500,
        timeToLive: Duration.days(7),
        lookup: (key: PhotoCacheKey) =>
          Effect.gen(function* () {
            incrementPhotoCallCount();

            // In dev mode, use placehold.co instead of Google Maps API
            if (isDev) {
              const width = key.maxWidth;
              const height = Math.round(width * 0.67); // 3:2 aspect ratio
              const placeholderUrl = `https://placehold.co/${width}x${height}/e2e8f0/475569/png?text=Photo`;

              const response = yield* Effect.tryPromise({
                try: () => fetch(placeholderUrl),
                catch: (error) =>
                  new PhotoCacheError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
              });

              if (!response.ok) {
                return yield* Effect.fail(
                  new PhotoCacheError(`Failed to fetch placeholder photo: ${response.status} ${response.statusText}`)
                );
              }

              const arrayBuffer = yield* Effect.tryPromise({
                try: () => response.arrayBuffer(),
                catch: () => new PhotoCacheError("Failed to read photo data"),
              });

              const contentType = response.headers.get("content-type") || "image/png";

              const photoData: PhotoData = {
                data: Buffer.from(arrayBuffer),
                contentType,
              };

              return photoData;
            }

            // Production: use Google Maps API
            const apiKey = yield* config.getGoogleMapsApiKey();
            const url = `https://places.googleapis.com/v1/${key.photoReference}/media?maxWidthPx=${key.maxWidth}&key=${apiKey}`;

            const response = yield* Effect.tryPromise({
              try: () => fetch(url),
              catch: (error) =>
                new PhotoCacheError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
            });

            if (!response.ok) {
              return yield* Effect.fail(
                new PhotoCacheError(`Failed to fetch photo: ${response.status} ${response.statusText}`)
              );
            }

            const arrayBuffer = yield* Effect.tryPromise({
              try: () => response.arrayBuffer(),
              catch: () => new PhotoCacheError("Failed to read photo data"),
            });

            const contentType = response.headers.get("content-type") || "image/jpeg";

            const photoData: PhotoData = {
              data: Buffer.from(arrayBuffer),
              contentType,
            };

            return photoData;
          }),
      });

    return cache;
  })
);
