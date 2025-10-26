/**
 * Calculate distance between two geographic points in meters.
 * Uses Google Maps Geometry library's spherical distance calculation.
 *
 * @param point1 - First point with lat/lng
 * @param point2 - Second point with lat/lng
 * @returns Distance in meters, or 0 if geometry library is not loaded
 */
export const calculateDistance = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number => {
  if (!google?.maps?.geometry?.spherical) {
    // eslint-disable-next-line no-console
    console.warn("Google Maps geometry library not loaded yet");
    return 0;
  }

  const latLng1 = new google.maps.LatLng(point1.lat, point1.lng);
  const latLng2 = new google.maps.LatLng(point2.lat, point2.lng);

  return google.maps.geometry.spherical.computeDistanceBetween(latLng1, latLng2);
};

/**
 * Minimum distance (in meters) user must pan before "Search this area" button appears.
 */
export const SEARCH_NEARBY_DISTANCE_THRESHOLD = 2000; // 2km
