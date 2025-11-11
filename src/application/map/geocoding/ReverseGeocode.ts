import { Effect } from "effect";
import { GoogleMapsClient } from "@/infrastructure/common/google-maps";
import type { ReverseGeocodeCommand } from "@/domain/map/models";

export const ReverseGeocode = (cmd: ReverseGeocodeCommand) =>
  Effect.gen(function* () {
    const googleMaps = yield* GoogleMapsClient;
    const place = yield* googleMaps.reverseGeocode(cmd.lat, cmd.lng);
    return place;
  });
