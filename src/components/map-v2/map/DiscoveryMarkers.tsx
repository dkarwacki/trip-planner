/**
 * Discovery markers component
 * Renders attraction/restaurant markers on the map
 * Optimized with incremental updates to prevent full re-renders
 */

import { useCallback, useEffect, useRef } from "react";
import { useMapInstance } from "./MapCanvas";
import type { AttractionScore } from "@/domain/map/models";

interface DiscoveryMarkersProps {
  attractions: AttractionScore[];
  category: "attractions" | "restaurants";
  onMarkerClick: (attractionId: string) => void;
  onMarkerHover?: (attractionId: string | null) => void;
  hoveredId?: string | null;
}

interface MarkerData {
  marker: google.maps.marker.AdvancedMarkerElement;
  element: HTMLDivElement;
  attraction: AttractionScore;
  mouseEnterHandler: () => void;
  mouseLeaveHandler: () => void;
}

export function DiscoveryMarkers({
  attractions,
  category,
  onMarkerClick,
  onMarkerHover,
  hoveredId,
}: DiscoveryMarkersProps) {
  const { map, markerLibrary, isReady } = useMapInstance();
  const markersRef = useRef<Map<string, MarkerData>>(new Map());
  const previousAttractionsRef = useRef<AttractionScore[]>([]);

  // Color coding
  const markerColor = category === "attractions" ? "#3B82F6" : "#EF4444"; // blue-600 or red-500

  // Create marker element
  const createMarkerElement = useCallback(
    (score: number) => {
      const isHighScore = score >= 8.0;
      const element = document.createElement("div");
      element.className = "cursor-pointer transition-all duration-200";
      element.style.width = "20px";
      element.style.height = "20px";

      element.innerHTML = `
        <div class="w-full h-full rounded-full border-2 border-white shadow-md ${
          isHighScore ? "ring-1 ring-yellow-400" : ""
        }" style="background-color: ${markerColor};"></div>
      `;

      return element;
    },
    [markerColor]
  );

  // Incremental marker updates
  useEffect(() => {
    if (!isReady || !map || !markerLibrary) {
      return;
    }

    if (!attractions || !Array.isArray(attractions)) {
      // Clear all markers if attractions is invalid
      markersRef.current.forEach(({ marker, element, mouseEnterHandler, mouseLeaveHandler }) => {
        marker.map = null;
        element.removeEventListener("mouseenter", mouseEnterHandler);
        element.removeEventListener("mouseleave", mouseLeaveHandler);
      });
      markersRef.current.clear();
      previousAttractionsRef.current = [];
      return;
    }

    const previousAttractions = previousAttractionsRef.current;
    const currentAttractionIds = new Set(attractions.map((a) => a.attraction.id));
    const previousAttractionIds = new Set(previousAttractions.map((a) => a.attraction.id));

    // Find removed attractions
    const removedAttractionIds = previousAttractions
      .filter((a) => !currentAttractionIds.has(a.attraction.id))
      .map((a) => a.attraction.id);

    // Find added attractions
    const addedAttractions = attractions.filter((a) => !previousAttractionIds.has(a.attraction.id));

    // Remove markers for removed attractions
    removedAttractionIds.forEach((attractionId) => {
      const markerData = markersRef.current.get(attractionId);
      if (markerData) {
        markerData.marker.map = null;
        markerData.element.removeEventListener("mouseenter", markerData.mouseEnterHandler);
        markerData.element.removeEventListener("mouseleave", markerData.mouseLeaveHandler);
        markersRef.current.delete(attractionId);
      }
    });

    // Add markers for new attractions
    addedAttractions.forEach((attractionScore) => {
      const { attraction, score } = attractionScore;
      const element = createMarkerElement(score);

      const marker = new markerLibrary.AdvancedMarkerElement({
        map,
        position: { lat: attraction.location.lat, lng: attraction.location.lng },
        content: element,
        title: attraction.name,
      });

      // Click handler
      marker.addListener("click", () => {
        onMarkerClick(attraction.id);
      });

      // Hover handlers (desktop only)
      const mouseEnterHandler = () => {
        if (onMarkerHover) {
          onMarkerHover(attraction.id);
        }
      };

      const mouseLeaveHandler = () => {
        if (onMarkerHover) {
          onMarkerHover(null);
        }
      };

      if (onMarkerHover) {
        element.addEventListener("mouseenter", mouseEnterHandler);
        element.addEventListener("mouseleave", mouseLeaveHandler);
      }

      markersRef.current.set(attraction.id, {
        marker,
        element,
        attraction: attractionScore,
        mouseEnterHandler,
        mouseLeaveHandler,
      });
    });

    // Update previous attractions reference
    previousAttractionsRef.current = attractions;
  }, [attractions, category, map, markerLibrary, isReady, onMarkerClick, onMarkerHover, createMarkerElement]);

  // Update marker styles on hover (separate effect to avoid recreating markers)
  useEffect(() => {
    markersRef.current.forEach(({ element }, id) => {
      if (id === hoveredId) {
        element.style.transform = "scale(1.3)";
        element.style.zIndex = "1000";
      } else {
        element.style.transform = "scale(1)";
        element.style.zIndex = "auto";
      }
    });
  }, [hoveredId]);

  // Cleanup on unmount
  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      markers.forEach(({ marker, element, mouseEnterHandler, mouseLeaveHandler }) => {
        marker.map = null;
        element.removeEventListener("mouseenter", mouseEnterHandler);
        element.removeEventListener("mouseleave", mouseLeaveHandler);
      });
      markers.clear();
    };
  }, []);

  return null;
}
