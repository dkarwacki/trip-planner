import React, { useState } from "react";
import { MapPin, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoBlock } from "../shared/PhotoBlock";
import { ValidationBadge } from "../shared/ValidationBadge";
import { ReasoningSection } from "./ReasoningSection";
import PhotoLightbox from "@/components/PhotoLightbox";
import type { PlaceSuggestion } from "@/domain/plan/models/ChatMessage";

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
  scrollRef?: React.RefObject<HTMLDivElement>;
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

  // Format coordinates for display
  const coordinates = place.lat && place.lng ? `${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}` : null;

  return (
    <div
      ref={scrollRef}
      className={`rounded-lg border bg-card transition-all ${isHighlighted ? "ring-2 ring-primary" : ""}`}
      onTransitionEnd={() => setIsHighlighted(false)}
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
      <div className="space-y-3 p-4">
        {/* Header: Name and validation */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{place.name}</h3>
            <ValidationBadge status={place.validationStatus} size="sm" />
          </div>

          {/* Coordinates */}
          {coordinates && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={12} />
              <span>{coordinates}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {place.description && <p className="text-sm text-muted-foreground">{parseBoldText(place.description)}</p>}

        {/* Reasoning (collapsible) */}
        <ReasoningSection reasoning={place.reasoning} />

        {/* Action button */}
        <div className="pt-2">
          {isAdded ? (
            <Button variant="outline" className="w-full" disabled aria-label="Already added to plan">
              <Check size={16} className="mr-2" />
              Added to Plan
            </Button>
          ) : (
            <Button onClick={handleAdd} disabled={!canAdd} className="w-full" aria-label={`Add ${place.name} to plan`}>
              {isAdding ? (
                <>Adding...</>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Add to Plan
                </>
              )}
            </Button>
          )}

          {place.validationStatus === "not_found" && (
            <p className="mt-2 text-xs text-destructive">This place could not be verified. Please check the details.</p>
          )}

          {place.validationStatus === "partial" && (
            <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-500">
              This place was partially verified. Some details may be incomplete.
            </p>
          )}
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
