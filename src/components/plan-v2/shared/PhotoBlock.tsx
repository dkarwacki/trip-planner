import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import PhotoImage from "@/components/common/PhotoImage";
import { getPhotoUrl } from "@/lib/common/photo-utils";
import type { PlacePhoto } from "@/domain/common/models";

interface PhotoBlockProps {
  photos?: PlacePhoto[];
  alt: string;
  className?: string;
  eager?: boolean;
  onClick?: () => void;
}

/**
 * PhotoBlock - Image display with fallback
 *
 * Features:
 * - Displays first photo from array using PhotoImage component
 * - Fallback icon when no photos available or on error
 * - Uses existing photo proxy pattern (photoReference)
 * - Responsive sizing with lazy loading
 * - Optional click handler for lightbox
 */
export function PhotoBlock({ photos, alt, className = "", eager = false, onClick }: PhotoBlockProps) {
  const [imageError, setImageError] = useState(false);
  const photo = photos?.[0];

  if (!photo || imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${className}`}
        role="img"
        aria-label={`No photo available for ${alt}`}
      >
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  const photoElement = (
    <PhotoImage
      photoReference={photo.photoReference}
      alt={alt}
      maxWidth={800}
      className={className}
      onError={() => setImageError(true)}
      eager={eager}
    />
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative block overflow-hidden transition-opacity hover:opacity-90 cursor-pointer ${className}`}
        aria-label={`View ${alt} photos`}
      >
        <img
          src={getPhotoUrl(photo.photoReference, 800)}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
          loading={eager ? "eager" : "lazy"}
        />
      </button>
    );
  }

  return photoElement;
}
