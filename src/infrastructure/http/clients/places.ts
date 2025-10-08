import { Effect } from "effect";
import type { Place } from "@/domain/models";

export class PlaceNotFoundError {
  readonly _tag = "PlaceNotFoundError";
  constructor(readonly query: string) {}
}

export class PlacesAPIError {
  readonly _tag = "PlacesAPIError";
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

export const searchPlace = (query: string): Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError> =>
  Effect.gen(function* () {
    if (!query.trim()) {
      return yield* Effect.fail(new PlaceNotFoundError(query));
    }

    const response = yield* Effect.tryPromise({
      try: () =>
        fetch("/api/places/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: query.trim() }),
        }),
      catch: (error) =>
        new PlacesAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
    });

    const data: APIResponse = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new PlacesAPIError("Failed to parse API response"),
    });

    if (!data.success) {
      if (response.status === 404) {
        return yield* Effect.fail(new PlaceNotFoundError(query));
      }
      return yield* Effect.fail(new PlacesAPIError(data.error || "Unknown error occurred"));
    }

    return data.place;
  });

export const getPlaceDetails = (placeId: string): Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError> =>
  Effect.gen(function* () {
    if (!placeId.trim()) {
      return yield* Effect.fail(new PlaceNotFoundError(placeId));
    }

    const response = yield* Effect.tryPromise({
      try: () =>
        fetch("/api/places/details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ placeId: placeId.trim() }),
        }),
      catch: (error) =>
        new PlacesAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
    });

    const data: APIResponse = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new PlacesAPIError("Failed to parse API response"),
    });

    if (!data.success) {
      if (response.status === 404) {
        return yield* Effect.fail(new PlaceNotFoundError(placeId));
      }
      return yield* Effect.fail(new PlacesAPIError(data.error || "Unknown error occurred"));
    }

    return data.place;
  });
