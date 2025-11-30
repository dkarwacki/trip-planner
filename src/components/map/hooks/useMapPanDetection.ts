/**
 * Hook to detect when map has panned away from a reference location
 * Shows "Search This Area" button when user pans beyond threshold distance from last search
 */

import { useState, useEffect, useCallback } from "react";

interface Location {
  lat: number;
  lng: number;
}

interface UseMapPanDetectionOptions {
  thresholdKm?: number; // Distance threshold in kilometers
  debounceMs?: number; // Debounce time for pan detection
}

/**
 * Calculate distance between two coordinates using Google Maps geometry library
 * Returns distance in meters (converted from km threshold in the comparison)
 */
function calculateDistance(point1: Location, point2: Location): number {
  if (!google?.maps?.geometry?.spherical) {
    // eslint-disable-next-line no-console
    console.warn("Google Maps geometry library not loaded yet");
    return 0;
  }

  const latLng1 = new google.maps.LatLng(point1.lat, point1.lng);
  const latLng2 = new google.maps.LatLng(point2.lat, point2.lng);

  return google.maps.geometry.spherical.computeDistanceBetween(latLng1, latLng2);
}

export function useMapPanDetection(
  searchCenters: Location[],
  currentMapCenter: Location | null,
  fallbackLocation: Location | null,
  options: UseMapPanDetectionOptions = {}
) {
  const { thresholdKm = 2, debounceMs = 100 } = options;

  const [shouldShowButton, setShouldShowButton] = useState(false);
  const [minDistanceFromSearches, setMinDistanceFromSearches] = useState<number>(0);

  const checkDistance = useCallback(() => {
    if (!currentMapCenter) {
      setShouldShowButton(false);
      setMinDistanceFromSearches(0);
      return;
    }

    // If there are search centers, check distance from all of them
    if (searchCenters.length > 0) {
      // Calculate distance to each search center and find the minimum
      const distances = searchCenters.map((center) => {
        const distanceInMeters = calculateDistance(center, currentMapCenter);
        return distanceInMeters / 1000; // Convert to km
      });

      const minDistance = Math.min(...distances);
      setMinDistanceFromSearches(minDistance);

      // Show button only if we're far enough from ALL search centers
      setShouldShowButton(minDistance > thresholdKm);
    } else if (fallbackLocation) {
      // No searches yet, check distance from fallback (selected place)
      const distanceInMeters = calculateDistance(fallbackLocation, currentMapCenter);
      const distanceInKm = distanceInMeters / 1000;

      setMinDistanceFromSearches(distanceInKm);
      setShouldShowButton(distanceInKm > thresholdKm);
    } else {
      // No reference point at all
      setShouldShowButton(false);
      setMinDistanceFromSearches(0);
    }
  }, [searchCenters, currentMapCenter, fallbackLocation, thresholdKm]);

  // Debounce the distance check to avoid excessive calculations
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkDistance();
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [checkDistance, debounceMs]);

  return {
    shouldShowButton,
    minDistanceFromSearches,
  };
}
