import { getPhotoUrl } from "@/lib/common/photo-utils";
import { useState } from "react";
import { useIntersectionObserver } from "@/lib/common/use-intersection-observer";

interface PhotoImageProps {
  photoReference: string;
  alt: string;
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
  maxWidth = 800,
  className,
  onError,
  eager = false,
}: PhotoImageProps) {
  const [hasError, setHasError] = useState(false);
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0,
    rootMargin: "50px", // Start loading 50px before element enters viewport
    triggerOnce: true, // Only load once when visible
    enabled: !eager, // Skip observer if eager loading
  });

  // Generate the URL that points to our proxy endpoint
  // Browser will cache this automatically based on Cache-Control headers
  const photoUrl = getPhotoUrl(photoReference, maxWidth);

  // Only load photo when visible (or if eager loading)
  const shouldLoad = eager || isIntersecting;

  if (hasError) {
    // Hide the component if there's an error
    return null;
  }

  return (
    <div ref={ref} className={className}>
      {shouldLoad ? (
        <img
          src={photoUrl}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => {
            setHasError(true);
            if (onError) {
              onError();
            }
          }}
        />
      ) : (
        // Placeholder while image is not yet visible
        <div className="h-full w-full animate-pulse bg-muted" aria-label="Loading image" />
      )}
    </div>
  );
}
