import { getPhotoUrl } from "@/lib/common/photo-utils";
import { useState } from "react";
import { useIntersectionObserver } from "@/lib/common/use-intersection-observer";

interface PhotoImageProps {
  photoReference: string;
  alt: string;
  lat: number;
  lng: number;
  placeName: string;
  maxWidth?: number;
  className?: string;
  onError?: () => void;
  // Allow disabling lazy loading for critical images (e.g., first image)
  eager?: boolean;
}

/**
 * Displays a photo from Google Places API via our proxy endpoint
 *
 * Uses Intersection Observer to only load photos when they're visible in viewport.
 * With GET requests + Cache-Control headers, the browser automatically caches photos for 48 hours.
 */
export default function PhotoImage({
  photoReference,
  alt,
  lat,
  lng,
  placeName,
  maxWidth = 800,
  className,
  onError,
  eager = false,
}: PhotoImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0,
    rootMargin: "50px", // Start loading 50px before element enters viewport
    triggerOnce: true, // Only load once when visible
    enabled: !eager, // Skip observer if eager loading
  });

  // Generate the URL that points to our proxy endpoint
  // Browser will cache this automatically based on Cache-Control headers
  const photoUrl = getPhotoUrl(photoReference, maxWidth, lat, lng, placeName);

  // Only load photo when visible (or if eager loading)
  const shouldLoad = eager || isIntersecting;

  if (hasError) {
    // Hide the component if there's an error
    return null;
  }

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton - always show as base */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-muted"
          style={{
            background: "linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2.5s ease-in-out infinite",
          }}
          aria-label="Loading image"
        />
      )}

      {shouldLoad && (
        <img
          src={photoUrl}
          alt={alt}
          className={`relative h-full w-full object-cover transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            if (onError) {
              onError();
            }
          }}
        />
      )}
    </div>
  );
}
