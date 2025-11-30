/**
 * Image optimization utilities for map components
 * Handles responsive image sizes, srcset generation, and photo URL optimization
 */

export type ImageSize = "thumbnail" | "small" | "medium" | "large";

/** Image size configurations */
export const IMAGE_SIZES: Record<ImageSize, number> = {
  thumbnail: 200, // List view
  small: 400, // Cards on mobile
  medium: 800, // Cards on desktop
  large: 1200, // Lightbox, full view
};

/**
 * Generate photo URL for our proxy endpoint
 * Note: Photos are always fetched at max size (1600px) and scaled by browser for performance
 * @param photoReference - The Google Places photo reference
 * @param width - Ignored, kept for API compatibility
 * @param lat - Latitude of the location
 * @param lng - Longitude of the location
 * @param placeName - Name of the place
 * @returns URL pointing to our photo proxy
 */
export function getPhotoUrl(
  photoReference: string,
  width: number,
  lat: number,
  lng: number,
  placeName: string
): string {
  // Width parameter is ignored - we always fetch at max size and let browser scale
  return `/api/photos?ref=${encodeURIComponent(photoReference)}&lat=${lat}&lng=${lng}&name=${encodeURIComponent(placeName)}`;
}

/**
 * Generate srcset string for responsive images
 * Note: Since we fetch all photos at max size, srcset is not needed anymore
 * This function is kept for API compatibility but returns empty string
 * @param photoReference - The Google Places photo reference
 * @param lat - Latitude of the location
 * @param lng - Longitude of the location
 * @param placeName - Name of the place
 * @param sizes - Ignored, kept for API compatibility
 * @returns Empty string (srcset disabled - using single max-size image)
 */
export function generateSrcSet(): string {
  // Disabled: We now fetch all photos at max size and let browser scale
  return "";
}

/**
 * Generate sizes attribute for responsive images
 * @param defaultSize - Default size for the image
 * @returns sizes string for img element
 */
export function generateSizes(defaultSize: ImageSize = "medium"): string {
  const defaultWidth = IMAGE_SIZES[defaultSize];

  return [
    "(max-width: 640px) 400px", // Mobile: small
    "(max-width: 1024px) 800px", // Tablet: medium
    `${defaultWidth}px`, // Desktop: default
  ].join(", ");
}

/**
 * Create a tiny placeholder URL for blur-up effect
 * This is just a very small gray placeholder for now
 * In production, you might generate actual tiny previews
 */
export function getPlaceholderUrl(): string {
  // Simple gray placeholder as base64
  // In production, you could generate actual blurred thumbnails
  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+";
}
