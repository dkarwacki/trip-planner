import React, { useState } from "react";
import { MapPin, Plus, Check, Loader2 } from "lucide-react";
import { PhotoBlock } from "../shared/PhotoBlock";
import { ReasoningSection } from "./ReasoningSection";
import { ValidationBadge } from "../shared/ValidationBadge";
import PhotoLightbox from "@/components/map/shared/PhotoLightbox";
import type { PlaceSuggestion } from "@/domain/plan/models/ChatMessage";
import { getGoogleMapsUrl } from "@/lib/common/google-maps";

/**
 * Parse markdown-style bold text (**text**)
 */
function parseBoldText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const segments = text.split(/(\*\*[^*]+\*\*)/g);

  segments.forEach((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      // This is bold text
      const boldText = segment.slice(2, -2).trim();
      parts.push(
        <span key={`bold-${index}`} className="font-semibold">
          {boldText}
        </span>
      );
    } else if (segment.trim()) {
      // Regular text
      parts.push(<span key={`text-${index}`}>{segment}</span>);
    }
  });

  return parts;
}

interface PlaceSuggestionCardProps {
  place: PlaceSuggestion;
  onAdd: (place: PlaceSuggestion) => void;
  isAdded?: boolean;
  isAdding?: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * PlaceSuggestionCard - Rich place card with validation
 *
 * Features:
 * - Photo display with fallback
 * - Name and location context
 * - Validation status badge
 * - Description
 * - Collapsible reasoning
 * - Add to plan button with states
 * - Duplicate detection
 */
export function PlaceSuggestionCard({
  place,
  onAdd,
  isAdded = false,
  isAdding = false,
  scrollRef,
}: PlaceSuggestionCardProps) {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const canAdd = place.validationStatus === "verified" && !isAdded && !isAdding;

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd(place);
  };

  return (
    <div
      ref={scrollRef}
      className={`rounded-lg border bg-card transition-all ${isHighlighted ? "ring-2 ring-primary" : ""}`}
      onTransitionEnd={() => setIsHighlighted(false)}
      data-testid="place-suggestion-card"
    >
      {/* Photo */}
      <PhotoBlock
        photos={place.photos}
        alt={place.name}
        lat={place.lat || 0}
        lng={place.lng || 0}
        placeName={place.name}
        className="h-48 w-full rounded-t-lg"
        onClick={place.photos && place.photos.length > 0 ? () => setIsLightboxOpen(true) : undefined}
      />

      {/* Content */}
      <div className="flex flex-col p-4 min-h-[280px]">
        {/* Top section - grows/shrinks */}
        <div className="flex-1 space-y-3">
          {/* Header: Name and validation */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-tight" data-testid="place-name">{place.name}</h3>
              <ValidationBadge status={place.validationStatus} size="sm" />
            </div>

            {/* Google Maps link */}
            <a
              href={getGoogleMapsUrl({
                name: place.name,
                placeId: place.id,
                location: place.lat && place.lng ? { lat: place.lat, lng: place.lng } : undefined,
              })}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              data-testid="google-maps-link"
            >
              <MapPin className="w-3.5 h-3.5" />
              View on Google Maps
            </a>
          </div>

          {/* Description */}
          {place.description && <p className="text-sm text-muted-foreground" data-testid="place-description">{parseBoldText(place.description)}</p>}
        </div>

        {/* Bottom section - fixed position */}
        <div className="mt-auto space-y-3 pt-4">
          {/* Reasoning (collapsible) */}
          <ReasoningSection reasoning={place.reasoning} />

          {/* Action button */}
          <div className="space-y-2">
            <button
              onClick={handleAdd}
              disabled={isAdded || isAdding || !canAdd}
              className={`
                w-full py-2.5 px-4 rounded-lg font-medium text-sm
                transition-colors flex items-center justify-center gap-2
                ${
                  isAdded
                    ? "bg-green-50 text-green-700 cursor-default"
                    : isAdding
                      ? "bg-blue-50 text-blue-600 cursor-wait"
                      : canAdd
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }
              `}
              aria-label={isAdded ? "Already added to plan" : `Add ${place.name} to plan`}
              data-testid="add-to-plan-button"
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

            {place.validationStatus === "not_found" && (
              <p className="mt-2 text-xs text-destructive">
                This place could not be verified. Please check the details.
              </p>
            )}

            {place.validationStatus === "partial" && (
              <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-500">
                This place was partially verified. Some details may be incomplete.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Photo Lightbox */}
      {place.photos && place.photos.length > 0 && (
        <PhotoLightbox
          photos={place.photos}
          initialIndex={0}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          placeName={place.name}
          lat={place.lat || 0}
          lng={place.lng || 0}
        />
      )}
    </div>
  );
}
