/**
 * Place card grid - displays places in large card view (default)
 * Implements Stage 3.2 of the UX implementation plan
 *
 * ARCHITECTURE: This component is a pure layout container.
 * It only manages scroll behavior for highlighted items.
 * Individual PlaceCards handle ALL interactions independently.
 */

import React, { useEffect, useRef } from "react";
import { PlaceCard } from "./PlaceCard";
import { useMapStore } from "../stores/mapStore";
import type { Attraction, AttractionScore } from "@/domain/map/models";

interface PlaceCardGridProps {
  places: (Attraction | AttractionScore)[];
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

  return (
    <div ref={containerRef} className="p-4 space-y-4">
      {places.map((place) => {
        const attraction = getAttraction(place);
        const score = getScore(place);

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
              isHighlighted={highlightedPlaceId === attraction.id}
              onNavigateToMap={onNavigateToMap}
            />
          </div>
        );
      })}
    </div>
  );
}
