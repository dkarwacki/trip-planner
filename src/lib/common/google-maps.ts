/**
 * Google Maps URL helper functions
 */

interface Location {
  lat: number;
  lng: number;
}

/**
 * Generates a Google Maps URL for a place
 * Tries to be as specific as possible with the available data
 */
export function getGoogleMapsUrl(place: {
  name: string;
  placeId?: string;
  location?: Location;
}): string {
  const baseUrl = "https://www.google.com/maps/search/?api=1";

  // If we have a place ID, that's the most specific way to link
  if (place.placeId) {
    return `${baseUrl}&query=${encodeURIComponent(place.name)}&query_place_id=${place.placeId}`;
  }

  // If we have location coordinates, use them
  if (place.location) {
    return `${baseUrl}&query=${place.location.lat},${place.location.lng}`;
  }

  // Fallback to searching by name
  return `${baseUrl}&query=${encodeURIComponent(place.name)}`;
}

/**
 * Opens the Google Maps URL in a new tab
 */
export function openInGoogleMaps(place: {
  name: string;
  placeId?: string;
  location?: Location;
}) {
  const url = getGoogleMapsUrl(place);
  window.open(url, "_blank", "noopener,noreferrer");
}

