/**
 * Hook to detect when map has panned away from a reference location
 * Shows "Search This Area" button when user pans >2km from selected place
 */

import { useState, useEffect, useCallback } from 'react';

interface Location {
  lat: number;
  lng: number;
}

interface UseMapPanDetectionOptions {
  thresholdKm?: number; // Distance threshold in kilometers
  debounceMs?: number; // Debounce time for pan detection
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function useMapPanDetection(
  referenceLocation: Location | null,
  currentMapCenter: Location | null,
  options: UseMapPanDetectionOptions = {}
) {
  const { thresholdKm = 2, debounceMs = 100 } = options;
  
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const [distanceFromReference, setDistanceFromReference] = useState<number>(0);

  const checkDistance = useCallback(() => {
    if (!referenceLocation || !currentMapCenter) {
      setShouldShowButton(false);
      setDistanceFromReference(0);
      return;
    }

    const distance = haversineDistance(
      referenceLocation.lat,
      referenceLocation.lng,
      currentMapCenter.lat,
      currentMapCenter.lng
    );

    setDistanceFromReference(distance);
    setShouldShowButton(distance > thresholdKm);
  }, [referenceLocation, currentMapCenter, thresholdKm]);

  // Debounce the distance check to avoid excessive calculations
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkDistance();
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [checkDistance, debounceMs]);

  const hideButton = useCallback(() => {
    setShouldShowButton(false);
  }, []);

  return {
    shouldShowButton,
    distanceFromReference,
    hideButton,
  };
}

