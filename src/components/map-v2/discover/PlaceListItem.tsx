/**
 * Place list item - compact view with thumbnail
 */

import React, { useState } from "react";
import type { DiscoveryItemViewModel } from "@/lib/map-v2/types";
import { MapPin, Star, Plus, CheckCircle2, Utensils, Landmark } from "lucide-react";
import { LazyImage } from "../shared/LazyImage";
import { getPlaceTypeCategory } from "@/lib/map-v2/placeTypeUtils";
import PhotoLightbox from "@/components/PhotoLightbox";
import { openInGoogleMaps } from "@/lib/common/google-maps";

interface PlaceListItemProps {
  place: DiscoveryItemViewModel;
  score: number;
  isAdded?: boolean;
  isHighlighted?: boolean;
  onHover?: (placeId: string | null) => void;
  onExpandCard?: (placeId: string) => void;
  onAddClick?: (placeId: string) => void;
}

export const PlaceListItem = React.memo(function PlaceListItem({
  place,
  score,
  isAdded = false,
  isHighlighted,
  onHover,
  onExpandCard,
  onAddClick,
}: PlaceListItemProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const photoReference = place.photos?.[0]?.photoReference;
  const placeType = getPlaceTypeCategory(place.types);

  const rating = place.rating || 0;
  const totalRatings = place.userRatingsTotal || 0;
  const category = place.types?.[0]?.replace(/_/g, " ") || "Place";
  // priceLevel only exists on RestaurantViewModel
  const priceLevel = "priceLevel" in place && place.priceLevel ? "💰".repeat(place.priceLevel) : "";

  const getScoreBadgeColor = (score: number) => {
    // With new weights (Quality 50%, Persona 10%, Diversity 20%, Confidence 20%),
    // 70+ is great (requires persona match), 60+ is good
    if (score >= 70) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    return "text-gray-600";
  };

  const handleMouseEnter = () => {
    onHover?.(place.id);
  };

  const handleMouseLeave = () => {
    onHover?.(null);
  };

  const handleClick = () => {
    onExpandCard?.(place.id);
  };

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoReference) {
      setIsLightboxOpen(true);
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddClick?.(place.id);
  };

  const handleMapsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openInGoogleMaps({
      name: place.name,
      placeId: place.id,
      location: { lat: place.latitude, lng: place.longitude },
    });
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
        isHighlighted ? "bg-blue-50 border-l-4 border-blue-600" : ""
      }`}
    >
      {/* Thumbnail Photo */}
      <div
        className={`flex-shrink-0 w-[60px] h-[60px] rounded-lg overflow-hidden bg-gray-100 relative ${photoReference ? "cursor-pointer" : ""}`}
        onClick={handlePhotoClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handlePhotoClick(e as unknown as React.MouseEvent);
          }
        }}
      >
        {photoReference ? (
          <LazyImage
            photoReference={photoReference}
            alt={place.name}
            lat={place.latitude}
            lng={place.longitude}
            placeName={place.name}
            size="thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <MapPin className="w-6 h-6" />
          </div>
        )}
        {/* Type indicator and Added badge - top of thumbnail */}
        <div className="absolute top-1 left-1 right-1 flex items-center gap-1">
          {/* Type indicator */}
          <div className="bg-white/90 backdrop-blur-sm p-0.5 rounded shadow-md">
            {placeType === "restaurant" ? (
              <Utensils className="w-2.5 h-2.5 text-orange-600" aria-label="Restaurant" />
            ) : (
              <Landmark className="w-2.5 h-2.5 text-blue-600" aria-label="Attraction" />
            )}
          </div>
          {/* Added indicator - next to type */}
          {isAdded && (
            <div className="bg-green-600 text-white p-0.5 rounded shadow-md">
              <CheckCircle2 className="w-2.5 h-2.5" />
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        {/* Place name */}
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">{place.name}</h3>

        {/* Meta info */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
          <span className="capitalize">{category}</span>
          {priceLevel && (
            <>
              <span>•</span>
              <span>{priceLevel}</span>
            </>
          )}
        </div>

        {/* Rating and score */}
        <div className="flex items-center gap-2 mt-1">
          {rating > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
              <span className="text-gray-700">{rating.toFixed(1)}</span>
              <span className="text-gray-500">({totalRatings})</span>
            </div>
          )}
          {score > 0 && (
            <span className={`text-xs font-semibold ${getScoreBadgeColor(score)}`}>
              Score: {(score / 10).toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Maps button */}
        <button
          onClick={handleMapsClick}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          aria-label={`View ${place.name} in Google Maps`}
          title="View in Google Maps"
        >
          <MapPin className="w-5 h-5" />
        </button>

        {/* Add button */}
        <button
          onClick={handleAddClick}
          disabled={isAdded}
          className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors
            ${isAdded ? "bg-green-600 text-white cursor-default" : "bg-blue-600 hover:bg-blue-700 text-white"}
          `}
          aria-label={isAdded ? `${place.name} added to plan` : `Add ${place.name} to plan`}
        >
          {isAdded ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* Photo Lightbox */}
      {place.photos && place.photos.length > 0 && (
        <PhotoLightbox
          photos={place.photos}
          initialIndex={0}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          placeName={place.name}
          lat={place.latitude}
          lng={place.longitude}
        />
      )}
    </div>
  );
});
