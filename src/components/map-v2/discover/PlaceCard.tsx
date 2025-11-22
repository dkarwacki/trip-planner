/**
 * Place card - large photo card with details
 * Stage 3.2: Large Photo Card View
 */

import React, { useState } from "react";
import type { Attraction } from "@/domain/map/models";
import PhotoLightbox from "@/components/PhotoLightbox";
import { BasePlaceCard } from "../shared/BasePlaceCard";
import { getGoogleMapsUrl } from "@/lib/common/google-maps";
import { MapPin } from "lucide-react";

interface PlaceCardProps {
  place: Attraction;
  score: number;
  isAdded: boolean;
  onAddClick: (placeId: string) => void;
  onCardClick: (placeId: string) => void;
  isHighlighted?: boolean;
  onHover?: (placeId: string | null) => void;
}

export const PlaceCard = React.memo(function PlaceCard({
  place,
  score,
  isAdded,
  onAddClick,
  onCardClick,
  isHighlighted,
  onHover,
}: PlaceCardProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleMouseEnter = () => {
    onHover?.(place.id);
  };

  const handleMouseLeave = () => {
    onHover?.(null);
  };

  const handleAddButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddClick(place.id);
  };

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (place.photos && place.photos.length > 0) {
      setIsLightboxOpen(true);
    }
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCardClick(place.id);
    }
  };

  return (
    <>
      <div
        onClick={() => onCardClick(place.id)}
        onKeyDown={handleCardKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${place.name}`}
        className={`transition-all duration-200 hover:scale-[1.01] ${
          isHighlighted ? "ring-2 ring-blue-200 rounded-xl" : ""
        }`}
      >
        <BasePlaceCard
          place={place}
          score={score}
          isAdded={isAdded}
          onAddClick={handleAddButtonClick}
          onPhotoClick={handlePhotoClick}
          showScoreTooltip={false}
          className={isHighlighted ? "border-blue-600 border-2" : "border-gray-200"}
        >
          <div className="border-t border-gray-100 pt-3 mt-2">
            <a
              href={getGoogleMapsUrl({
                name: place.name,
                placeId: place.id,
                location: place.location,
              })}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              View on Google Maps
            </a>
          </div>
        </BasePlaceCard>
      </div>

      {/* Photo Lightbox */}
      {place.photos && place.photos.length > 0 && (
        <PhotoLightbox
          photos={place.photos}
          initialIndex={0}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          placeName={place.name}
          lat={place.location.lat}
          lng={place.location.lng}
        />
      )}
    </>
  );
});
