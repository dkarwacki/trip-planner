import { Effect } from "effect";
import { GoogleMapsClient } from "@/infrastructure/common/google-maps";
import type { SearchPlaceCommandDTO } from "@/infrastructure/map/api";

export const SearchPlace = (input: SearchPlaceCommandDTO) =>
  Effect.gen(function* () {
    const googleMaps = yield* GoogleMapsClient;
    const place = yield* googleMaps.geocode(input.query);
    return place;
  });
