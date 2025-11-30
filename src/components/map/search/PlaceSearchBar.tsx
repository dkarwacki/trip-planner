/**
 * Place Search Bar component
 * Desktop search input with autocomplete and recent searches
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/common/utils";
import { usePlaceAutocomplete } from "../hooks/usePlaceAutocomplete";
import { SearchResults } from "./SearchResults";
import { RecentSearches } from "./RecentSearches";
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  type RecentSearch,
} from "@/lib/map/recentSearches";

interface PlaceSearchBarProps {
  onPlaceSelect: (placeDetails: {
    placeId: string;
    name: string;
    formattedAddress: string;
    location: { lat: number; lng: number };
  }) => void;
  placeholder?: string;
  className?: string;
  size?: "md" | "lg";
}

export function PlaceSearchBar({
  onPlaceSelect,
  placeholder = "Search for a place...",
  className,
  size = "md",
}: PlaceSearchBarProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading, searchPlaces, fetchPlaceDetails, clearSuggestions } = usePlaceAutocomplete({
    debounceMs: 300,
  });

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedIndex(-1);

    if (value.trim()) {
      searchPlaces(value);
      setIsOpen(true);
    } else {
      clearSuggestions();
      setIsOpen(false);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (inputValue.trim()) {
      setIsOpen(true);
    } else if (recentSearches.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle clear button
  const handleClear = () => {
    setInputValue("");
    clearSuggestions();
    setIsOpen(false);
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
        setRecentSearches(getRecentSearches());

        // Clear input and close dropdown
        setInputValue("");
        setIsOpen(false);
        clearSuggestions();

        // Notify parent
        onPlaceSelect(placeDetails);
      }
    },
    [fetchPlaceDetails, onPlaceSelect]
  );

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: (typeof suggestions)[0]) => {
    handleSelectPlace(suggestion.placeId, suggestion.mainText, suggestion.secondaryText);
  };

  // Handle recent search selection
  const handleSelectRecentSearch = (search: RecentSearch) => {
    handleSelectPlace(search.placeId, search.mainText, search.secondaryText);
  };

  // Handle remove recent search
  const handleRemoveRecentSearch = (placeId: string) => {
    removeRecentSearch(placeId);
    setRecentSearches(getRecentSearches());
  };

  // Handle clear all recent searches
  const handleClearAllRecentSearches = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    const totalItems = suggestions.length + recentSearches.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < recentSearches.length) {
            handleSelectRecentSearch(recentSearches[selectedIndex]);
          } else {
            const suggestionIndex = selectedIndex - recentSearches.length;
            if (suggestionIndex < suggestions.length) {
              handleSelectSuggestion(suggestions[suggestionIndex]);
            }
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const showDropdown = isOpen && (suggestions.length > 0 || recentSearches.length > 0 || isLoading);
  const sizeClasses = size === "lg" ? "py-3.5 text-base" : "py-2.5 text-sm";

  return (
    <div className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-10 rounded-lg",
            sizeClasses,
            "border border-gray-300 bg-white",
            "text-gray-900 placeholder:text-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "transition-shadow"
          )}
          aria-label="Search for a place"
          aria-autocomplete="list"
          aria-controls="search-dropdown"
          aria-expanded={isOpen}
          autoComplete="off"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "p-1 rounded hover:bg-gray-100",
              "text-gray-400 hover:text-gray-600",
              "transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            )}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          id="search-dropdown"
          className={cn(
            "absolute top-full left-0 right-0 mt-2",
            "bg-white rounded-lg shadow-lg border border-gray-200",
            "max-h-[400px] overflow-y-auto",
            "z-[55]"
          )}
        >
          <div className="py-2">
            {/* Recent Searches */}
            {!inputValue.trim() && recentSearches.length > 0 && (
              <RecentSearches
                searches={recentSearches}
                onSelect={handleSelectRecentSearch}
                onRemove={handleRemoveRecentSearch}
                onClearAll={handleClearAllRecentSearches}
              />
            )}

            {/* Search Results */}
            {inputValue.trim() && (
              <>
                {/* Separator if both recent and suggestions */}
                {recentSearches.length > 0 && suggestions.length > 0 && (
                  <div className="border-t border-gray-200 my-2" />
                )}
                <SearchResults
                  suggestions={suggestions}
                  selectedIndex={selectedIndex >= recentSearches.length ? selectedIndex - recentSearches.length : -1}
                  onSelect={handleSelectSuggestion}
                  onHover={(index) => setSelectedIndex(recentSearches.length + index)}
                  isLoading={isLoading}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
