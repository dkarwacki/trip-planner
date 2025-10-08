import { Effect } from "effect";
import { GoogleMapsClient } from "@/infrastructure/google-maps";
import type { GetPlaceDetailsInput } from "./inputs";

export const GetPlaceDetails = (input: GetPlaceDetailsInput) =>
  Effect.gen(function* () {
    const googleMaps = yield* GoogleMapsClient;
    const place = yield* googleMaps.placeDetails(input.placeId);
    return place;
  });
