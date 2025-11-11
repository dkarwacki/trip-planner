import { Effect } from "effect";
import { GoogleMapsClient } from "@/infrastructure/common/google-maps";
import type { SearchPlaceQuery } from "@/domain/map/models";

export const SearchPlace = (query: SearchPlaceQuery) =>
  Effect.gen(function* () {
    const googleMaps = yield* GoogleMapsClient;
    const place = yield* googleMaps.geocode(query.query);
    return place;
  });
