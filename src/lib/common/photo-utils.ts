/**
 * Generate a photo URL for the backend proxy endpoint
 * @param photoReference - The Google Places photo reference
 * @param maxWidth - Maximum width of the photo (default: 800)
 * @returns A data URL that will be set after the photo is fetched
 */
export const getPhotoUrl = (photoReference: string, maxWidth: number = 800): string => {
  // We'll use a placeholder that will be replaced by the actual photo data
  // In practice, we need to fetch this via the API
  return `/api/photos?ref=${encodeURIComponent(photoReference)}&width=${maxWidth}`;
};

/**
 * Fetch a photo from the backend proxy endpoint
 * @param photoReference - The Google Places photo reference
 * @param maxWidth - Maximum width of the photo (default: 800)
 * @returns Promise with the blob URL of the photo
 */
export const fetchPhoto = async (photoReference: string, maxWidth: number = 800): Promise<string> => {
  const response = await fetch("/api/photos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ photoReference, maxWidth }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch photo: ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

