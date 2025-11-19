/**
 * Inline suggestion card within AI chat
 * Shows place photo, priority, score, and AI reasoning
 */

import React, { useState } from "react";
import { Plus, Check, ChevronDown, Lightbulb, Loader2, Utensils, Landmark, MapPin } from "lucide-react";
import type { SuggestionCardProps } from "../../types";
import { PriorityBadge } from "./PriorityBadge";
import PhotoLightbox from "@/components/PhotoLightbox";
import { useMapStore } from "../../stores/mapStore";

export const SuggestionCard = React.memo(
  function SuggestionCard({ suggestion, isAdded, isAdding = false, onAddClick }: SuggestionCardProps) {
    const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Actions
    const setExpandedCard = useMapStore((state) => state.setExpandedCard);
    const setHighlightedPlace = useMapStore((state) => state.setHighlightedPlace);

    // Truncate reasoning to 2-3 lines (~150 chars)
    const reasoningExcerpt =
      suggestion.reasoning.length > 150 ? suggestion.reasoning.slice(0, 150) + "..." : suggestion.reasoning;

    const shouldShowReadMore = suggestion.reasoning.length > 150;

    const isGeneralTip = suggestion.type === "general_tip";

    const handleAddClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click when clicking add button
      if (!isAdded && !isAdding && suggestion.placeId) {
        onAddClick(suggestion.placeId);
      }
    };

    const handlePhotoClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click when clicking photo
      if (suggestion.photoUrl) {
        setIsLightboxOpen(true);
      }
    };

    const handleCardClick = () => {
      // Only handle click for place suggestions (not general tips)
      if (!isGeneralTip && suggestion.placeId) {
        setExpandedCard(suggestion.placeId);
        setHighlightedPlace(suggestion.placeId);
      }
    };

    const handleCardKeyDown = (e: React.KeyboardEvent) => {
      // Handle Enter or Space key for accessibility
      if ((e.key === "Enter" || e.key === " ") && !isGeneralTip) {
        e.preventDefault();
        handleCardClick();
      }
    };

    // Photo reference for LazyImage (extract from photoUrl if it's our proxy format)
    // SuggestionCard uses photoUrl (full URL), not photoReference
    // So we keep the img tag but optimize it with native lazy loading
    const hasPhoto = !!suggestion.photoUrl;

    return (
      <>
        <div
          onClick={handleCardClick}
          onKeyDown={handleCardKeyDown}
          className={`bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all ${!isGeneralTip ? "cursor-pointer hover:scale-[1.01]" : ""}`}
          role={!isGeneralTip ? "button" : undefined}
          tabIndex={!isGeneralTip ? 0 : undefined}
          aria-label={!isGeneralTip && suggestion.placeName ? `View ${suggestion.placeName} on map` : undefined}
        >
          {/* Photo with priority badge (or tip icon for general tips) */}
          {!isGeneralTip && (
            <div className="relative aspect-video bg-gray-100">
              {hasPhoto ? (
                <button
                  onClick={handlePhotoClick}
                  className="w-full h-full absolute inset-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  aria-label="View photo in fullscreen"
                >
                  <img
                    src={suggestion.photoUrl}
                    alt={suggestion.placeName || "Place photo"}
                    loading="lazy"
                    className="w-full h-full object-cover transition-opacity duration-300 hover:opacity-90 block"
                  />
                </button>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <MapPin className="w-12 h-12" />
                </div>
              )}

              {/* Type indicator - top left */}
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-md shadow-lg">
                {suggestion.type === "add_restaurant" ? (
                  <Utensils className="w-3.5 h-3.5 text-orange-600" aria-label="Restaurant" />
                ) : (
                  <Landmark className="w-3.5 h-3.5 text-blue-600" aria-label="Attraction" />
                )}
              </div>

              {/* Priority badge (right side, next to score badge horizontally) */}
              <div className="absolute top-2 right-14 pointer-events-none">
                <PriorityBadge priority={suggestion.priority} />
              </div>

              {/* Score Badge (top-right) */}
              {suggestion.score !== null && suggestion.score > 0 && (
                <div
                  className={`absolute top-2 right-2 px-2 py-1 rounded-md text-sm font-bold shadow-lg ${
                    suggestion.score >= 90
                      ? "bg-green-600 text-white"
                      : suggestion.score >= 80
                        ? "bg-blue-600 text-white"
                        : "bg-gray-600 text-white"
                  }`}
                >
                  {(suggestion.score / 10).toFixed(1)}
                </div>
              )}
            </div>
          )}

          {/* General tip header */}
          {isGeneralTip && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3 flex items-center gap-2 border-b border-amber-100">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-semibold text-amber-900">Travel Tip</span>
              <div className="ml-auto">
                <PriorityBadge priority={suggestion.priority} />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Name and metadata (skip for general tips) */}
            {!isGeneralTip && (
              <div>
                <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">{suggestion.placeName}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="capitalize">{suggestion.category}</span>
                </div>
              </div>
            )}

            {/* AI reasoning */}
            <div className="text-sm text-gray-700">
              <p className={isReasoningExpanded ? "" : "line-clamp-3"}>
                {isReasoningExpanded ? suggestion.reasoning : reasoningExcerpt}
              </p>

              {shouldShowReadMore && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click when toggling reasoning
                    setIsReasoningExpanded(!isReasoningExpanded);
                  }}
                  className="mt-1 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 text-xs"
                >
                  {isReasoningExpanded ? "Show less" : "Read more"}
                  <ChevronDown className={`h-3 w-3 transition-transform ${isReasoningExpanded ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>

            {/* Action button (only for places, not general tips) */}
            {!isGeneralTip && (
              <button
                onClick={handleAddClick}
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
                    Added to Plan
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add to Plan
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Photo Lightbox */}
        {suggestion.attractionData &&
          suggestion.attractionData.photos &&
          suggestion.attractionData.photos.length > 0 && (
            <PhotoLightbox
              photos={suggestion.attractionData.photos}
              initialIndex={0}
              isOpen={isLightboxOpen}
              onClose={() => setIsLightboxOpen(false)}
              placeName={suggestion.placeName || "Place"}
              lat={suggestion.attractionData.location.lat}
              lng={suggestion.attractionData.location.lng}
              size="large"
            />
          )}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if suggestion, isAdded, or isAdding changes
    return (
      prevProps.suggestion.placeId === nextProps.suggestion.placeId &&
      prevProps.isAdded === nextProps.isAdded &&
      prevProps.isAdding === nextProps.isAdding
    );
  }
);
