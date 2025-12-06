/**
 * Photo grid - masonry-style grid view emphasizing photos
 */

import React, { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { PhotoGridItem } from "./PhotoGridItem";
import type { DiscoveryItemViewModel } from "@/lib/map/types";
import { useMapStore, selectPlannedIds } from "../stores/mapStore";
import { useScrollPreservation } from "./DiscoverPanel";

interface PhotoGridProps {
  places: DiscoveryItemViewModel[];
  onNavigateToMap?: (attractionId: string, lat: number, lng: number) => void;
}

export function PhotoGrid({ places, onNavigateToMap }: PhotoGridProps) {
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

  const scrollPreservation = useScrollPreservation();

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
  }, [highlightedPlaceId]);

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

  // Filter places that have photos
  const placesWithPhotos = places.filter((place) => place.photos && place.photos.length > 0);

  const handleAddClick = React.useCallback(
    (attractionId: string) => {
      if (!selectedPlaceId) {
        return;
      }

      // Save scroll position BEFORE state update
      scrollPreservation?.saveScrollPosition();

      // Find the place in the places array
      const place = places.find((p) => p.id === attractionId);

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
    },
    [selectedPlaceId, places, addRestaurantToPlace, addAttractionToPlace, scrollPreservation]
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

  if (placesWithPhotos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-center p-8" data-testid="photo-grid-empty">
        <div>
          <div className="text-4xl mb-2">📷</div>
          <p className="text-sm text-gray-600">No photos available for these places</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="p-4" data-testid="photo-grid">
      {/* Simple 2-column grid (masonry would require a library like react-masonry-css) */}
      <div className="grid grid-cols-2 gap-3" data-testid="photo-grid-container">
        {placesWithPhotos.map((place) => {
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
              <PhotoGridItem
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
    </div>
  );
}
