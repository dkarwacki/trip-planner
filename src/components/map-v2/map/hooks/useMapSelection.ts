import { useCallback, useEffect, useMemo } from "react";
import { useMapStore, filterDiscoveryResults } from "../../stores/mapStore";

interface UseMapSelectionProps {
  map: google.maps.Map | null;
  mapCenter: { lat: number; lng: number } | null;
}

export function useMapSelection({ map, mapCenter }: Omit<UseMapSelectionProps, "viewportSize">) {
  const places = useMapStore((state) => state.places);
  const selectedPlaceId = useMapStore((state) => state.selectedPlaceId);
  const hoveredMarkerId = useMapStore((state) => state.hoveredMarkerId);
  const expandedCardPlaceId = useMapStore((state) => state.expandedCardPlaceId);
  const discoveryResults = useMapStore((state) => state.discoveryResults);
  const filters = useMapStore((state) => state.filters);
  const activeMode = useMapStore((state) => state.activeMode);

  const setSelectedPlace = useMapStore((state) => state.setSelectedPlace);
  const setHoveredMarker = useMapStore((state) => state.setHoveredMarker);
  const setExpandedCard = useMapStore((state) => state.setExpandedCard);
  const setHighlightedPlace = useMapStore((state) => state.setHighlightedPlace);
  const addAttractionToPlace = useMapStore((state) => state.addAttractionToPlace);
  const addRestaurantToPlace = useMapStore((state) => state.addRestaurantToPlace);
  const closeCard = useMapStore((state) => state.closeCard);

  // Apply filters to discovery results
  const filteredDiscoveryResults = useMemo(() => {
    return filterDiscoveryResults(discoveryResults, filters);
  }, [discoveryResults, filters]);

  const handlePlaceClick = useCallback(
    (place: { id: string }) => {
      setSelectedPlace(place.id);
    },
    [setSelectedPlace]
  );

  const handleAddToPlan = useCallback(
    (attractionId: string) => {
      if (!selectedPlaceId) return;

      // Look up in filtered results first, but fallback to all results just in case
      // (though typically we only click what we see)
      const result =
        filteredDiscoveryResults.find((r: { attraction?: { id: string } }) => r.attraction?.id === attractionId) ||
        discoveryResults.find((r: { attraction?: { id: string } }) => r.attraction?.id === attractionId);

      if (!result?.attraction) return;

      const isRestaurant = result.attraction.types?.some((t: string) =>
        ["restaurant", "food", "cafe", "bar", "bakery"].includes(t)
      );

      if (isRestaurant) {
        addRestaurantToPlace(selectedPlaceId, result.attraction);
      } else {
        addAttractionToPlace(selectedPlaceId, result.attraction);
      }
    },
    [filteredDiscoveryResults, discoveryResults, selectedPlaceId, addAttractionToPlace, addRestaurantToPlace]
  );

  const handlePlannedItemClick = useCallback(
    (attractionId: string) => {
      setHighlightedPlace(attractionId);
      setExpandedCard(attractionId);
    },
    [setExpandedCard, setHighlightedPlace]
  );

  const hoveredAttraction = hoveredMarkerId
    ? activeMode === "discover" || activeMode === "ai"
      ? filteredDiscoveryResults.find((r: { attraction?: { id: string } }) => r.attraction?.id === hoveredMarkerId)
      : (() => {
          for (const place of places) {
            const found =
              place.plannedAttractions?.find((a: { id: string }) => a.id === hoveredMarkerId) ||
              place.plannedRestaurants?.find((r: { id: string }) => r.id === hoveredMarkerId);
            if (found) return { attraction: found, score: 0 };
          }
          return null;
        })()
    : null;

  const expandedAttraction = expandedCardPlaceId
    ? activeMode === "discover" || activeMode === "ai"
      ? filteredDiscoveryResults.find((r: { attraction?: { id: string } }) => r.attraction?.id === expandedCardPlaceId)
      : (() => {
          for (const place of places) {
            const foundAttraction = place.plannedAttractions?.find((a: { id: string }) => a.id === expandedCardPlaceId);
            if (foundAttraction) {
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

  const isPositionInViewport = useCallback(
    (lat: number, lng: number): boolean => {
      if (!map) return false;
      const bounds = map.getBounds();
      if (!bounds) return false;
      return bounds.contains({ lat, lng });
    },
    [map]
  );

  // Center map on expanded attraction (clicked from discover panel, plan sidebar, or marker)
  useEffect(() => {
    if (!map || !expandedCardPlaceId) return;

    // Find the attraction in discovery results (Discover/AI mode) or planned items (Plan mode)
    let expandedItem: { attraction?: { id: string; location: { lat: number; lng: number } } } | undefined =
      filteredDiscoveryResults.find(
        (r: { attraction?: { id: string; location: { lat: number; lng: number } } }) =>
          r.attraction?.id === expandedCardPlaceId
      );

    // If not found in filtered results, search in planned items
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
  }, [map, expandedCardPlaceId, filteredDiscoveryResults, places]);

  // Center and zoom map on selected hub place (numbered markers)
  useEffect(() => {
    if (!map || !selectedPlaceId) return;

    // Find the selected hub place
    const selectedPlace = places.find((p) => p.id === selectedPlaceId);

    if (selectedPlace) {
      const lat = Number(selectedPlace.lat);
      const lng = Number(selectedPlace.lng);

      if (isFinite(lat) && isFinite(lng)) {
        map.panTo({ lat, lng });
        map.setZoom(14);
      }
    }
  }, [map, selectedPlaceId, places]);

  // Close card when marker moves outside viewport
  useEffect(() => {
    if (!expandedCardPlaceId || !expandedAttraction) return;

    const { lat, lng } = expandedAttraction.attraction.location;
    const isVisible = isPositionInViewport(lat, lng);

    if (!isVisible) {
      closeCard();
    }
  }, [mapCenter, expandedCardPlaceId, expandedAttraction, isPositionInViewport, closeCard]);

  const isInPlan = (attractionId: string) => {
    return places.some(
      (p: { plannedAttractions?: { id: string }[]; plannedRestaurants?: { id: string }[] }) =>
        p.plannedAttractions?.some((a: { id: string }) => a.id === attractionId) ||
        p.plannedRestaurants?.some((r: { id: string }) => r.id === attractionId)
    );
  };

  const getMarkerScreenPosition = useCallback(
    (lat: number, lng: number): { x: number; y: number } | null => {
      if (!map) return null;

      const projection = map.getProjection();
      if (!projection) return null;

      const bounds = map.getBounds();
      if (!bounds) return null;

      const mapDiv = map.getDiv();
      const mapRect = mapDiv.getBoundingClientRect();

      const latLng = new google.maps.LatLng(lat, lng);
      const worldPoint = projection.fromLatLngToPoint(latLng);
      if (!worldPoint) return null;

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const nw = new google.maps.LatLng(ne.lat(), sw.lng());
      const nwWorldPoint = projection.fromLatLngToPoint(nw);
      if (!nwWorldPoint) return null;

      const scale = Math.pow(2, map.getZoom() || 0);
      const pixelOffset = {
        x: Math.floor((worldPoint.x - nwWorldPoint.x) * scale),
        y: Math.floor((worldPoint.y - nwWorldPoint.y) * scale),
      };

      const point = {
        x: mapRect.left + pixelOffset.x,
        y: mapRect.top + pixelOffset.y,
      };

      return point;
    },
    [map]
  );

  return {
    selectedPlaceId,
    hoveredMarkerId,
    expandedCardPlaceId,
    activeMode,
    discoveryResults: filteredDiscoveryResults, // Return filtered results instead of raw
    places,
    setHoveredMarker,
    setExpandedCard,
    setHighlightedPlace,
    closeCard,
    handlePlaceClick,
    handleAddToPlan,
    handlePlannedItemClick,
    hoveredAttraction,
    expandedAttraction,
    isInPlan,
    getMarkerScreenPosition,
  };
}
