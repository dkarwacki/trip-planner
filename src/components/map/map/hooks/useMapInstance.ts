import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

/**
 * Hook to access the Google Maps instance
 * Must be used within a Map component
 */
export function useMapInstance() {
  const map = useMap();
  const markerLibrary = useMapsLibrary("marker");
  const placesLibrary = useMapsLibrary("places");

  return {
    map,
    markerLibrary,
    placesLibrary,
    isReady: !!map && !!markerLibrary,
  };
}
