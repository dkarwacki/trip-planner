import { Effect } from "effect";
import { GoogleMapsClient } from "@/infrastructure/common/google-maps";
import type { ReverseGeocodeCommandDTO } from "@/infrastructure/map/api";

export const ReverseGeocode = (input: ReverseGeocodeCommandDTO) =>
  Effect.gen(function* () {
    const googleMaps = yield* GoogleMapsClient;
    const place = yield* googleMaps.reverseGeocode(input.lat, input.lng);
    return place;
  });
