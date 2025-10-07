import { Effect } from "effect";
import type { Place } from "@/types";

export class NoResultsError {
  readonly _tag = "NoResultsError";
  constructor(
    readonly lat: number,
    readonly lng: number
  ) {}
}

export class GeocodingError {
  readonly _tag = "GeocodingError";
  constructor(readonly message: string) {}
}

interface SuccessResponse {
  success: true;
  place: Place;
}

interface ErrorResponse {
  success: false;
  error: string;
}

type APIResponse = SuccessResponse | ErrorResponse;

export const reverseGeocode = (lat: number, lng: number): Effect.Effect<Place, NoResultsError | GeocodingError> =>
  Effect.gen(function* () {
    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
      return yield* Effect.fail(new GeocodingError("Invalid coordinates"));
    }

    const response = yield* Effect.tryPromise({
      try: () =>
        fetch("/api/geocoding/reverse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lat, lng }),
        }),
      catch: (error) =>
        new GeocodingError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
    });

    const data: APIResponse = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new GeocodingError("Failed to parse API response"),
    });

    if (!data.success) {
      if (response.status === 404) {
        return yield* Effect.fail(new NoResultsError(lat, lng));
      }
      return yield* Effect.fail(new GeocodingError(data.error || "Unknown error occurred"));
    }

    return data.place;
  });
