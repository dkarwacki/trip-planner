/**
 * Mobile Suggestion Card
 * Touch-optimized suggestion card for mobile AI chat
 *
 * Features:
 * - Larger photos (full width, taller)
 * - Bigger text (18px for name vs 14-16 desktop)
 * - Touch-friendly buttons (44px minimum height)
 * - More spacing and padding
 * - Collapsible reasoning (starts collapsed on mobile)
 * - Haptic feedback on button tap
 */

import React, { useState } from "react";
import { Plus, Check, ChevronDown, Lightbulb, Loader2, Utensils, Landmark } from "lucide-react";
import type { SuggestionCardProps } from "../types";
import { PriorityBadge } from "../sidebar/ai/PriorityBadge";
import PhotoLightbox from "@/components/PhotoLightbox";

export function MobileSuggestionCard({ suggestion, isAdded, isAdding = false, onAddClick }: SuggestionCardProps) {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Truncate reasoning to 2 lines on mobile (~120 chars)
  const reasoningExcerpt =
    suggestion.reasoning.length > 120 ? suggestion.reasoning.slice(0, 120) + "..." : suggestion.reasoning;

  const shouldShowReadMore = suggestion.reasoning.length > 120;

  const isGeneralTip = suggestion.type === "general_tip";

  const handleAddClick = () => {
    if (!isAdded && !isAdding && suggestion.placeId) {
      // Haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      onAddClick(suggestion.placeId);
    }
  };

  const toggleReasoning = () => {
    setIsReasoningExpanded(!isReasoningExpanded);
  };

  const handlePhotoClick = () => {
    if (suggestion.photoUrl) {
      setIsLightboxOpen(true);
    }
  };

  // Photo optimization: Keep img tag with native lazy loading since photoUrl is a full URL
  const hasPhoto = !!suggestion.photoUrl;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Photo with priority badge - taller on mobile (or tip header for general tips) */}
        {!isGeneralTip && (
          <div className="relative aspect-[16/10] bg-gray-200">
            {hasPhoto ? (
              <button
                onClick={handlePhotoClick}
                className="w-full h-full relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                aria-label="View photo in fullscreen"
              >
                <img
                  src={suggestion.photoUrl}
                  alt={suggestion.placeName || "Place photo"}
                  loading="lazy"
                  className="w-full h-full object-cover transition-opacity duration-300 active:opacity-90"
                />
              </button>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                <span className="text-5xl">📍</span>
              </div>
            )}

            {/* Type indicator - top left */}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-md shadow-lg">
              {suggestion.type === "add_restaurant" ? (
                <Utensils className="w-4 h-4 text-orange-600" aria-label="Restaurant" />
              ) : (
                <Landmark className="w-4 h-4 text-blue-600" aria-label="Attraction" />
              )}
            </div>

            {/* Priority badge - slightly larger on mobile */}
            <div className="absolute top-3 right-3 pointer-events-none">
              <PriorityBadge priority={suggestion.priority} />
            </div>
          </div>
        )}

        {/* General tip header */}
        {isGeneralTip && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-5 py-4 flex items-center gap-3 border-b border-amber-100">
            <Lightbulb className="h-6 w-6 text-amber-600" />
            <span className="text-base font-semibold text-amber-900">Travel Tip</span>
            <div className="ml-auto">
              <PriorityBadge priority={suggestion.priority} />
            </div>
          </div>
        )}

        {/* Content - more padding on mobile */}
        <div className="p-5 space-y-4">
          {/* Name and metadata - larger text (skip for general tips) */}
          {!isGeneralTip && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-1">{suggestion.placeName}</h4>
              <div className="flex items-center gap-2 text-base text-gray-600">
                <span className="capitalize">{suggestion.category}</span>
                {suggestion.score !== null && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="font-semibold text-blue-600">{suggestion.score.toFixed(1)}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* AI reasoning - base text size for readability */}
          <div className="text-base text-gray-700">
            <p className={isReasoningExpanded ? "" : "line-clamp-2"}>
              {isReasoningExpanded ? suggestion.reasoning : reasoningExcerpt}
            </p>

            {shouldShowReadMore && (
              <button
                onClick={toggleReasoning}
                className="mt-2 text-blue-600 active:text-blue-700 font-medium flex items-center gap-1 text-sm min-h-[44px] -ml-2 pl-2 pr-4"
              >
                {isReasoningExpanded ? "Show less" : "Read more"}
                <ChevronDown className={`h-4 w-4 transition-transform ${isReasoningExpanded ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>

          {/* Action button - 44px height for touch (only for places, not general tips) */}
          {!isGeneralTip && (
            <button
              onClick={handleAddClick}
              disabled={isAdded || isAdding}
              className={`
              w-full h-11 px-4 rounded-xl font-semibold text-base
              transition-all active:scale-[0.98] flex items-center justify-center gap-2
              ${
                isAdded
                  ? "bg-green-50 text-green-700 cursor-default"
                  : isAdding
                    ? "bg-blue-50 text-blue-600 cursor-wait"
                    : "bg-blue-600 text-white active:bg-blue-700 shadow-sm active:shadow"
              }
            `}
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Adding...
                </>
              ) : isAdded ? (
                <>
                  <Check className="h-5 w-5" />
                  Added to Plan
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Add to Plan
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Photo Lightbox */}
      {suggestion.attractionData && suggestion.attractionData.photos && suggestion.attractionData.photos.length > 0 && (
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
}
