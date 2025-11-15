/**
 * Image optimization utilities for map-v2 components
 * Handles responsive image sizes, srcset generation, and photo URL optimization
 */

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large';

/** Image size configurations */
export const IMAGE_SIZES: Record<ImageSize, number> = {
  thumbnail: 200,  // List view
  small: 400,      // Cards on mobile
  medium: 800,     // Cards on desktop
  large: 1200,     // Lightbox, full view
};

/**
 * Generate photo URL for our proxy endpoint
 * @param photoReference - The Google Places photo reference
 * @param width - Desired width in pixels
 * @returns URL pointing to our photo proxy
 */
export function getPhotoUrl(photoReference: string, width: number): string {
  return `/api/photos?ref=${encodeURIComponent(photoReference)}&width=${width}`;
}

/**
 * Generate srcset string for responsive images
 * @param photoReference - The Google Places photo reference
 * @param sizes - Array of image sizes to include in srcset
 * @returns srcset string for img element
 */
export function generateSrcSet(
  photoReference: string,
  sizes: ImageSize[] = ['small', 'medium', 'large']
): string {
  return sizes
    .map((size) => {
      const width = IMAGE_SIZES[size];
      return `${getPhotoUrl(photoReference, width)} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 * @param defaultSize - Default size for the image
 * @returns sizes string for img element
 */
export function generateSizes(defaultSize: ImageSize = 'medium'): string {
  const defaultWidth = IMAGE_SIZES[defaultSize];
  
  return [
    '(max-width: 640px) 400px',    // Mobile: small
    '(max-width: 1024px) 800px',   // Tablet: medium
    `${defaultWidth}px`,           // Desktop: default
  ].join(', ');
}

/**
 * Create a tiny placeholder URL for blur-up effect
 * This is just a very small gray placeholder for now
 * In production, you might generate actual tiny previews
 */
export function getPlaceholderUrl(): string {
  // Simple gray placeholder as base64
  // In production, you could generate actual blurred thumbnails
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+';
}

