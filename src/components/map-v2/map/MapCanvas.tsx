/**
 * Map canvas component
 * Wrapper for Google Maps with markers and controls
 */

import React, { useCallback, useEffect, useState, useRef } from "react";
import { Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { PlaceMarkers } from "./PlaceMarkers";
import { DiscoveryMarkers } from "./DiscoveryMarkers";
import { PlannedItemMarkers } from "./PlannedItemMarkers";
import { SearchAreaButton } from "./SearchAreaButton";
import { DraftMarker } from "./DraftMarker";
import { PlacePreviewCard } from "./PlacePreviewCard";
import { AdjustLocationCard } from "./AdjustLocationCard";
import { PinModeUI } from "./PinModeUI";
import { MapBackdrop } from "./MapBackdrop";
import { HoverMiniCard } from "./HoverMiniCard";
import { ExpandedPlaceCard } from "./ExpandedPlaceCard";
import { useMapStore } from "../stores/mapStore";
import { useMapPanDetection } from "../hooks/useMapPanDetection";
import { useNearbyPlaces } from "../hooks/useNearbyPlaces";
import { useReverseGeocoding } from "../hooks/useReverseGeocoding";
import { calculateDistance } from "@/lib/map/map-utils";
import {
  NEARBY_SEARCH_RADIUS_METERS,
  SEARCH_AREA_BUTTON_SHOW_THRESHOLD_METERS,
  NEW_TRIP_POINT_THRESHOLD_METERS,
} from "@/lib/map-v2/search-constants";
import type { Place } from "@/domain/common/models";

interface MapCanvasProps {
  mapId?: string;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  onMapLoad?: (map: google.maps.Map) => void;
}

export function MapCanvas({ mapId, defaultCenter = { lat: 0, lng: 0 }, defaultZoom = 2, onMapLoad }: MapCanvasProps) {
  return (
    <div className="relative h-full w-full bg-gray-100">
      <div className="relative h-full w-full" style={{ zIndex: 45 }}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId={mapId}
          className="h-full w-full"
        />
      </div>

      {/* Place Markers, Map Instance Callback, and Search Area Button */}
      <MapInteractiveLayer onMapLoad={onMapLoad} />
    </div>
  );
}

/**
 * Layer component for discovery markers
 * Gets data from context and renders attraction/restaurant markers
 */
function DiscoveryMarkersLayer() {
  // Selectors
  const discoveryResults = useMapStore((state) => state.discoveryResults);
  const filters = useMapStore((state) => state.filters);
  const hoveredMarkerId = useMapStore((state) => state.hoveredMarkerId);

  // Actions
  const setHoveredMarker = useMapStore((state) => state.setHoveredMarker);
  const setExpandedCard = useMapStore((state) => state.setExpandedCard);
  const setActiveMode = useMapStore((state) => state.setActiveMode);
  const setHighlightedPlace = useMapStore((state) => state.setHighlightedPlace);

  const handleMarkerClick = useCallback(
    (attractionId: string) => {
      // Switch to discover mode to show the list
      setActiveMode("discover");
      // Highlight the place in the list
      setHighlightedPlace(attractionId);
      // Open the expanded card
      setExpandedCard(attractionId);
    },
    [setExpandedCard, setActiveMode, setHighlightedPlace]
  );

  const handleMarkerHover = useCallback(
    (attractionId: string | null) => {
      setHoveredMarker(attractionId);
    },
    [setHoveredMarker]
  );

  // Helper to check if attraction is a restaurant
  const isRestaurant = (item: { attraction?: { types?: string[] } }) => {
    return item.attraction?.types?.some((t: string) => ["restaurant", "food", "cafe", "bar", "bakery"].includes(t));
  };

  // Apply quality filter first
  let results = discoveryResults;
  if (filters.showHighQualityOnly) {
    results = results.filter((item: any) => {
      const score = item.score || 0;
      return score >= filters.minScore * 10; // Convert 7/8/9 to 70/80/90
    });
  }

  // Split into attractions and restaurants based on types
  const attractions = results.filter((r: { attraction?: { types?: string[] } }) => !isRestaurant(r));
  const restaurants = results.filter((r: { attraction?: { types?: string[] } }) => isRestaurant(r));

  // Apply category filter
  let filteredAttractions = attractions;
  let filteredRestaurants = restaurants;

  if (filters.category === "attractions") {
    filteredRestaurants = [];
  } else if (filters.category === "restaurants") {
    filteredAttractions = [];
  }

  return (
    <>
      {filteredAttractions.length > 0 && (
        <DiscoveryMarkers
          attractions={filteredAttractions}
          category="attractions"
          onMarkerClick={handleMarkerClick}
          onMarkerHover={handleMarkerHover}
          hoveredId={hoveredMarkerId}
        />
      )}
      {filteredRestaurants.length > 0 && (
        <DiscoveryMarkers
          attractions={filteredRestaurants}
          category="restaurants"
          onMarkerClick={handleMarkerClick}
          onMarkerHover={handleMarkerHover}
          hoveredId={hoveredMarkerId}
        />
      )}
    </>
  );
}

/**
 * Interactive layer component for markers, search button, and map state
 * Separated to use context hooks
 */
function MapInteractiveLayer({ onMapLoad }: { onMapLoad?: (map: google.maps.Map) => void }) {
  // Selectors
  const places = useMapStore((state) => state.places);
  const selectedPlaceId = useMapStore((state) => state.selectedPlaceId);
  const hoveredMarkerId = useMapStore((state) => state.hoveredMarkerId);
  const expandedCardPlaceId = useMapStore((state) => state.expandedCardPlaceId);
  const discoveryResults = useMapStore((state) => state.discoveryResults);
  const activeMode = useMapStore((state) => state.activeMode);
  const searchCenters = useMapStore((state) => state.searchCenters);
  const centerRequestTimestamp = useMapStore((state) => state.centerRequestTimestamp);

  // Actions
  const setSelectedPlace = useMapStore((state) => state.setSelectedPlace);
  const setHoveredMarker = useMapStore((state) => state.setHoveredMarker);
  const setExpandedCard = useMapStore((state) => state.setExpandedCard);
  const setHighlightedPlace = useMapStore((state) => state.setHighlightedPlace);
  const addAttractionToPlace = useMapStore((state) => state.addAttractionToPlace);
  const addRestaurantToPlace = useMapStore((state) => state.addRestaurantToPlace);
  const addSearchCenter = useMapStore((state) => state.addSearchCenter);
  const addPlace = useMapStore((state) => state.addPlace);
  const closeCard = useMapStore((state) => state.closeCard);
  const map = useMap();
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(false);
  const [draftPlace, setDraftPlace] = useState<{ place: Place; lat: number; lng: number; country?: string } | null>(
    null
  );
  const [isAdjustingLocation, setIsAdjustingLocation] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isDesktop, setIsDesktop] = useState(false);
  const hasInitializedRef = useRef(false); // Track if we've set initial search center (use ref to avoid re-renders)

  // Detect desktop (hover capability)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsDesktop(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Track viewport size for card positioning
  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Get nearby places hook
  const { fetchNearbyPlaces } = useNearbyPlaces();
  // Get reverse geocoding hook
  const { findPlace } = useReverseGeocoding();

  // Search configuration (using shared constants)
  const SEARCH_BUTTON_SHOW_THRESHOLD_KM = SEARCH_AREA_BUTTON_SHOW_THRESHOLD_METERS / 1000; // Convert meters to km

  // Notify parent when map is loaded
  useEffect(() => {
    if (map && onMapLoad) {
      onMapLoad(map);
    }
  }, [map, onMapLoad]);

  // Check if a position is visible in the viewport
  const isPositionInViewport = useCallback(
    (lat: number, lng: number): boolean => {
      if (!map) return false;

      const bounds = map.getBounds();
      if (!bounds) return false;

      return bounds.contains({ lat, lng });
    },
    [map]
  );

  // Track map center changes and add click listener to close cards
  useEffect(() => {
    if (!map) return;

    // Use 'idle' event instead of 'center_changed' to only update after map stops moving
    // This prevents button from flickering during programmatic pans and better matches Google Maps behavior
    const idleListener = map.addListener("idle", () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      if (center) {
        setMapCenter({ lat: center.lat(), lng: center.lng() });
      }
      if (zoom !== undefined) {
        setMapZoom(zoom);
      }
    });

    // Add click listener to close expanded card when clicking on map
    const clickListener = map.addListener("click", () => {
      closeCard();
    });

    // Initialize center and zoom immediately
    const center = map.getCenter();
    const zoom = map.getZoom();
    if (zoom !== undefined) {
      setMapZoom(zoom);
    }
    if (center) {
      const centerCoords = { lat: center.lat(), lng: center.lng() };
      setMapCenter(centerCoords);

      // Set as initial reference location only once on first load
      // This allows "search this area" button to appear on first pan
      if (!hasInitializedRef.current) {
        addSearchCenter(centerCoords);
        hasInitializedRef.current = true;
      }
    }

    return () => {
      google.maps.event.removeListener(idleListener);
      google.maps.event.removeListener(clickListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, closeCard]);

  // Falls back to selected place location only if no search has been performed yet
  const selectedPlace = selectedPlaceId ? places.find((p) => p.id === selectedPlaceId) : null;

  const fallbackLocation = selectedPlace ? { lat: Number(selectedPlace.lat), lng: Number(selectedPlace.lng) } : null;

  useEffect(() => {
    if (map && selectedPlace && centerRequestTimestamp) {
      const lat = Number(selectedPlace.lat);
      const lng = Number(selectedPlace.lng);

      map.panTo({ lat, lng });

      // Optionally zoom in if too far out
      const currentZoom = map.getZoom() || 0;
      if (currentZoom < 12) {
        map.setZoom(12);
      }
    }
  }, [map, selectedPlace, centerRequestTimestamp]);

  // Center map on expanded attraction (clicked from discover panel or plan sidebar)
  useEffect(() => {
    if (map && expandedCardPlaceId) {
      // First, try to find in discovery results (Discover mode)
      let expandedItem = discoveryResults.find(
        (r: { attraction?: { id: string; location: { lat: number; lng: number } } }) =>
          r.attraction?.id === expandedCardPlaceId
      );

      // If not found, search in planned items (Plan mode)
      if (!expandedItem) {
        for (const place of places) {
          const found =
            place.plannedAttractions?.find(
              (a: { id: string; location: { lat: number; lng: number } }) => a.id === expandedCardPlaceId
            ) ||
            place.plannedRestaurants?.find(
              (r: { id: string; location: { lat: number; lng: number } }) => r.id === expandedCardPlaceId
            );
          if (found) {
            expandedItem = { attraction: found };
            break;
          }
        }
      }

      if (expandedItem?.attraction?.location) {
        const { lat, lng } = expandedItem.attraction.location;
        map.panTo({ lat: Number(lat), lng: Number(lng) });

        // Optionally zoom in if too far out
        const currentZoom = map.getZoom() || 0;
        if (currentZoom < 14) {
          map.setZoom(14);
        }
      }
    }
  }, [map, expandedCardPlaceId, discoveryResults, places]);

  // Use pan detection hook - checks if current location is far enough from ALL search centers
  const { shouldShowButton } = useMapPanDetection(searchCenters, mapCenter, fallbackLocation, {
    thresholdKm: SEARCH_BUTTON_SHOW_THRESHOLD_KM,
    debounceMs: 100,
  });

  // Handle search area button click
  const handleSearchArea = useCallback(async () => {
    if (!mapCenter) return;

    setIsSearching(true);

    try {
      // Check if we should start new point flow:
      // 1. No places exist yet, OR
      // 2. Far from the selected place
      let shouldStartNewPoint = places.length === 0;

      if (!shouldStartNewPoint && selectedPlace) {
        const distance = calculateDistance(
          { lat: mapCenter.lat, lng: mapCenter.lng },
          { lat: Number(selectedPlace.lat), lng: Number(selectedPlace.lng) }
        );
        shouldStartNewPoint = distance > NEW_TRIP_POINT_THRESHOLD_METERS;
      }

      if (shouldStartNewPoint) {
        // Start "New Point" flow
        const newPlace = await findPlace(mapCenter.lat, mapCenter.lng);
        if (newPlace) {
          // Parse country from name if present (format: "City||Country")
          const [cityName, countryName] = newPlace.name.split("||");
          setDraftPlace({
            place: { ...newPlace, name: cityName }, // Store only city name
            lat: mapCenter.lat,
            lng: mapCenter.lng,
            country: countryName,
          });
        }
        return;
      }

      // Normal search flow
      await fetchNearbyPlaces({
        lat: mapCenter.lat,
        lng: mapCenter.lng,
        radius: NEARBY_SEARCH_RADIUS_METERS,
        append: true, // Add to existing results
      });
    } catch {
      // Failed to fetch nearby places or find place
    } finally {
      setIsSearching(false);
    }
  }, [mapCenter, fetchNearbyPlaces, selectedPlace, findPlace, places.length]);

  // Draft handlers
  const handleConfirmDraft = useCallback(() => {
    if (!draftPlace) return;
    addPlace(draftPlace.place);
    setDraftPlace(null);
  }, [draftPlace, addPlace]);

  const handleAdjustDraft = useCallback(() => {
    setIsAdjustingLocation(true);
    // Keep draftPlace but hide it visually (handled in render)
  }, []);

  const handleCancelDraft = useCallback(() => {
    setDraftPlace(null);
    setIsAdjustingLocation(false);
  }, []);

  const handleFinishAdjustment = useCallback(async () => {
    if (!mapCenter) return;
    setIsSearching(true);
    try {
      const newPlace = await findPlace(mapCenter.lat, mapCenter.lng);
      if (newPlace) {
        // Parse country from name if present
        const [cityName, countryName] = newPlace.name.split("||");
        setDraftPlace({
          place: { ...newPlace, name: cityName },
          lat: mapCenter.lat,
          lng: mapCenter.lng,
          country: countryName,
        });
        setIsAdjustingLocation(false);
      }
    } catch {
      // Failed to find place
    } finally {
      setIsSearching(false);
    }
  }, [mapCenter, findPlace]);

  const handlePlaceClick = useCallback(
    (place: { id: string }) => {
      setSelectedPlace(place.id);
    },
    [setSelectedPlace]
  );

  // Handle "Add to Plan" from expanded card (Discover mode)
  const handleAddToPlan = useCallback(
    (attractionId: string) => {
      // Need a selected place to add attraction to
      if (!selectedPlaceId) {
        return;
      }

      // Find the attraction in discovery results
      const result = discoveryResults.find((r: { attraction?: { id: string } }) => r.attraction?.id === attractionId);

      if (!result?.attraction) {
        return;
      }

      // Check if it's a restaurant based on types
      const isRestaurant = result.attraction.types?.some((t: string) =>
        ["restaurant", "food", "cafe", "bar", "bakery"].includes(t)
      );

      // Add to the selected place's appropriate array
      if (isRestaurant) {
        addRestaurantToPlace(selectedPlaceId, result.attraction);
      } else {
        addAttractionToPlace(selectedPlaceId, result.attraction);
      }
    },
    [discoveryResults, selectedPlaceId, addAttractionToPlace, addRestaurantToPlace]
  );

  // Handle planned item marker click (Plan mode)
  const handlePlannedItemClick = useCallback(
    (attractionId: string) => {
      setHighlightedPlace(attractionId);
      setExpandedCard(attractionId);
    },
    [setExpandedCard, setHighlightedPlace]
  );

  // Get hovered and expanded attractions for cards
  // In discover & AI mode, get from discoveryResults
  // In plan mode, get from places' planned items
  const hoveredAttraction = hoveredMarkerId
    ? activeMode === "discover" || activeMode === "ai"
      ? discoveryResults.find((r: { attraction?: { id: string } }) => r.attraction?.id === hoveredMarkerId)
      : (() => {
          // Find in planned items
          for (const place of places) {
            const found =
              place.plannedAttractions?.find((a: { id: string }) => a.id === hoveredMarkerId) ||
              place.plannedRestaurants?.find((r: { id: string }) => r.id === hoveredMarkerId);
            if (found) return { attraction: found, score: 0 }; // Score not needed for plan mode
          }
          return null;
        })()
    : null;

  const expandedAttraction = expandedCardPlaceId
    ? activeMode === "discover" || activeMode === "ai"
      ? discoveryResults.find((r: { attraction?: { id: string } }) => r.attraction?.id === expandedCardPlaceId)
      : (() => {
          // Find in planned items
          for (const place of places) {
            const foundAttraction = place.plannedAttractions?.find((a: { id: string }) => a.id === expandedCardPlaceId);
            if (foundAttraction) {
              // Calculate score from stored metrics (attractions have diversityScore)
              const score =
                foundAttraction.qualityScore && foundAttraction.diversityScore && foundAttraction.confidenceScore
                  ? (foundAttraction.qualityScore + foundAttraction.diversityScore + foundAttraction.confidenceScore) /
                    3
                  : 0;
              return {
                attraction: foundAttraction,
                score: Math.round(score),
                breakdown: {
                  qualityScore: foundAttraction.qualityScore || 0,
                  diversityScore: foundAttraction.diversityScore || 0,
                  confidenceScore: foundAttraction.confidenceScore || 0,
                },
              };
            }

            const foundRestaurant = place.plannedRestaurants?.find((r: { id: string }) => r.id === expandedCardPlaceId);
            if (foundRestaurant) {
              // Calculate score from stored metrics (restaurants don't have diversityScore)
              const score =
                foundRestaurant.qualityScore && foundRestaurant.confidenceScore
                  ? (foundRestaurant.qualityScore + foundRestaurant.confidenceScore) / 2
                  : 0;
              return {
                attraction: foundRestaurant,
                score: Math.round(score),
                breakdown: {
                  qualityScore: foundRestaurant.qualityScore || 0,
                  confidenceScore: foundRestaurant.confidenceScore || 0,
                },
              };
            }
          }
          return null;
        })()
    : null;

  // Close card when the marker moves outside viewport
  useEffect(() => {
    if (!expandedCardPlaceId || !expandedAttraction) return;

    const { lat, lng } = expandedAttraction.attraction.location;
    const isVisible = isPositionInViewport(lat, lng);

    if (!isVisible) {
      closeCard();
    }
  }, [mapCenter, expandedCardPlaceId, expandedAttraction, isPositionInViewport, closeCard]);

  // Check if attraction is already in plan
  const isInPlan = (attractionId: string) => {
    return places.some(
      (p: { plannedAttractions?: { id: string }[]; plannedRestaurants?: { id: string }[] }) =>
        p.plannedAttractions?.some((a: { id: string }) => a.id === attractionId) ||
        p.plannedRestaurants?.some((r: { id: string }) => r.id === attractionId)
    );
  };

  // Get marker position from map (for card positioning)
  const getMarkerScreenPosition = useCallback(
    (lat: number, lng: number): { x: number; y: number } | null => {
      if (!map) return null;

      const projection = map.getProjection();
      if (!projection) return null;

      const bounds = map.getBounds();
      if (!bounds) return null;

      // Get the map container's position in the viewport
      const mapDiv = map.getDiv();
      const mapRect = mapDiv.getBoundingClientRect();

      // Convert lat/lng to world coordinates
      const latLng = new google.maps.LatLng(lat, lng);
      const worldPoint = projection.fromLatLngToPoint(latLng);
      if (!worldPoint) return null;

      // Get northwest corner (top-left) in world coordinates
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const nw = new google.maps.LatLng(ne.lat(), sw.lng());
      const nwWorldPoint = projection.fromLatLngToPoint(nw);
      if (!nwWorldPoint) return null;

      // Calculate pixel offset within the map
      const scale = Math.pow(2, map.getZoom() || 0);
      const pixelOffset = {
        x: Math.floor((worldPoint.x - nwWorldPoint.x) * scale),
        y: Math.floor((worldPoint.y - nwWorldPoint.y) * scale),
      };

      // Convert to viewport coordinates (for position: fixed)
      const point = {
        x: mapRect.left + pixelOffset.x,
        y: mapRect.top + pixelOffset.y,
      };

      return point;
    },
    [map]
  );

  return (
    <>
      {/* Conditional rendering based on active mode */}
      {activeMode === "discover" || activeMode === "ai" ? (
        <>
          {/* Discover & AI Mode: Show hub markers + discovery markers */}
          <PlaceMarkers places={places} selectedPlaceId={selectedPlaceId} onPlaceClick={handlePlaceClick} />
          <DiscoveryMarkersLayer />
        </>
      ) : (
        <>
          {/* Plan Mode: Show hub place markers + planned item markers */}
          <PlaceMarkers places={places} selectedPlaceId={selectedPlaceId} onPlaceClick={handlePlaceClick} />
          <PlannedItemMarkers
            places={places}
            onMarkerClick={handlePlannedItemClick}
            onMarkerHover={setHoveredMarker}
            hoveredId={hoveredMarkerId}
            expandedCardPlaceId={expandedCardPlaceId}
          />
        </>
      )}

      {/* Search Area Button (Discover & AI mode) */}
      {/* Hides when draft is active or adjusting */}
      {!draftPlace && !isAdjustingLocation && (
        <SearchAreaButton
          isVisible={shouldShowButton && mapZoom >= 10 && (activeMode === "discover" || activeMode === "ai")}
          isTooFar={
            // Show "Start new trip point here" if no places exist OR if far from selected place
            places.length === 0 ||
            (!!selectedPlace &&
              !!mapCenter &&
              calculateDistance(
                { lat: mapCenter.lat, lng: mapCenter.lng },
                { lat: Number(selectedPlace.lat), lng: Number(selectedPlace.lng) }
              ) > NEW_TRIP_POINT_THRESHOLD_METERS)
          }
          isLoading={isSearching}
          onClick={handleSearchArea}
        />
      )}

      {/* Draft Marker (when draft is active but not adjusting) */}
      {draftPlace && !isAdjustingLocation && <DraftMarker position={{ lat: draftPlace.lat, lng: draftPlace.lng }} />}

      {/* Place Preview Card (when draft is active and NOT adjusting) */}
      {draftPlace && !isAdjustingLocation && (
        <PlacePreviewCard
          place={draftPlace.place}
          country={draftPlace.country}
          onConfirm={handleConfirmDraft}
          onAdjust={handleAdjustDraft}
          onCancel={handleCancelDraft}
        />
      )}

      {/* Pin Mode UI (when adjusting) */}
      {isAdjustingLocation && <PinModeUI onConfirm={handleFinishAdjustment} onCancel={handleCancelDraft} />}

      {/* Adjust Location Card (when adjusting) */}
      {isAdjustingLocation && <AdjustLocationCard onConfirm={handleFinishAdjustment} onCancel={handleCancelDraft} />}

      {/* Map Backdrop (when card is expanded) */}
      <MapBackdrop isVisible={!!expandedCardPlaceId} onClick={closeCard} />

      {/* Hover Mini Card (Desktop only, with 300ms delay) */}
      {isDesktop && hoveredAttraction && !expandedCardPlaceId && (
        <HoverMiniCard
          attraction={hoveredAttraction.attraction}
          markerPosition={
            getMarkerScreenPosition(
              hoveredAttraction.attraction.location.lat,
              hoveredAttraction.attraction.location.lng
            ) || { x: 0, y: 0 }
          }
          viewportSize={viewportSize}
          onMouseEnter={() => setHoveredMarker(hoveredAttraction.attraction.id)}
          onMouseLeave={() => setHoveredMarker(null)}
          onClick={() => setExpandedCard(hoveredAttraction.attraction.id)}
        />
      )}

      {/* Expanded Place Card */}
      {expandedAttraction && (
        <ExpandedPlaceCard
          attraction={expandedAttraction.attraction}
          score={expandedAttraction.score}
          breakdown={expandedAttraction.breakdown}
          markerPosition={
            getMarkerScreenPosition(
              expandedAttraction.attraction.location.lat,
              expandedAttraction.attraction.location.lng
            ) || { x: 0, y: 0 }
          }
          viewportSize={viewportSize}
          isAddedToPlan={isInPlan(expandedAttraction.attraction.id)}
          onClose={closeCard}
          onAddToPlan={handleAddToPlan}
        />
      )}
    </>
  );
}

/**
 * Hook to access the Google Maps instance
 * Must be used within a Map component
 */
export function useMapInstance() {
  const map = useMap();
  const markerLibrary = useMapsLibrary("marker");
  const placesLibrary = useMapsLibrary("places");

  return {
    map,
    markerLibrary,
    placesLibrary,
    isReady: !!map && !!markerLibrary,
  };
}
