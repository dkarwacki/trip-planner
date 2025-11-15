import React from "react";
import type { PlaceSuggestion } from "@/domain/plan/models/ChatMessage";

interface NarrativeDisplayProps {
  content: string;
  suggestedPlaces?: PlaceSuggestion[];
  onPlaceClick?: (placeId: string) => void;
}

/**
 * Find place ID by matching name (case-insensitive, handles variations)
 */
function findPlaceId(placeName: string, places: PlaceSuggestion[]): string | null {
  if (!places || places.length === 0) return null;

  // Try exact match first
  const exactMatch = places.find((p) => p.name.toLowerCase() === placeName.toLowerCase());
  if (exactMatch) return exactMatch.id || exactMatch.name;

  // Try partial match (narrative might use shortened names)
  const partialMatch = places.find(
    (p) =>
      p.name.toLowerCase().includes(placeName.toLowerCase()) ||
      placeName.toLowerCase().includes(p.name.split(",")[0].trim().toLowerCase())
  );

  return partialMatch ? (partialMatch.id || partialMatch.name) : null;
}

/**
 * Parse narrative text and render with clickable bolded place names
 */
function renderNarrative(
  content: string,
  places: PlaceSuggestion[],
  onPlaceClick?: (placeId: string) => void
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const segments = content.split(/(\*\*[^*]+\*\*)/g);

  segments.forEach((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      // This is a bolded text - check if it's a place name
      const placeName = segment.slice(2, -2).trim();
      const placeId = findPlaceId(placeName, places);

      if (placeId && onPlaceClick) {
        // Make it a clickable button
        parts.push(
          <button
            key={`place-${index}`}
            onClick={() => onPlaceClick(placeId)}
            className="font-semibold text-primary hover:bg-primary/10 px-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            type="button"
          >
            {placeName}
          </button>
        );
      } else {
        // If we can't find the place ID or no click handler, render as plain bold text
        parts.push(
          <span key={`place-${index}`} className="font-semibold">
            {placeName}
          </span>
        );
      }
    } else if (segment.trim()) {
      // Regular text
      parts.push(<span key={`text-${index}`}>{segment}</span>);
    }
  });

  return parts;
}

/**
 * NarrativeDisplay - Interactive narrative with clickable place names
 *
 * Features:
 * - Parses **bold markers** in narrative for place names
 * - Makes bolded place names clickable buttons
 * - Clicking scrolls to corresponding suggestion card
 * - Fallback to plain text if no bold markers
 * - Only used for first message in conversation
 */
export function NarrativeDisplay({
  content,
  suggestedPlaces = [],
  onPlaceClick,
}: NarrativeDisplayProps) {
  // If content doesn't contain bold markers, render as plain text
  if (!content.includes("**")) {
    return <p className="whitespace-pre-wrap break-words text-sm">{content}</p>;
  }

  return (
    <p className="whitespace-pre-wrap break-words text-sm">
      {renderNarrative(content, suggestedPlaces, onPlaceClick)}
    </p>
  );
}
