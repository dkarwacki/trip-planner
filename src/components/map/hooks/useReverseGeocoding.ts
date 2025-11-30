import { Effect } from "effect";
import { useCallback, useState } from "react";
import { reverseGeocode } from "@/infrastructure/map/clients/geocoding";

/**
 * Geocoding result for map search
 * Lightweight representation of a place from reverse geocoding
 */
export interface GeocodingResult {
  id: string;
  name: string; // Format: "city||country"
  lat: number;
  lng: number;
  photos?: {
    photoReference: string;
    width: number;
    height: number;
    attributions: string[];
  }[];
}

export function useReverseGeocoding() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findPlace = useCallback(async (lat: number, lng: number): Promise<GeocodingResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const program = reverseGeocode(lat, lng);
      // Use standard Effect.runPromise instead of importing custom runtime wrapper
      // The geocoding client just uses fetch and doesn't depend on the complex AppLayer runtime
      const domainPlace = await Effect.runPromise(program);

      // Convert domain Place to lightweight GeocodingResult
      // This keeps map components free from domain imports
      const result: GeocodingResult = {
        id: domainPlace.id,
        name: domainPlace.name,
        lat: domainPlace.lat,
        lng: domainPlace.lng,
        photos: domainPlace.photos,
      };

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
