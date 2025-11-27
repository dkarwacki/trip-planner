import { useCallback, useEffect, useMemo } from "react";
import { useMapStore, filterDiscoveryResults } from "../../stores/mapStore";
import type { PlannedPOIViewModel } from "@/lib/map-v2/types";
import { useResponsive } from "../../hooks/useResponsive";

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
  const centerRequestTimestamp = useMapStore((state) => state.centerRequestTimestamp);
  const { isMobile } = useResponsive();

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

  // Create lookup maps for O(1) access to planned attractions
  const plannedAttractionMap = useMemo(() => {
    const map = new Map<
      string,
      {
        attraction: PlannedPOIViewModel;
        score: number;
        breakdown?: {
          qualityScore: number;
          personaScore?: number;
          diversityScore?: number;
          confidenceScore: number;
        };
      }
    >();

    for (const place of places) {
      // Process attractions - use stored scores or calculate weighted score
      place.plannedAttractions.forEach((attraction) => {
        // Weighted score: Quality 50%, Persona 10%, Diversity 20%, Confidence 20%
        const qualityScore = attraction.qualityScore || 0;
        const personaScore = attraction.personaScore || 0;
        const diversityScore = attraction.diversityScore || 0;
        const confidenceScore = attraction.confidenceScore || 0;
        const score = qualityScore * 0.5 + personaScore * 0.1 + diversityScore * 0.2 + confidenceScore * 0.2;

        map.set(attraction.id, {
          attraction,
          score: Math.round(score * 10) / 10,
          breakdown: {
            qualityScore,
            personaScore,
            diversityScore,
            confidenceScore,
          },
        });
      });

      // Process restaurants - Quality 70%, Confidence 30%
      place.plannedRestaurants.forEach((restaurant) => {
        const qualityScore = restaurant.qualityScore || 0;
        const confidenceScore = restaurant.confidenceScore || 0;
        const score = qualityScore * 0.7 + confidenceScore * 0.3;

        map.set(restaurant.id, {
          attraction: restaurant,
          score: Math.round(score * 10) / 10,
          breakdown: {
            qualityScore,
            confidenceScore,
          },
        });
      });
    }

    return map;
  }, [places]);

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
      const discoveryItem =
        filteredDiscoveryResults.find((item) => item.id === attractionId) ||
        discoveryResults.find((item) => item.id === attractionId);

      if (!discoveryItem) return;

      // Convert DiscoveryItemViewModel to PlannedPOIViewModel
      const poi: PlannedPOIViewModel = {
        id: discoveryItem.id,
        googlePlaceId: discoveryItem.googlePlaceId,
        name: discoveryItem.name,
        latitude: discoveryItem.latitude,
        longitude: discoveryItem.longitude,
        rating: discoveryItem.rating,
        userRatingsTotal: discoveryItem.userRatingsTotal,
        types: discoveryItem.types,
        vicinity: discoveryItem.vicinity,
        photos: discoveryItem.photos,
        priceLevel: discoveryItem.itemType === "restaurant" ? discoveryItem.priceLevel : undefined,
        qualityScore: discoveryItem.qualityScore,
        personaScore: discoveryItem.personaScore,
        diversityScore: discoveryItem.diversityScore,
        confidenceScore: discoveryItem.confidenceScore,
      };

      if (discoveryItem.itemType === "restaurant") {
        addRestaurantToPlace(selectedPlaceId, poi);
      } else {
        addAttractionToPlace(selectedPlaceId, poi);
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

  // Memoized to prevent expensive lookups on every render
  const hoveredAttraction = useMemo(() => {
    if (!hoveredMarkerId) return null;

    if (activeMode === "discover" || activeMode === "ai") {
      const discoveryItem = filteredDiscoveryResults.find((item) => item.id === hoveredMarkerId);
      if (!discoveryItem) return null;
      return {
        attraction: discoveryItem,
        score: discoveryItem.score,
        breakdown:
          discoveryItem.qualityScore !== undefined && discoveryItem.confidenceScore !== undefined
            ? {
                qualityScore: discoveryItem.qualityScore,
                personaScore: discoveryItem.personaScore,
                diversityScore: discoveryItem.diversityScore,
                confidenceScore: discoveryItem.confidenceScore,
              }
            : undefined,
      };
    }

    // Use lookup map for O(1) access
    return plannedAttractionMap.get(hoveredMarkerId) || null;
  }, [hoveredMarkerId, activeMode, filteredDiscoveryResults, plannedAttractionMap]);

  // Memoized to prevent expensive lookups on every render
  const expandedAttraction = useMemo(() => {
    if (!expandedCardPlaceId) return null;

    if (activeMode === "discover" || activeMode === "ai") {
      const discoveryItem = filteredDiscoveryResults.find((item) => item.id === expandedCardPlaceId);
      if (!discoveryItem) return null;
      return {
        attraction: discoveryItem,
        score: discoveryItem.score,
        breakdown:
          discoveryItem.qualityScore !== undefined && discoveryItem.confidenceScore !== undefined
            ? {
                qualityScore: discoveryItem.qualityScore,
                personaScore: discoveryItem.personaScore,
                diversityScore: discoveryItem.diversityScore,
                confidenceScore: discoveryItem.confidenceScore,
              }
            : undefined,
      };
    }

    // Use lookup map for O(1) access
    return plannedAttractionMap.get(expandedCardPlaceId) || null;
  }, [expandedCardPlaceId, activeMode, filteredDiscoveryResults, plannedAttractionMap]);

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
    const discoveryItem = filteredDiscoveryResults.find((item) => item.id === expandedCardPlaceId);
    let targetLocation: { lat: number; lng: number } | null = null;

    if (discoveryItem) {
      targetLocation = { lat: discoveryItem.latitude, lng: discoveryItem.longitude };
    } else {
      // If not found in filtered results, search in planned items
      for (const place of places) {
        const found =
          place.plannedAttractions.find((a) => a.id === expandedCardPlaceId) ||
          place.plannedRestaurants.find((r) => r.id === expandedCardPlaceId);

        if (found) {
          targetLocation = { lat: found.latitude, lng: found.longitude };
          break;
        }
      }
    }

    if (targetLocation) {
      map.panTo(targetLocation);

      // Mobile adjustment: Offset map so marker is at top 1/4 of screen
      if (isMobile) {
        const offset = window.innerHeight * 0.25;
        setTimeout(() => {
          map.panBy(0, offset);
        }, 100);
      }

      // Optionally zoom in if too far out
      const currentZoom = map.getZoom() || 0;
      if (currentZoom < 14) {
        map.setZoom(14);
      }
    }
  }, [map, expandedCardPlaceId, filteredDiscoveryResults, places, isMobile]);

  // Center and zoom map on selected hub place (numbered markers)
  useEffect(() => {
    if (!map || !selectedPlaceId) return;

    // Find the selected hub place
    const selectedPlace = places.find((p) => p.id === selectedPlaceId);

    if (selectedPlace) {
      const lat = selectedPlace.latitude;
      const lng = selectedPlace.longitude;

      if (isFinite(lat) && isFinite(lng)) {
        map.panTo({ lat, lng });

        // Mobile adjustment: Offset map so marker is at top 1/4 of screen
        if (isMobile) {
          const offset = window.innerHeight * 0.25;
          setTimeout(() => {
            map.panBy(0, offset);
          }, 100);
        }

        // Zoom to level 14 to match attraction click behavior
        const currentZoom = map.getZoom() || 0;
        if (currentZoom < 14) {
          setTimeout(() => {
            map.setZoom(14);
          }, 100);
        }
      }
    }
  }, [map, selectedPlaceId, places, centerRequestTimestamp, isMobile]);

  // Close card when marker moves outside viewport (Desktop only)
  // Mobile cards are fullscreen and don't need this check
  useEffect(() => {
    // Skip on mobile - this prevents race conditions when switching tabs
    if (isMobile) return;

    if (!expandedCardPlaceId || !expandedAttraction) return;

    const lat = expandedAttraction.attraction.latitude;
    const lng = expandedAttraction.attraction.longitude;
    const isVisible = isPositionInViewport(lat, lng);

    if (!isVisible) {
      closeCard();
    }
  }, [mapCenter, expandedCardPlaceId, expandedAttraction, isPositionInViewport, closeCard, isMobile]);

  const isInPlan = (attractionId: string) => {
    return places.some(
      (p) =>
        p.plannedAttractions?.some((a) => a.id === attractionId) ||
        p.plannedRestaurants?.some((r) => r.id === attractionId)
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
