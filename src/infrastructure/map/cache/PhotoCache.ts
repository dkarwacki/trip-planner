import { Effect, Cache, Duration, Context, Layer } from "effect";
import { MissingGoogleMapsAPIKeyError } from "@/domain/common/errors";
import { ConfigService } from "@/infrastructure/common/config";
import { incrementPhotoCallCount } from "@/infrastructure/common/google-maps/GoogleMapsClient";
import { WikimediaClient } from "@/infrastructure/common/wikimedia";

export interface PhotoCacheKey {
  photoReference: string;
  lat: number;
  lng: number;
  placeName: string;
}

// Always fetch photos at max size and let browser scale down
const MAX_PHOTO_WIDTH = 1600;

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
    const wikimediaClient = yield* WikimediaClient;

    const cache: Cache.Cache<PhotoCacheKey, PhotoData, PhotoCacheError | MissingGoogleMapsAPIKeyError> =
      yield* Cache.make({
        capacity: 500,
        timeToLive: Duration.days(7),
        lookup: (key: PhotoCacheKey) =>
          Effect.gen(function* () {
            // Try Wikimedia first, then fallback to Google Maps
            const tryWikimedia = Effect.gen(function* () {
              // Search for photos near the location
              const photos = yield* wikimediaClient.searchPhotosByLocation(key.lat, key.lng, 1000, key.placeName).pipe(
                Effect.mapError((error) => {
                  if ("_tag" in error && error._tag === "NoWikimediaPhotosFoundError") {
                    return new PhotoCacheError("No Wikimedia photos found");
                  }
                  if ("_tag" in error && error._tag === "WikimediaAPIError") {
                    return new PhotoCacheError(`Wikimedia API error: ${error.message}`);
                  }
                  return new PhotoCacheError(`Wikimedia error: ${String(error)}`);
                })
              );

              if (photos.length === 0) {
                return yield* Effect.fail(new PhotoCacheError("No Wikimedia photos found"));
              }

              // Use the first photo found
              const photoUrl = photos[0].photoReference;

              const response = yield* Effect.tryPromise({
                try: () => fetch(photoUrl),
                catch: (error) =>
                  new PhotoCacheError(
                    `Wikimedia fetch error: ${error instanceof Error ? error.message : "Unknown error"}`
                  ),
              });

              if (!response.ok) {
                return yield* Effect.fail(
                  new PhotoCacheError(`Wikimedia fetch failed: ${response.status} ${response.statusText}`)
                );
              }

              const arrayBuffer = yield* Effect.tryPromise({
                try: () => response.arrayBuffer(),
                catch: () => new PhotoCacheError("Failed to read Wikimedia photo data"),
              });

              const contentType = response.headers.get("content-type") || "image/jpeg";

              return {
                data: Buffer.from(arrayBuffer),
                contentType,
              };
            });

            // Fallback to Google Maps API
            const tryGoogleMaps = Effect.gen(function* () {
              incrementPhotoCallCount();
              const apiKey = yield* config.getGoogleMapsApiKey();
              const googleMapsUrl = `https://places.googleapis.com/v1/${key.photoReference}/media?maxWidthPx=${MAX_PHOTO_WIDTH}&key=${apiKey}`;

              const response = yield* Effect.tryPromise({
                try: () => fetch(googleMapsUrl),
                catch: (error) =>
                  new PhotoCacheError(
                    `Google Maps network error: ${error instanceof Error ? error.message : "Unknown error"}`
                  ),
              });

              if (!response.ok) {
                return yield* Effect.fail(
                  new PhotoCacheError(`Failed to fetch Google Maps photo: ${response.status} ${response.statusText}`)
                );
              }

              const arrayBuffer = yield* Effect.tryPromise({
                try: () => response.arrayBuffer(),
                catch: () => new PhotoCacheError("Failed to read Google Maps photo data"),
              });

              const contentType = response.headers.get("content-type") || "image/jpeg";

              return {
                data: Buffer.from(arrayBuffer),
                contentType,
              };
            });

            const placeholderPhoto = Effect.gen(function* () {
              const width = MAX_PHOTO_WIDTH;
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
            });

            // Try Wikimedia first, fallback to Google Maps on any error
            const result = yield* tryWikimedia.pipe(
              Effect.catchAll(() =>
                Effect.gen(function* () {
                  return yield* placeholderPhoto;
                })
              )
            );

            return result;
          }),
      });

    return cache;
  })
);
