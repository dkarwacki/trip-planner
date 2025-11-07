import { getPhotoUrl } from "@/lib/common/photo-utils";
import { useState } from "react";

interface PhotoImageProps {
  photoReference: string;
  alt: string;
  maxWidth?: number;
  className?: string;
  onError?: () => void;
}

/**
 * Displays a photo from Google Places API via our proxy endpoint
 *
 * With GET requests + Cache-Control headers, the browser automatically caches photos for 48 hours.
 * No need to manually manage blob URLs or client-side caching - just use the URL directly!
 */
export default function PhotoImage({ photoReference, alt, maxWidth = 800, className, onError }: PhotoImageProps) {
  const [hasError, setHasError] = useState(false);

  // Generate the URL that points to our proxy endpoint
  // Browser will cache this automatically based on Cache-Control headers
  const photoUrl = getPhotoUrl(photoReference, maxWidth);

  if (hasError) {
    // Hide the component if there's an error
    return null;
  }

  return (
    <img
      src={photoUrl}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        setHasError(true);
        if (onError) {
          onError();
        }
      }}
    />
  );
}
