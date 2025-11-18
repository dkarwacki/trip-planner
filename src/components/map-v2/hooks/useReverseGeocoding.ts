import { Effect } from "effect";
import { useCallback, useState } from "react";
import { reverseGeocode } from "@/infrastructure/map/clients/geocoding";
import type { Place } from "@/domain/common/models";

export function useReverseGeocoding() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findPlace = useCallback(async (lat: number, lng: number): Promise<Place | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const program = reverseGeocode(lat, lng);
      // Use standard Effect.runPromise instead of importing custom runtime wrapper
      // The geocoding client just uses fetch and doesn't depend on the complex AppLayer runtime
      const result = await Effect.runPromise(program);
      return result;
    } catch (err) {
      // Effect errors are thrown as objects with _tag
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Failed to find place";

      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    findPlace,
    isLoading,
    error,
  };
}
