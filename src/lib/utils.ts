import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Effect } from "effect";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export class MissingGoogleMapsAPIKeyError {
  readonly _tag = "MissingGoogleMapsAPIKeyError";
}

export const getGoogleMapsApiKey = (): Effect.Effect<string, MissingGoogleMapsAPIKeyError> =>
  Effect.gen(function* () {
    const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY as string | undefined;

    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.error("GOOGLE_MAPS_API_KEY is not configured");
      return yield* Effect.fail(new MissingGoogleMapsAPIKeyError());
    }

    return apiKey;
  });
