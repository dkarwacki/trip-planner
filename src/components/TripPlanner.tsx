import { useCallback, useEffect, useRef, useState } from "react";
import { APIProvider, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Effect } from "effect";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { searchPlace } from "@/lib/services/places.client";
import type { Place } from "@/types";
import { X } from "lucide-react";

interface TripPlannerProps {
  apiKey: string;
  mapId?: string;
}

const MapContent = ({ mapId }: { mapId?: string }) => {
  const map = useMap();
  const mapsLibrary = useMapsLibrary("maps");
  const markerLibrary = useMapsLibrary("marker");

  const [places, setPlaces] = useState<Place[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

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

  // Handle removing a place
  const handleRemovePlace = useCallback((placeId: string) => {
    setPlaces((prev) => prev.filter((p) => p.placeId !== placeId));
    if (selectedPlaceId === placeId) {
      setSelectedPlaceId(null);
    }
  }, [selectedPlaceId]);

  // Handle panning to a place
  const handlePanToPlace = useCallback((place: Place) => {
    if (!map) return;
    setSelectedPlaceId(place.placeId);
    map.panTo({ lat: place.lat, lng: place.lng });
    map.setZoom(14);
  }, [map]);

  // Manage markers lifecycle
  useEffect(() => {
    if (!map || !markerLibrary || places.length === 0) {
      // Clear existing markers if places are empty
      markersRef.current.forEach((marker) => (marker.map = null));
      markersRef.current = [];
      return;
    }

    // Map ID is required for AdvancedMarkerElement
    if (!mapId) {
      console.error("Map ID is required for AdvancedMarkerElement. Please set GOOGLE_MAPS_MAP_ID in your .env file.");
      return;
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => (marker.map = null));
    markersRef.current = [];

    // Create new markers for each place
    const newMarkers = places.map((place) => {
      const marker = new markerLibrary.AdvancedMarkerElement({
        map,
        position: { lat: place.lat, lng: place.lng },
        title: place.name,
      });

      // Add click listener to highlight the place
      marker.addListener("click", () => {
        setSelectedPlaceId(place.placeId);
      });

      return marker;
    });

    markersRef.current = newMarkers;

    // Fit map bounds to show all markers
    const bounds = new google.maps.LatLngBounds();
    places.forEach((place) => {
      bounds.extend({ lat: place.lat, lng: place.lng });
    });
    map.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 400 });

    // Cleanup on unmount
    return () => {
      markersRef.current.forEach((marker) => (marker.map = null));
      markersRef.current = [];
    };
  }, [map, markerLibrary, places, mapId]);

  return (
    <div className="flex h-screen">
      {/* Left Sidebar - Places List */}
      <div className="w-96 flex flex-col bg-white border-r shadow-sm">
        {/* Search Input */}
        <div className="p-4 border-b">
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

        {/* Places List */}
        <Card className="flex-1 m-4 flex flex-col rounded-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Places</span>
              <Badge variant="secondary">{places.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            {places.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground px-6 text-center">
                <p>No places added yet. Search for a place to get started.</p>
              </div>
            ) : (
              <ScrollArea className="h-full px-6 pb-6">
                <div className="space-y-2">
                  {places.map((place, index) => (
                    <div
                      key={place.placeId}
                      onClick={() => handlePanToPlace(place)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                        selectedPlaceId === place.placeId ? "bg-accent border-primary" : ""
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${place.name} on map`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handlePanToPlace(place);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{place.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePlace(place.placeId);
                          }}
                          className="ml-2 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={`Remove ${place.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Map */}
      <div className="flex-1">
        <Map
          defaultCenter={{ lat: 0, lng: 0 }}
          defaultZoom={2}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId={mapId}
        />
      </div>
    </div>
  );
};

export default function TripPlanner({ apiKey, mapId }: TripPlannerProps) {
  return (
    <APIProvider apiKey={apiKey}>
      <MapContent mapId={mapId} />
    </APIProvider>
  );
}
