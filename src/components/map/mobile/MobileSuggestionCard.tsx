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
import { ChevronDown, Lightbulb } from "lucide-react";
import type { SuggestionCardProps } from "../types";
import { PriorityBadge } from "../sidebar/ai/PriorityBadge";
import PhotoLightbox from "@/components/map/shared/PhotoLightbox";
import { useMapStore } from "../stores/mapStore";
import { BasePlaceCard } from "../shared/BasePlaceCard";

export function MobileSuggestionCard({ suggestion, isAdded, isAdding = false, onAddClick }: SuggestionCardProps) {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const setExpandedCard = useMapStore((state) => state.setExpandedCard);
  const setHighlightedPlace = useMapStore((state) => state.setHighlightedPlace);

  // Truncate reasoning to 2 lines on mobile (~120 chars)
  const reasoningExcerpt =
    suggestion.reasoning.length > 120 ? suggestion.reasoning.slice(0, 120) + "..." : suggestion.reasoning;

  const shouldShowReadMore = suggestion.reasoning.length > 120;

  const isGeneralTip = suggestion.type === "general_tip";

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking add button
    if (!isAdded && !isAdding && suggestion.placeId) {
      // Haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      onAddClick(suggestion.placeId);
    }
  };

  const toggleReasoning = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when toggling reasoning
    setIsReasoningExpanded(!isReasoningExpanded);
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

  // Construct place object for BasePlaceCard
  const placeForBaseCard = {
    id: suggestion.placeId || "",
    name: suggestion.placeName || "",
    latitude: suggestion.attractionData?.latitude || 0,
    longitude: suggestion.attractionData?.longitude || 0,
    photos: suggestion.photoUrl ? [{ photoReference: suggestion.photoUrl }] : [],
    types: suggestion.type === "add_restaurant" ? ["restaurant"] : ["tourist_attraction"],
    // Add other fields if available in suggestion
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm active:scale-[0.99] transition-transform ${!isGeneralTip ? "active:bg-gray-50" : ""}`}
        role={!isGeneralTip ? "button" : undefined}
        tabIndex={!isGeneralTip ? 0 : undefined}
        aria-label={!isGeneralTip && suggestion.placeName ? `View ${suggestion.placeName} on map` : undefined}
      >
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

        {!isGeneralTip ? (
          <BasePlaceCard
            place={placeForBaseCard}
            score={suggestion.score || 0}
            isAdded={isAdded}
            isAdding={isAdding}
            onAddClick={handleAddClick}
            onPhotoClick={handlePhotoClick}
            className="border-0 shadow-none rounded-none"
            photoAspectRatio="aspect-[16/10]"
            actionButtonLabel="Add to Plan"
            showActions={true}
          >
            {/* Priority badge overlay */}
            <div className="absolute top-3 right-16 pointer-events-none z-10">
              <PriorityBadge priority={suggestion.priority} />
            </div>

            {/* AI Reasoning Content */}
            <div className="text-base text-gray-700 mt-2">
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
          </BasePlaceCard>
        ) : (
          // Content for General Tips (no BasePlaceCard)
          <div className="p-5 space-y-4">
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
          </div>
        )}
      </div>

      {/* Photo Lightbox */}
      {suggestion.attractionData && suggestion.attractionData.photos && suggestion.attractionData.photos.length > 0 && (
        <PhotoLightbox
          photos={suggestion.attractionData.photos}
          initialIndex={0}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          placeName={suggestion.placeName || "Place"}
          lat={suggestion.attractionData.latitude}
          lng={suggestion.attractionData.longitude}
          size="large"
        />
      )}
    </>
  );
}
