import { Effect } from "effect";
import { GoogleMapsClient } from "@/infrastructure/common/google-maps";
import type { ReverseGeocodeInput } from "./inputs";

export const ReverseGeocode = (input: ReverseGeocodeInput) =>
  Effect.gen(function* () {
    const googleMaps = yield* GoogleMapsClient;
    const place = yield* googleMaps.reverseGeocode(input.lat, input.lng);
    return place;
  });
