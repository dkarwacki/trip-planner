import React from "react";
import { MapPin, Utensils, Landmark, CheckCircle2, Plus, Check, Loader2 } from "lucide-react";
import { LazyImage } from "./LazyImage";
import { ScoreBadge } from "./ScoreBadge";
import { getPlaceTypeCategory } from "@/lib/map-v2/placeTypeUtils";

export interface BasePlaceCardProps {
  place: {
    id: string;
    name: string;
    location: { lat: number; lng: number };
    photos?: { photoReference: string }[];
    types?: string[];
    rating?: number;
    userRatingsTotal?: number;
    priceLevel?: number;
    vicinity?: string;
  };
  score?: number;
  breakdown?: {
    qualityScore: number;
    diversityScore?: number;
    confidenceScore: number;
  };
  isAdded: boolean;
  isAdding?: boolean;
  onAddClick: (e: React.MouseEvent) => void;
  onPhotoClick?: (e: React.MouseEvent) => void;
  className?: string;
  children?: React.ReactNode;
  showScore?: boolean;
  showScoreTooltip?: boolean;
  showTypeIcon?: boolean;
  showActions?: boolean;
  actionButtonLabel?: string;
  addedLabel?: string;
  photoAspectRatio?: string;
}

export function BasePlaceCard({
  place,
  score,
  breakdown,
  isAdded,
  isAdding = false,
  onAddClick,
  onPhotoClick,
  className = "",
  children,
  showScore = true,
  showScoreTooltip = true,
  showTypeIcon = true,
  showActions = true,
  actionButtonLabel = "Add to Plan",
  addedLabel = "Added to Plan",
  photoAspectRatio = "aspect-video",
}: BasePlaceCardProps) {
  const photoReference = place.photos?.[0]?.photoReference;
  const placeType = getPlaceTypeCategory(place.types);

  // Format rating
  const rating = place.rating || 0;
  const totalRatings = place.userRatingsTotal || 0;

  // Get category from types (simplified)
  const category = place.types?.[0]?.replace(/_/g, " ") || "Place";
  const priceLevel = place.priceLevel ? "💰".repeat(place.priceLevel) : "";

  return (
    <div className={`bg-white rounded-xl border overflow-hidden shadow-sm ${className}`}>
      {/* Hero Photo */}
      <div
        className={`relative ${photoAspectRatio} bg-gray-100 ${photoReference && onPhotoClick ? "cursor-pointer" : ""}`}
        onClick={onPhotoClick}
      >
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
          {showTypeIcon && (
            <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-md shadow-lg">
              {placeType === "restaurant" ? (
                <Utensils className="w-3.5 h-3.5 text-orange-600" aria-label="Restaurant" />
              ) : (
                <Landmark className="w-3.5 h-3.5 text-blue-600" aria-label="Attraction" />
              )}
            </div>
          )}

          {/* Added Badge */}
          {isAdded && (
            <div className="bg-green-600 text-white px-2.5 py-1 rounded-md text-xs font-semibold shadow-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Added</span>
            </div>
          )}
        </div>

        {/* Score Badge */}
        {showScore && score !== undefined && score > 0 && (
          <div className="absolute top-2 right-2">
            <ScoreBadge score={score} breakdown={breakdown} size="sm" showTooltip={showScoreTooltip} />
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
              <span className="font-medium text-gray-900">{rating.toFixed(1)}</span>
              <span className="text-yellow-400">★</span>
            </div>
            <span className="text-gray-600">({totalRatings.toLocaleString()} reviews)</span>
          </div>
        )}

        {/* Custom Content */}
        {children}

        {/* Action Button */}
        {showActions && (
          <button
            onClick={onAddClick}
            disabled={isAdded || isAdding}
            className={`
              w-full py-2.5 px-4 rounded-lg font-medium text-sm
              transition-colors flex items-center justify-center gap-2
              ${
                isAdded
                  ? "bg-green-50 text-green-700 cursor-default"
                  : isAdding
                    ? "bg-blue-50 text-blue-600 cursor-wait"
                    : "bg-blue-600 text-white hover:bg-blue-700"
              }
            `}
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : isAdded ? (
              <>
                <Check className="h-4 w-4" />
                {addedLabel}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {actionButtonLabel}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
