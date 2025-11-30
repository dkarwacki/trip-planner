import { useState, useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { useMapStore } from "../../stores/mapStore";

export function useMapState() {
  const map = useMap();
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(0);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isDesktop, setIsDesktop] = useState(false);
  const hasInitializedRef = useRef(false);

  const addSearchCenter = useMapStore((state) => state.addSearchCenter);
  const closeCard = useMapStore((state) => state.closeCard);

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

  // Track map center and zoom changes
  useEffect(() => {
    if (!map) return;

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

    // Initialize center and zoom immediately
    const center = map.getCenter();
    const zoom = map.getZoom();
    if (zoom !== undefined) {
      setMapZoom(zoom);
    }
    if (center) {
      const centerCoords = { lat: center.lat(), lng: center.lng() };
      setMapCenter(centerCoords);

      if (!hasInitializedRef.current) {
        addSearchCenter(centerCoords);
        hasInitializedRef.current = true;
      }
    }

    return () => {
      google.maps.event.removeListener(idleListener);
    };
  }, [map, addSearchCenter]);

  // Add click listener to close cards
  useEffect(() => {
    if (!map) return;

    const clickListener = map.addListener("click", () => {
      closeCard();
    });

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, closeCard]);

  return {
    map,
    mapCenter,
    mapZoom,
    viewportSize,
    isDesktop,
  };
}
