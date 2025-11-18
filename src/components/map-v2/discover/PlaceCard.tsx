/**
 * Place card - large photo card with details
 * Stage 3.2: Large Photo Card View
 */

import React from "react";
import type { Attraction } from "@/domain/map/models";
import { MapPin, Star, CheckCircle2, Utensils, Landmark } from "lucide-react";
import { LazyImage } from "../shared/LazyImage";
import { getPlaceTypeCategory } from "@/lib/map-v2/placeTypeUtils";

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
  // Get photo reference from place photos
  const photoReference = place.photos?.[0]?.photoReference;
  const placeType = getPlaceTypeCategory(place.types);

  // Format rating
  const rating = place.rating || 0;
  const totalRatings = place.userRatingsTotal || 0;

  // Get category from types (simplified)
  const category = place.types?.[0]?.replace(/_/g, " ") || "Place";
  const priceLevel = place.priceLevel ? "💰".repeat(place.priceLevel) : "";

  // Score badge color
  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-600 text-white";
    if (score >= 80) return "bg-blue-600 text-white";
    return "bg-gray-600 text-white";
  };

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

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCardClick(place.id);
    }
  };

  return (
    <div
      onClick={() => onCardClick(place.id)}
      onKeyDown={handleCardKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${place.name}`}
      className={`bg-white rounded-lg border overflow-hidden cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all duration-200 ${
        isHighlighted
          ? "border-blue-600 border-2 ring-2 ring-blue-200"
          : isAdded
            ? "border-green-500 border-2"
            : "border-gray-200"
      }`}
    >
      {/* Hero Photo */}
      <div className="relative aspect-video bg-gray-100">
        {photoReference ? (
          <LazyImage
            photoReference={photoReference}
            alt={place.name}
            lat={place.location.lat}
            lng={place.location.lng}
            placeName={place.name}
            size="medium"
            className={`w-full h-full object-cover ${isAdded ? "opacity-90" : ""}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <MapPin className="w-12 h-12" />
          </div>
        )}

        {/* Type indicator and Added badge - top left */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
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
            <div className="bg-green-600 text-white px-2.5 py-1 rounded-md text-xs font-semibold shadow-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Added</span>
            </div>
          )}
        </div>

        {/* Score Badge */}
        {score > 0 && (
          <div
            className={`absolute top-2 right-2 px-2 py-1 rounded-md text-sm font-bold shadow-lg ${getScoreBadgeColor(score)}`}
          >
            {(score / 10).toFixed(1)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Place Name */}
        <h3 className="font-semibold text-gray-900 text-base line-clamp-1">{place.name}</h3>

        {/* Meta Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="capitalize">{category}</span>
          {priceLevel && (
            <>
              <span>•</span>
              <span>{priceLevel}</span>
            </>
          )}
          {place.vicinity && (
            <>
              <span>•</span>
              <span className="line-clamp-1">{place.vicinity}</span>
            </>
          )}
        </div>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? "fill-current" : ""}`} />
              ))}
            </div>
            <span className="text-gray-600">({totalRatings.toLocaleString()} reviews)</span>
          </div>
        )}

        {/* Add to Plan Button */}
        <button
          onClick={handleAddButtonClick}
          disabled={isAdded}
          className={`
            w-full py-2.5 rounded-lg font-medium transition-colors
            ${
              isAdded
                ? "bg-green-100 text-green-700 cursor-default"
                : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
            }
          `}
        >
          {isAdded ? "✓ Added" : "+ Add to Plan"}
        </button>
      </div>
    </div>
  );
});
