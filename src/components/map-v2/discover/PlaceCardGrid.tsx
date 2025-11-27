/**
 * Place card grid - displays places in large card view (default)
 *
 * ARCHITECTURE: This component is a pure layout container.
 * It only manages scroll behavior for highlighted items.
 * Individual PlaceCards handle ALL interactions independently.
 */

import React, { useEffect, useRef } from "react";
import { PlaceCard } from "./PlaceCard";
import { useMapStore } from "../stores/mapStore";
import type { DiscoveryItemViewModel } from "@/lib/map-v2/types";

interface PlaceCardGridProps {
  places: DiscoveryItemViewModel[];
  onNavigateToMap?: (attractionId: string, lat: number, lng: number) => void;
}

export function PlaceCardGrid({ places, onNavigateToMap }: PlaceCardGridProps) {
  // Only subscribe to highlight state for scroll behavior
  const highlightedPlaceId = useMapStore((state) => state.highlightedPlaceId);
  const setHighlightedPlace = useMapStore((state) => state.setHighlightedPlace);

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

  return (
    <div ref={containerRef} className="p-4 space-y-4">
      {places.map((place) => {
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
            <PlaceCard
              place={place}
              score={place.score}
              isHighlighted={highlightedPlaceId === place.id}
              onNavigateToMap={onNavigateToMap}
            />
          </div>
        );
      })}
    </div>
  );
}
