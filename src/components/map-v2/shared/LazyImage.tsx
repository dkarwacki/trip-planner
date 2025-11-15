import { useState, useEffect } from "react";
import { useIntersectionObserver } from "@/lib/common/use-intersection-observer";
import {
  getPhotoUrl,
  generateSrcSet,
  generateSizes,
  getPlaceholderUrl,
  type ImageSize,
  IMAGE_SIZES,
} from "@/lib/map-v2/imageOptimization";

interface LazyImageProps {
  photoReference: string;
  alt: string;
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
  /** Enable responsive srcset */
  responsive?: boolean;
  /** Show blur-up placeholder */
  blurUp?: boolean;
}

/**
 * Optimized image component with lazy loading, blur-up, and responsive srcset
 * 
 * Features:
 * - Lazy loading using IntersectionObserver
 * - Blur-up placeholder while loading
 * - Responsive srcset for different screen sizes
 * - Smooth fade-in animation
 * - Error handling with fallback
 */
export function LazyImage({
  photoReference,
  alt,
  size = 'medium',
  width,
  className = "",
  onError,
  eager = false,
  responsive = true,
  blurUp = true,
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
        <svg
          className="h-8 w-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
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
      {/* Blur-up placeholder */}
      {blurUp && !isLoaded && shouldLoad && (
        <img
          src={getPlaceholderUrl()}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-sm"
        />
      )}

      {/* Loading skeleton */}
      {!shouldLoad && (
        <div
          className="h-full w-full animate-pulse bg-muted"
          aria-label="Loading image"
        />
      )}

      {/* Main image */}
      {shouldLoad && (
        <img
          src={getPhotoUrl(photoReference, imageWidth)}
          srcSet={responsive ? generateSrcSet(photoReference) : undefined}
          sizes={responsive ? generateSizes(size) : undefined}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          onLoad={handleLoad}
          onError={handleError}
          className={`h-full w-full object-cover transition-opacity duration-200 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}

