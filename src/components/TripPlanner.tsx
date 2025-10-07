import { useCallback, useEffect, useRef, useState } from "react";
import { APIProvider, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Effect } from "effect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getPlaceDetails } from "@/lib/services/places/client";
import { fetchTopAttractions, fetchTopRestaurants } from "@/lib/services/attractions/client";
import { reverseGeocode } from "@/lib/services/geocoding/client";
import type { Place, AttractionScore } from "@/types";
import { X } from "lucide-react";
import AttractionsPanel from "@/components/AttractionsPanel";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";
import { Button } from "@/components/ui/button";

type CategoryTab = "attractions" | "restaurants";

interface TripPlannerProps {
  apiKey: string;
  mapId?: string;
}

const MapContent = ({ mapId }: { mapId?: string }) => {
  const map = useMap();
  const markerLibrary = useMapsLibrary("marker");

  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const [attractions, setAttractions] = useState<AttractionScore[]>([]);
  const [isLoadingAttractions, setIsLoadingAttractions] = useState(false);
  const [attractionsError, setAttractionsError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const [restaurants, setRestaurants] = useState<AttractionScore[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState<string | null>(null);

  const [loadedTabs, setLoadedTabs] = useState<Set<CategoryTab>>(new Set(["attractions"]));
  const [activeTab, setActiveTab] = useState<CategoryTab>("attractions");
  const [hoveredAttractionId, setHoveredAttractionId] = useState<string | null>(null);

  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showAddPlacePopover, setShowAddPlacePopover] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  interface MarkerData {
    marker: google.maps.marker.AdvancedMarkerElement;
    element: HTMLDivElement;
  }

  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const attractionMarkersRef = useRef<Map<string, MarkerData> | null>(null);
  const tempMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const handlePlaceSelect = useCallback(
    async (place: google.maps.places.PlaceResult) => {
      if (!place.place_id) return;

      setIsLoading(true);
      setError(null);

      try {
        const placeDetails = await Effect.runPromise(
          getPlaceDetails(place.place_id).pipe(
            Effect.catchAll((error) => {
              if (error._tag === "PlaceNotFoundError") {
                return Effect.fail(`No details found for this place`);
              }
              if (error._tag === "PlacesAPIError") {
                return Effect.fail(error.message);
              }
              return Effect.fail("An unexpected error occurred");
            })
          )
        );

        const isDuplicate = places.some((p) => p.placeId === placeDetails.placeId);
        if (isDuplicate) {
          setError("This place has already been added");
          setIsLoading(false);
          return;
        }

        setPlaces((prev) => [...prev, placeDetails]);
      } catch (err) {
        setError(typeof err === "string" ? err : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [places]
  );

  const handleRemovePlace = useCallback(
    (placeId: string) => {
      setPlaces((prev) => prev.filter((p) => p.placeId !== placeId));
      if (selectedPlaceId === placeId) {
        setSelectedPlaceId(null);
        setSelectedPlace(null);
        setAttractions([]);
        setAttractionsError(null);
        setRestaurants([]);
        setRestaurantsError(null);
        setLoadedTabs(new Set(["attractions"]));
        setActiveTab("attractions");
      }
    },
    [selectedPlaceId]
  );

  const handlePanToPlace = useCallback(
    async (place: Place) => {
      if (!map) return;
      setSelectedPlaceId(place.placeId);
      setSelectedPlace(place);
      map.panTo({ lat: place.lat, lng: place.lng });
      map.setZoom(14);

      setAttractions([]);
      setAttractionsError(null);
      setRestaurants([]);
      setRestaurantsError(null);
      setLoadedTabs(new Set(["attractions"]));
      setActiveTab("attractions");

      setIsLoadingAttractions(true);

      try {
        const attractionsResult = await fetchTopAttractions(place.lat, place.lng);

        setAttractions(attractionsResult);
      } catch (err) {
        setAttractionsError(err instanceof Error ? err.message : "Failed to load attractions");
      } finally {
        setIsLoadingAttractions(false);
      }
    },
    [map]
  );

  const handleCloseAttractions = useCallback(() => {
    setSelectedPlace(null);
    setSelectedPlaceId(null);
    setAttractions([]);
    setAttractionsError(null);
    setRestaurants([]);
    setRestaurantsError(null);
    setLoadedTabs(new Set(["attractions"]));
    setActiveTab("attractions");
  }, []);

  const handleTabChange = useCallback(
    async (tab: CategoryTab) => {
      if (!selectedPlace) return;

      setActiveTab(tab);

      if (loadedTabs.has(tab)) return;

      setLoadedTabs((prev) => new Set([...prev, tab]));

      if (tab === "restaurants") {
        setIsLoadingRestaurants(true);
        setRestaurantsError(null);

        try {
          const restaurantsResult = await fetchTopRestaurants(selectedPlace.lat, selectedPlace.lng);

          setRestaurants(restaurantsResult);
        } catch (err) {
          setRestaurantsError(err instanceof Error ? err.message : "Failed to load restaurants");
        } finally {
          setIsLoadingRestaurants(false);
        }
      }
    },
    [selectedPlace, loadedTabs]
  );

  const handleClosePopover = useCallback(() => {
    setClickedLocation(null);
    setShowAddPlacePopover(false);
    setGeocodingError(null);
    setIsReverseGeocoding(false);

    if (tempMarkerRef.current) {
      tempMarkerRef.current.map = null;
      tempMarkerRef.current = null;
    }
  }, []);

  const handleAddPlace = useCallback(async () => {
    if (!clickedLocation) return;

    setIsReverseGeocoding(true);
    setGeocodingError(null);

    try {
      const place = await Effect.runPromise(
        reverseGeocode(clickedLocation.lat, clickedLocation.lng).pipe(
          Effect.catchAll((error) => {
            if (error._tag === "NoResultsError") {
              return Effect.fail("No address found for this location");
            }
            if (error._tag === "GeocodingError") {
              return Effect.fail(error.message);
            }
            return Effect.fail("An unexpected error occurred");
          })
        )
      );

      const isDuplicate = places.some((p) => p.placeId === place.placeId);
      if (isDuplicate) {
        setGeocodingError("This place has already been added");
        setIsReverseGeocoding(false);
        return;
      }

      setPlaces((prev) => [...prev, place]);

      handleClosePopover();
    } catch (err) {
      setGeocodingError(typeof err === "string" ? err : "An error occurred");
      setIsReverseGeocoding(false);
    }
  }, [clickedLocation, places, handleClosePopover]);

  useEffect(() => {
    if (!map || !markerLibrary || places.length === 0) {
      markersRef.current.forEach((marker) => (marker.map = null));
      markersRef.current = [];
      return;
    }

    if (!mapId) {
      return;
    }

    markersRef.current.forEach((marker) => (marker.map = null));
    markersRef.current = [];

    const newMarkers = places.map((place) => {
      const marker = new markerLibrary.AdvancedMarkerElement({
        map,
        position: { lat: place.lat, lng: place.lng },
        title: place.name,
      });

      marker.addListener("click", () => {
        setSelectedPlaceId(place.placeId);
      });

      return marker;
    });

    markersRef.current = newMarkers;

    if (places.length === 1) {
      map.panTo({ lat: places[0].lat, lng: places[0].lng });
      map.setZoom(14);
    } else {
      const bounds = new google.maps.LatLngBounds();
      places.forEach((place) => {
        bounds.extend({ lat: place.lat, lng: place.lng });
      });
      map.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 400 });
    }

    return () => {
      markersRef.current.forEach((marker) => (marker.map = null));
      markersRef.current = [];
    };
  }, [map, markerLibrary, places, mapId]);

  useEffect(() => {
    if (!attractionMarkersRef.current) {
      attractionMarkersRef.current = new globalThis.Map();
    }
    const markersMap = attractionMarkersRef.current;

    markersMap.forEach(({ marker }) => (marker.map = null));
    markersMap.clear();

    if (!map || !markerLibrary || !selectedPlace || !mapId) return;

    const data = activeTab === "attractions" ? attractions : restaurants;
    if (data.length === 0) return;

    const iconColor = activeTab === "attractions" ? "#3B82F6" : "#EF4444";

    data.forEach((scored) => {
      const { attraction } = scored;

      const pinElement = document.createElement("div");
      pinElement.style.width = "12px";
      pinElement.style.height = "12px";
      pinElement.style.borderRadius = "50%";
      pinElement.style.backgroundColor = iconColor;
      pinElement.style.border = `2px solid white`;
      pinElement.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
      pinElement.style.transition = "all 0.2s ease-in-out";

      const marker = new markerLibrary.AdvancedMarkerElement({
        map,
        position: { lat: attraction.location.lat, lng: attraction.location.lng },
        content: pinElement,
        title: attraction.name,
      });

      markersMap.set(attraction.placeId, { marker, element: pinElement });
    });

    return () => {
      markersMap.forEach(({ marker }) => (marker.map = null));
      markersMap.clear();
    };
  }, [map, markerLibrary, selectedPlace, attractions, restaurants, activeTab, mapId]);

  useEffect(() => {
    if (!attractionMarkersRef.current) return;

    attractionMarkersRef.current.forEach(({ element }, placeId) => {
      if (placeId === hoveredAttractionId) {
        element.style.width = "20px";
        element.style.height = "20px";
        element.style.borderWidth = "3px";
        element.style.transform = "scale(1.2)";
        element.style.zIndex = "1000";
      } else {
        element.style.width = "12px";
        element.style.height = "12px";
        element.style.borderWidth = "2px";
        element.style.transform = "scale(1)";
        element.style.zIndex = "auto";
      }
    });
  }, [hoveredAttractionId]);

  useEffect(() => {
    if (!map || !markerLibrary || !mapId) return;

    const clickListener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();

      if (lat === undefined || lng === undefined) return;

      handleClosePopover();

      setClickedLocation({ lat, lng });
      setShowAddPlacePopover(true);

      const tempElement = document.createElement("div");
      tempElement.style.width = "16px";
      tempElement.style.height = "16px";
      tempElement.style.borderRadius = "50%";
      tempElement.style.backgroundColor = "#10B981";
      tempElement.style.border = "3px solid white";
      tempElement.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)";

      const tempMarker = new markerLibrary.AdvancedMarkerElement({
        map,
        position: { lat, lng },
        content: tempElement,
      });

      tempMarkerRef.current = tempMarker;
    });

    return () => {
      if (clickListener) {
        google.maps.event.removeListener(clickListener);
      }
    };
  }, [map, markerLibrary, mapId, handleClosePopover]);

  return (
    <div className="flex h-screen">
      <div className="w-96 flex flex-col bg-white border-r shadow-sm">
        <div className="p-4 border-b">
          <PlaceAutocomplete onPlaceSelect={handlePlaceSelect} disabled={isLoading} map={map} />
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          {isLoading && <p className="text-sm text-muted-foreground mt-1">Loading place details...</p>}
        </div>

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
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium line-clamp-2">{place.name}</h3>
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
                          className="flex-shrink-0 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
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

      <div className="flex-1 relative">
        <Map
          defaultCenter={{ lat: 0, lng: 0 }}
          defaultZoom={2}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId={mapId}
        />

        {selectedPlace && (
          <AttractionsPanel
            attractions={attractions}
            isLoadingAttractions={isLoadingAttractions}
            attractionsError={attractionsError}
            restaurants={restaurants}
            isLoadingRestaurants={isLoadingRestaurants}
            restaurantsError={restaurantsError}
            placeName={selectedPlace.name}
            onClose={handleCloseAttractions}
            onTabChange={handleTabChange}
            onAttractionHover={setHoveredAttractionId}
          />
        )}

        {showAddPlacePopover && clickedLocation && (
          <div className="absolute top-4 left-4 z-50">
            <div className="bg-white rounded-lg shadow-lg border p-4 w-80">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-sm mb-1">Add Location to Places</h3>
                  <p className="text-xs text-muted-foreground">
                    {clickedLocation.lat.toFixed(6)}, {clickedLocation.lng.toFixed(6)}
                  </p>
                </div>

                {geocodingError && <p className="text-sm text-red-500">{geocodingError}</p>}

                {isReverseGeocoding ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Finding address...</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleAddPlace} className="flex-1" size="sm">
                      Add to Places
                    </Button>
                    <Button onClick={handleClosePopover} variant="outline" className="flex-1" size="sm">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
