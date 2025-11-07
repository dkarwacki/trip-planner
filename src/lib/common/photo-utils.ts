/**
 * Generate a photo URL for the backend proxy endpoint
 * With GET + Cache-Control headers, browsers will cache this automatically
 * @param photoReference - The Google Places photo reference (full resource name)
 * @param maxWidth - Maximum width of the photo (default: 800)
 * @returns URL that points to our proxy endpoint (browser will cache for 48 hours)
 */
export const getPhotoUrl = (photoReference: string, maxWidth = 800): string => {
  return `/api/photos?ref=${encodeURIComponent(photoReference)}&width=${maxWidth}`;
};

/**
 * Fetch a photo from the backend proxy endpoint
 * Note: With GET requests, browsers will automatically cache based on Cache-Control headers
 * @param photoReference - The Google Places photo reference (full resource name)
 * @param maxWidth - Maximum width of the photo (default: 800)
 * @returns Promise with the blob URL of the photo
 */
export const fetchPhoto = async (photoReference: string, maxWidth = 800): Promise<string> => {
  const url = getPhotoUrl(photoReference, maxWidth);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch photo: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
