import { Effect } from "effect";
import { GoogleMapsClient } from "@/infrastructure/google-maps";
import type { SearchPlaceInput } from "./inputs";

export const SearchPlace = (input: SearchPlaceInput) =>
  Effect.gen(function* () {
    const googleMaps = yield* GoogleMapsClient;
    const place = yield* googleMaps.geocode(input.query);
    return place;
  });
