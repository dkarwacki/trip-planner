/**
 * Photo grid item - individual photo with overlay information
 */

import React, { useState } from "react";
import type { Attraction } from "@/domain/map/models";
import { Plus, CheckCircle2, Utensils, Landmark, MapPin } from "lucide-react";
import { LazyImage } from "../shared/LazyImage";
import { getPlaceTypeCategory } from "@/lib/map-v2/placeTypeUtils";
import { getGoogleMapsUrl } from "@/lib/common/google-maps";

interface PhotoGridItemProps {
  place: Attraction;
  score: number;
  isAdded?: boolean;
  isHighlighted?: boolean;
  onHover?: (placeId: string | null) => void;
  onExpandCard?: (placeId: string) => void;
  onAddClick?: (placeId: string) => void;
}

export const PhotoGridItem = React.memo(function PhotoGridItem({
  place,
  score,
  isAdded = false,
  isHighlighted,
  onHover,
  onExpandCard,
  onAddClick,
}: PhotoGridItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const photoReference = place.photos?.[0]?.photoReference;
  const placeType = getPlaceTypeCategory(place.types);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-600/90";
    if (score >= 80) return "bg-blue-600/90";
    return "bg-gray-600/90";
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(place.id);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(null);
  };

  const handleClick = () => {
    onExpandCard?.(place.id);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddClick?.(place.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  if (!photoReference) {
    return null;
  }

  return (
    <div
      className={`relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer group ${
        isHighlighted ? "ring-4 ring-blue-600 ring-offset-2" : ""
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${place.name}`}
    >
      {/* Photo */}
      <LazyImage
        photoReference={photoReference}
        alt={place.name}
        lat={place.location.lat}
        lng={place.location.lng}
        placeName={place.name}
        size="medium"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Type indicator and Added badge - top left */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
        {/* Type indicator */}
        <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-md shadow-lg">
          {placeType === "restaurant" ? (
            <Utensils className="w-3.5 h-3.5 text-orange-600" aria-label="Restaurant" />
          ) : (
            <Landmark className="w-3.5 h-3.5 text-blue-600" aria-label="Attraction" />
          )}
        </div>

        {/* Added Badge - next to type indicator */}
        {isAdded && (
          <div className="bg-green-600 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Added</span>
          </div>
        )}
      </div>

      {/* Score badge */}
      {score > 0 && (
        <div
          className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white ${getScoreBadgeColor(score)}`}
        >
          {(score / 10).toFixed(1)}
        </div>
      )}

      {/* Place name overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white font-semibold text-sm line-clamp-2 cursor-default">{place.name}</h3>
      </div>

      {/* View on Google Maps button (visible on hover) */}
      {isHovered && (
        <a
          href={getGoogleMapsUrl({
            name: place.name,
            placeId: place.id,
            location: place.location,
          })}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-2 p-1.5 bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 rounded-full shadow-md transition-all z-20 ${
            score > 0 ? "right-14" : "right-2"
          }`}
          aria-label="View on Google Maps"
          title="View on Google Maps"
        >
          <MapPin className="w-3.5 h-3.5" />
        </a>
      )}

      {/* Quick add button (visible on hover, hidden if already added) */}
      {isHovered && !isAdded && (
        <button
          onClick={handleAddClick}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all animate-in fade-in zoom-in duration-200 z-10"
          aria-label={`Add ${place.name} to plan`}
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
});
