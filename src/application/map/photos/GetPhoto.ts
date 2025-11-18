import { Effect } from "effect";
import { PhotoCache } from "@/infrastructure/map/cache";
import type { GetPhotoQuery } from "@/domain/map/models";

export const GetPhoto = (query: GetPhotoQuery) =>
  Effect.gen(function* () {
    yield* Effect.logDebug("Fetching photo", {
      photoReference: query.photoReference,
      maxWidth: query.maxWidth,
      lat: query.lat,
      lng: query.lng,
      placeName: query.placeName,
    });

    const photoCache = yield* PhotoCache;

    const photoData = yield* photoCache.get({
      photoReference: query.photoReference,
      maxWidth: query.maxWidth,
      lat: query.lat,
      lng: query.lng,
      placeName: query.placeName,
    });

    return photoData;
  });
