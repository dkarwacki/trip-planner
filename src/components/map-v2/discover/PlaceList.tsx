/**
 * Place list - compact list view for browsing many places
 */

import React, { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { PlaceListItem } from "./PlaceListItem";
import type { DiscoveryItemViewModel } from "@/lib/map-v2/types";
import { useMapStore, selectPlannedIds } from "../stores/mapStore";

interface PlaceListProps {
  places: DiscoveryItemViewModel[];
  onNavigateToMap?: (attractionId: string, lat: number, lng: number) => void;
}

export function PlaceList({ places, onNavigateToMap }: PlaceListProps) {
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

  // Check if attraction is already in plan
  const isInPlan = (attractionId: string) => plannedIds.has(attractionId);

  // Keep stable reference to places array for handleAddClick
  const placesRef = useRef(places);
  useEffect(() => {
    placesRef.current = places;
  }, [places]);

  const handleAddClick = React.useCallback(
    (attractionId: string) => {
      if (!selectedPlaceId) {
        return;
      }

      // Preserve scroll position during state update to prevent any movement
      const scrollContainer = containerRef.current?.parentElement;
      const scrollPos = scrollContainer?.scrollTop ?? 0;

      // Find the place in the places array using stable ref
      const place = placesRef.current.find((p) => p.id === attractionId);

      if (!place) {
        return;
      }

      // Check if it's a restaurant based on types
      const isRestaurant = place.types?.some((t: string) =>
        ["restaurant", "food", "cafe", "bar", "bakery"].includes(t)
      );

      // Add to the selected place's appropriate array
      if (isRestaurant) {
        addRestaurantToPlace(selectedPlaceId, place);
      } else {
        addAttractionToPlace(selectedPlaceId, place);
      }

      // Restore scroll position after React re-renders
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollPos;
        }
      });
    },
    [selectedPlaceId, addRestaurantToPlace, addAttractionToPlace]
  );

  const handleExpandCard = React.useCallback(
    (placeId: string) => {
      // If onNavigateToMap is provided (mobile), navigate to map with attraction
      if (onNavigateToMap) {
        const place = places.find((p) => p.id === placeId);

        if (place) {
          onNavigateToMap(placeId, place.latitude, place.longitude);
          return;
        }
      }

      // Otherwise use desktop behavior (expand card in sidebar)
      setExpandedCard(placeId);
    },
    [setExpandedCard, onNavigateToMap, places]
  );

  return (
    <div ref={containerRef} className="divide-y divide-gray-200">
      {places.map((place) => {
        const isAdded = isInPlan(place.id);

        return (
          <div
            key={place.id}
            ref={(el) => {
              if (el) {
                itemRefs.current.set(place.id, el);
              } else {
                itemRefs.current.delete(place.id);
              }
            }}
          >
            <PlaceListItem
              place={place}
              score={place.score}
              isAdded={isAdded}
              isHighlighted={highlightedPlaceId === place.id}
              onHover={setHoveredMarker}
              onExpandCard={handleExpandCard}
              onAddClick={handleAddClick}
            />
          </div>
        );
      })}
    </div>
  );
}
