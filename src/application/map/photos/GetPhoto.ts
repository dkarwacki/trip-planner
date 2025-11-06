import { Effect } from "effect";
import { PhotoCache } from "@/infrastructure/map/cache";
import type { GetPhotoInput } from "./inputs";

export const GetPhoto = (input: GetPhotoInput) =>
  Effect.gen(function* () {
    const photoCache = yield* PhotoCache;

    const photoData = yield* photoCache.get({
      photoReference: input.photoReference,
      maxWidth: input.maxWidth,
    });

    return photoData;
  });
