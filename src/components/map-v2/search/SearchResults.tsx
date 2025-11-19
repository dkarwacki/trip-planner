/**
 * Search Results component
 * Displays autocomplete suggestions for place search
 */

import React from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/common/utils";
import type { PlaceSuggestion } from "../hooks/usePlaceAutocomplete";

interface SearchResultsProps {
  suggestions: PlaceSuggestion[];
  selectedIndex: number;
  onSelect: (suggestion: PlaceSuggestion) => void;
  onHover: (index: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function SearchResults({
  suggestions,
  selectedIndex,
  onSelect,
  onHover,
  isLoading = false,
  className,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className={cn("px-4 py-3", className)}>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span>Searching...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase">Suggestions</h3>
      </div>
      <div className="space-y-1" role="listbox" aria-label="Place suggestions">
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion.placeId}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            onClick={() => onSelect(suggestion)}
            onMouseEnter={() => onHover(index)}
            className={cn(
              "w-full flex items-start gap-3 px-3 py-2 rounded-md text-left",
              "transition-colors",
              "hover:bg-gray-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              index === selectedIndex && "bg-blue-50"
            )}
          >
            <MapPin
              className={cn(
                "h-4 w-4 flex-shrink-0 mt-0.5",
                index === selectedIndex ? "text-blue-600" : "text-gray-400"
              )}
            />
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  "text-sm font-medium truncate",
                  index === selectedIndex ? "text-blue-900" : "text-gray-900"
                )}
              >
                {suggestion.mainText}
              </div>
              {suggestion.secondaryText && (
                <div className={cn("text-xs truncate", index === selectedIndex ? "text-blue-700" : "text-gray-500")}>
                  {suggestion.secondaryText}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}



