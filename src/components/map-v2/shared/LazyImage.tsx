import { useState, useEffect } from "react";
import { useIntersectionObserver } from "@/lib/common/use-intersection-observer";
import { getPhotoUrl, type ImageSize, IMAGE_SIZES } from "@/lib/map-v2/imageOptimization";

interface LazyImageProps {
  photoReference: string;
  alt: string;
  /** Latitude of the location */
  lat: number;
  /** Longitude of the location */
  lng: number;
  /** Name of the place */
  placeName: string;
  /** Default size for the image */
  size?: ImageSize;
  /** Custom width (overrides size) */
  width?: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Disable lazy loading for critical images */
  eager?: boolean;
}

/**
 * Optimized image component with lazy loading and smooth fade-in
 *
 * Features:
 * - Lazy loading using IntersectionObserver
 * - Shimmer loading animation
 * - Smooth fade-in animation
 * - Error handling with fallback
 * - Photos always fetched at max size for optimal caching
 */
export function LazyImage({
  photoReference,
  alt,
  lat,
  lng,
  placeName,
  size = "medium",
  width,
  className = "",
  onError,
  eager = false,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0,
    rootMargin: "100px", // Start loading 100px before visible
    triggerOnce: true,
    enabled: !eager,
  });

  const shouldLoad = eager || isIntersecting;
  const imageWidth = width ?? IMAGE_SIZES[size];

  // Check if photoReference is already a full URL
  const isFullUrl = photoReference.startsWith("http") || photoReference.startsWith("/api/");

  // Construct image URL - use as-is if already a full URL, otherwise construct it
  const imageUrl = isFullUrl ? photoReference : getPhotoUrl(photoReference, imageWidth, lat, lng, placeName);

  // Reset loaded state when photo reference changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [photoReference]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    // Show error placeholder
    return (
      <div
        ref={ref}
        className={`flex items-center justify-center bg-muted ${className}`}
        aria-label="Image failed to load"
      >
        <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton - always show when not loaded */}
      {!isLoaded && (
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2.5s ease-in-out infinite",
          }}
          aria-label="Loading image"
        />
      )}

      {/* Main image */}
      {shouldLoad && (
        <img
          key={photoReference}
          src={imageUrl}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          onLoad={handleLoad}
          onError={handleError}
          className={`relative h-full w-full object-cover transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
