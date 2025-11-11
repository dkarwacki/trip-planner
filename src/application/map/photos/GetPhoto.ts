import { Effect } from "effect";
import { PhotoCache } from "@/infrastructure/map/cache";
import type { GetPhotoQuery } from "@/domain/map/models";

export const GetPhoto = (query: GetPhotoQuery) =>
  Effect.gen(function* () {
    const photoCache = yield* PhotoCache;

    const photoData = yield* photoCache.get({
      photoReference: query.photoReference,
      maxWidth: query.maxWidth,
    });

    return photoData;
  });
