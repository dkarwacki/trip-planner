import { Effect } from "effect";
import { PhotoCache } from "@/infrastructure/map/cache";
import type { GetPhotoCommandDTO } from "@/infrastructure/map/api";

export const GetPhoto = (input: GetPhotoCommandDTO) =>
  Effect.gen(function* () {
    const photoCache = yield* PhotoCache;

    const photoData = yield* photoCache.get({
      photoReference: input.photoReference,
      maxWidth: input.maxWidth,
    });

    return photoData;
  });
