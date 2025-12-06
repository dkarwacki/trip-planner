/**
 * Search Overlay
 * Full-screen search overlay for mobile with autocomplete and recent searches
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { cn } from "@/lib/common/utils";
import { usePlaceAutocomplete } from "../hooks/usePlaceAutocomplete";
import { SearchResults } from "../search/SearchResults";
import { RecentSearches } from "../search/RecentSearches";
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  type RecentSearch,
} from "@/lib/map/recentSearches";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceSelect: (placeDetails: {
    placeId: string;
    name: string;
    formattedAddress: string;
    location: { lat: number; lng: number };
  }) => void;
}

export function SearchOverlay({ isOpen, onClose, onPlaceSelect }: SearchOverlayProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const { suggestions, isLoading, searchPlaces, fetchPlaceDetails, clearSuggestions } = usePlaceAutocomplete({
    debounceMs: 300,
  });

  // Load recent searches and auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      // Auto-focus with a slight delay to ensure the overlay is visible
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Reset state when closed
      setInputValue("");
      clearSuggestions();
      setSelectedIndex(-1);
    }
  }, [isOpen, clearSuggestions]);

  // Handle Android hardware back button
  useEffect(() => {
    if (!isOpen) return;

    const handleBackButton = (e: PopStateEvent) => {
      e.preventDefault();
      onClose();
    };

    window.addEventListener("popstate", handleBackButton);
    return () => window.removeEventListener("popstate", handleBackButton);
  }, [isOpen, onClose]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedIndex(-1);

    if (value.trim()) {
      searchPlaces(value);
    } else {
      clearSuggestions();
    }
  };

  // Handle clear button
  const handleClear = () => {
    setInputValue("");
    clearSuggestions();
    inputRef.current?.focus();
  };

  // Handle place selection
  const handleSelectPlace = useCallback(
    async (placeId: string, mainText: string, secondaryText: string) => {
      const placeDetails = await fetchPlaceDetails(placeId);

      if (placeDetails) {
        // Add to recent searches
        addRecentSearch({
          placeId,
          mainText,
          secondaryText,
        });

        // Close overlay and notify parent
        onClose();
        onPlaceSelect(placeDetails);
      }
    },
    [fetchPlaceDetails, onClose, onPlaceSelect]
  );

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: (typeof suggestions)[0]) => {
    handleSelectPlace(suggestion.placeId, suggestion.mainText, suggestion.secondaryText);
  };

  // Handle recent search selection
  const handleSelectRecentSearch = (search: RecentSearch) => {
    handleSelectPlace(search.placeId, search.mainText, search.secondaryText);
  };

  // Handle remove recent search with swipe-to-delete support
  const handleRemoveRecentSearch = (placeId: string) => {
    removeRecentSearch(placeId);
    setRecentSearches(getRecentSearches());
  };

  // Handle clear all recent searches
  const handleClearAllRecentSearches = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn("fixed inset-0 z-[150] bg-white", "animate-in slide-in-from-bottom duration-200")}
      data-testid="mobile-search-overlay"
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 bg-white">
          <button
            onClick={onClose}
            className={cn(
              "rounded-lg p-2 text-gray-700 transition-colors",
              "hover:bg-gray-100 active:bg-gray-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            )}
            aria-label="Close search"
            data-testid="mobile-search-close-button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Search for a place..."
              className={cn(
                "w-full pl-10 pr-10 py-2 rounded-lg",
                "border border-gray-300 bg-white",
                "text-base text-gray-900 placeholder:text-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              )}
              aria-label="Search for a place"
              autoComplete="off"
              data-testid="mobile-search-input"
            />
            {inputValue && (
              <button
                onClick={handleClear}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2",
                  "p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200",
                  "text-gray-400 hover:text-gray-600",
                  "transition-colors"
                )}
                aria-label="Clear search"
                data-testid="mobile-search-clear-button"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Loading State */}
          {isLoading && (
            <div className="px-4 py-8 flex items-center justify-center">
              <div className="flex items-center gap-3 text-gray-500">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                <span className="text-base">Searching...</span>
              </div>
            </div>
          )}

          {/* Recent Searches - show when no input */}
          {!inputValue.trim() && !isLoading && recentSearches.length > 0 && (
            <div className="py-4">
              <RecentSearches
                searches={recentSearches}
                onSelect={handleSelectRecentSearch}
                onRemove={handleRemoveRecentSearch}
                onClearAll={handleClearAllRecentSearches}
                className="px-2"
              />
            </div>
          )}

          {/* Search Results - show when has input */}
          {inputValue.trim() && !isLoading && suggestions.length > 0 && (
            <div className="py-4">
              <SearchResults
                suggestions={suggestions}
                selectedIndex={selectedIndex}
                onSelect={handleSelectSuggestion}
                onHover={setSelectedIndex}
                className="px-2"
              />
            </div>
          )}

          {/* No Results */}
          {inputValue.trim() && !isLoading && suggestions.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-base text-gray-500">No results found</p>
              <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
            </div>
          )}

          {/* Empty State */}
          {!inputValue.trim() && !isLoading && recentSearches.length === 0 && (
            <div className="px-4 py-8 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-base text-gray-500">Search for a place</p>
              <p className="text-sm text-gray-400 mt-1">Try searching for a city, landmark, or address</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
