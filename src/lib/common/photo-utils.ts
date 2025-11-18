/**
 * Generate a photo URL for the backend proxy endpoint
 * With GET + Cache-Control headers, browsers will cache this automatically
 * @param photoReference - The Google Places photo reference (full resource name)
 * @param maxWidth - Maximum width of the photo (default: 800)
 * @param lat - Latitude of the location
 * @param lng - Longitude of the location
 * @param placeName - Name of the place
 * @returns URL that points to our proxy endpoint (browser will cache for 48 hours)
 */
export const getPhotoUrl = (photoReference: string, maxWidth: number, lat: number, lng: number, placeName: string): string => {
  // Width parameter is ignored - we always fetch at max size and let browser scale
  return `/api/photos?ref=${encodeURIComponent(photoReference)}&lat=${lat}&lng=${lng}&name=${encodeURIComponent(placeName)}`;
};

/**
 * Fetch a photo from the backend proxy endpoint
 * Note: With GET requests, browsers will automatically cache based on Cache-Control headers
 * @param photoReference - The Google Places photo reference (full resource name)
 * @param maxWidth - Maximum width of the photo (default: 800)
 * @param lat - Latitude of the location
 * @param lng - Longitude of the location
 * @param placeName - Name of the place
 * @returns Promise with the blob URL of the photo
 */
export const fetchPhoto = async (photoReference: string, maxWidth: number, lat: number, lng: number, placeName: string): Promise<string> => {
  const url = getPhotoUrl(photoReference, maxWidth, lat, lng, placeName);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch photo: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
