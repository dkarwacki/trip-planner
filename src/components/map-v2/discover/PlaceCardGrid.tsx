/**
 * Place card grid - displays places in large card view (default)
 * Implements Stage 3.2 of the UX implementation plan
 */

import React, { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { PlaceCard } from "./PlaceCard";
import { useMapStore, selectPlannedIds } from "../stores/mapStore";
import { useScrollPreservation } from "./DiscoverPanel";
import type { Attraction, AttractionScore } from "@/domain/map/models";

interface PlaceCardGridProps {
  places: (Attraction | AttractionScore)[];
  onNavigateToMap?: (attractionId: string, lat: number, lng: number) => void;
}

export function PlaceCardGrid({ places, onNavigateToMap }: PlaceCardGridProps) {
  // Fine-grained selectors to prevent re-renders
  const highlightedPlaceId = useMapStore((state) => state.highlightedPlaceId);
  const selectedPlaceId = useMapStore((state) => state.selectedPlaceId);

  // Actions (stable references)
  const setHoveredMarker = useMapStore((state) => state.setHoveredMarker);
  const setExpandedCard = useMapStore((state) => state.setExpandedCard);
  const setHighlightedPlace = useMapStore((state) => state.setHighlightedPlace);
  const addAttractionToPlace = useMapStore((state) => state.addAttractionToPlace);
  const addRestaurantToPlace = useMapStore((state) => state.addRestaurantToPlace);

  // Derived state with shallow comparison
  const plannedIds = useMapStore(useShallow(selectPlannedIds));

  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrolledIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to highlighted place (only once per highlight)
  useEffect(() => {
    if (highlightedPlaceId && scrolledIdRef.current !== highlightedPlaceId) {
      const element = itemRefs.current.get(highlightedPlaceId);
      if (element) {
        scrolledIdRef.current = highlightedPlaceId;
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Clear highlight after scroll completes
        const timeout = setTimeout(() => {
          setHighlightedPlace(null);
          scrolledIdRef.current = null;
        }, 2000);
        return () => clearTimeout(timeout);
      }
    } else if (!highlightedPlaceId) {
      scrolledIdRef.current = null;
    }
  }, [highlightedPlaceId, setHighlightedPlace]);

  // Clear highlight on manual scroll
  useEffect(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    const handleScroll = () => {
      if (highlightedPlaceId) {
        setHighlightedPlace(null);
        scrolledIdRef.current = null;
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [highlightedPlaceId, setHighlightedPlace]);

  // Extract attraction from AttractionScore if needed
  const getAttraction = (place: Attraction | AttractionScore): Attraction => {
    if ("attraction" in place) {
      return place.attraction;
    }
    return place;
  };

  // Get score from AttractionScore or calculate basic score
  const getScore = (place: Attraction | AttractionScore): number => {
    if ("score" in place && typeof place.score === "number") {
      return place.score;
    }
    const attraction = getAttraction(place);
    // Simple fallback score calculation
    if (attraction.rating && attraction.userRatingsTotal) {
      return (attraction.rating / 5) * 10;
    }
    return 0;
  };

  // Check if attraction is already in plan
  const isInPlan = (attractionId: string) => plannedIds.has(attractionId);

  const scrollPreservation = useScrollPreservation();

  const handleAddClick = React.useCallback(
    (attractionId: string) => {
      if (!selectedPlaceId) {
        return;
      }

      // Save scroll position BEFORE state update
      scrollPreservation?.saveScrollPosition();

      // Find the attraction in the places array
      const place = places.find((p) => {
        const attraction = getAttraction(p);
        return attraction.id === attractionId;
      });

      if (!place) {
        return;
      }

      const attraction = getAttraction(place);

      // Check if it's a restaurant based on types
      const isRestaurant = attraction.types?.some((t: string) =>
        ["restaurant", "food", "cafe", "bar", "bakery"].includes(t)
      );

      // Add to the selected place's appropriate array
      if (isRestaurant) {
        addRestaurantToPlace(selectedPlaceId, attraction);
      } else {
        addAttractionToPlace(selectedPlaceId, attraction);
      }
    },
    [selectedPlaceId, places, addRestaurantToPlace, addAttractionToPlace, scrollPreservation]
  );

  const handleCardClick = React.useCallback(
    (placeId: string) => {
      // If onNavigateToMap is provided (mobile), navigate to map with attraction
      if (onNavigateToMap) {
        const place = places.find((p) => {
          const attraction = getAttraction(p);
          return attraction.id === placeId;
        });

        if (place) {
          const attraction = getAttraction(place);
          if (attraction.location) {
            onNavigateToMap(placeId, attraction.location.lat, attraction.location.lng);
            return;
          }
        }
      }

      // Otherwise use desktop behavior (expand card in sidebar)
      setExpandedCard(placeId);
    },
    [setExpandedCard, onNavigateToMap, places]
  );

  return (
    <div ref={containerRef} className="p-4 space-y-4">
      {places.map((place) => {
        const attraction = getAttraction(place);
        const score = getScore(place);
        const isAdded = isInPlan(attraction.id);

        return (
          <div
            key={attraction.id}
            ref={(el) => {
              if (el) {
                itemRefs.current.set(attraction.id, el);
              } else {
                itemRefs.current.delete(attraction.id);
              }
            }}
          >
            <PlaceCard
              place={attraction}
              score={score}
              isAdded={isAdded}
              onAddClick={handleAddClick}
              onCardClick={handleCardClick}
              isHighlighted={highlightedPlaceId === attraction.id}
              onHover={setHoveredMarker}
            />
          </div>
        );
      })}
    </div>
  );
}
