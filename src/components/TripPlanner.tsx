import { useCallback, useEffect, useRef, useState } from "react";
import { APIProvider, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Effect } from "effect";
import { Input } from "@/components/ui/input";
import { searchPlace } from "@/lib/services/places.client";
import type { Place } from "@/types";

interface TripPlannerProps {
  apiKey: string;
}

const MapContent = () => {
  const map = useMap();
  const mapsLibrary = useMapsLibrary("maps");

  const [places, setPlaces] = useState<Place[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const circlesRef = useRef<google.maps.Circle[]>([]);

  // Handle place search
  const handleSearch = useCallback(async () => {
    if (!inputValue.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const place = await Effect.runPromise(
        searchPlace(inputValue).pipe(
          Effect.catchAll((error) => {
            if (error._tag === "PlaceNotFoundError") {
              return Effect.fail(`No results found for "${error.query}"`);
            }
            if (error._tag === "PlacesAPIError") {
              return Effect.fail(error.message);
            }
            return Effect.fail("An unexpected error occurred");
          })
        )
      );

      // Check for duplicates by placeId
      const isDuplicate = places.some((p) => p.placeId === place.placeId);
      if (isDuplicate) {
        setError("This place has already been added");
        setIsLoading(false);
        return;
      }

      // Add place to array
      setPlaces((prev) => [...prev, place]);
      setInputValue("");
    } catch (err) {
      setError(typeof err === "string" ? err : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, places]);

  // Handle Enter key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !isLoading) {
        handleSearch();
      }
    },
    [handleSearch, isLoading]
  );

  // Manage circles lifecycle
  useEffect(() => {
    if (!map || !mapsLibrary || places.length === 0) return;

    // Clear existing circles
    circlesRef.current.forEach((circle) => circle.setMap(null));
    circlesRef.current = [];

    // Create new circles for each place
    const newCircles = places.map((place) => {
      return new mapsLibrary.Circle({
        map,
        center: { lat: place.lat, lng: place.lng },
        radius: 1000, // 1km radius
        strokeColor: "#22c55e",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#22c55e",
        fillOpacity: 0.35,
      });
    });

    circlesRef.current = newCircles;

    // Fit map bounds to show all circles
    const bounds = new google.maps.LatLngBounds();
    places.forEach((place) => {
      bounds.extend({ lat: place.lat, lng: place.lng });
    });
    map.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 100 });

    // Cleanup on unmount
    return () => {
      circlesRef.current.forEach((circle) => circle.setMap(null));
      circlesRef.current = [];
    };
  }, [map, mapsLibrary, places]);

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-white border-b shadow-sm">
        <Input
          type="text"
          placeholder="Enter place name..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-label="Search for a place"
          aria-invalid={!!error}
        />
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        {isLoading && <p className="text-sm text-muted-foreground mt-1">Searching...</p>}
      </div>
      <div className="flex-1 w-full">
        <Map defaultCenter={{ lat: 0, lng: 0 }} defaultZoom={2} gestureHandling="greedy" disableDefaultUI={false} />
      </div>
    </div>
  );
};

export default function TripPlanner({ apiKey }: TripPlannerProps) {
  return (
    <APIProvider apiKey={apiKey}>
      <MapContent />
    </APIProvider>
  );
}
