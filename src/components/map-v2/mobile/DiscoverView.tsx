/**
 * Mobile Discover View
 * Shows list of nearby places with filters and view mode toggles
 */

import React, { useEffect, useRef } from "react";
import { useMapState } from "../context";
import { useNearbyPlaces } from "../hooks/useNearbyPlaces";
import { DiscoverHeader } from "../discover/DiscoverHeader";
import { FilterPanel } from "../filters/FilterPanel";
import { ViewToggle } from "../discover/ViewToggle";
import { PlaceCardGrid } from "../discover/PlaceCardGrid";
import { PhotoGrid } from "../discover/PhotoGrid";
import { PlaceList } from "../discover/PlaceList";
import { getPersistedFilters, persistFilters } from "@/lib/map-v2/filterPersistence";
import { NEARBY_SEARCH_RADIUS_METERS } from "@/lib/map-v2/search-constants";

interface DiscoverViewProps {
  mapId?: string;
  onMapLoad?: (map: google.maps.Map) => void;
  onNavigateToMap?: (attractionId: string, lat: number, lng: number) => void;
}

export function DiscoverView({ mapId, onMapLoad, onNavigateToMap }: DiscoverViewProps) {
  const {
    selectedPlaceId,
    discoveryResults = [],
    viewMode: cardViewMode,
    filters = { category: "all", radius: NEARBY_SEARCH_RADIUS_METERS, sortBy: "relevance", priceLevel: [] as number[], openNow: false },
    isLoadingDiscovery,
    dispatch,
    places: plannedPlaces = [],
  } = useMapState();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Use the nearby places hook to automatically fetch when place is selected
  useNearbyPlaces();

  // Load persisted filters when place is selected
  useEffect(() => {
    if (selectedPlaceId) {
      const persistedFilters = getPersistedFilters(selectedPlaceId);
      if (persistedFilters) {
        dispatch({ type: "UPDATE_FILTERS", payload: persistedFilters });
      } else {
        dispatch({ type: "CLEAR_FILTERS" });
      }
    }
  }, [selectedPlaceId, dispatch]);

  // Save filters when they change
  useEffect(() => {
    if (selectedPlaceId) {
      persistFilters(selectedPlaceId, filters);
    }
  }, [filters, selectedPlaceId]);

  // Save scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      scrollPositionRef.current = container.scrollTop;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const selectedPlace = plannedPlaces.find((p) => p.id === selectedPlaceId);

  // Helper to check if attraction is a restaurant
  const isRestaurant = (item: { attraction?: { types?: string[] } }) => {
    return item.attraction?.types?.some((t: string) => ["restaurant", "food", "cafe", "bar", "bakery"].includes(t));
  };

  // Split into attractions and restaurants based on types
  const attractions = discoveryResults.filter((r) => !isRestaurant(r));
  const restaurants = discoveryResults.filter((r) => isRestaurant(r));

  // Sort each group by score (descending - highest first)
  const sortByScore = (a: any, b: any) => {
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    return scoreB - scoreA;
  };

  attractions.sort(sortByScore);
  restaurants.sort(sortByScore);

  // Apply category filter
  let filteredAttractions = attractions;
  let filteredRestaurants = restaurants;

  if (filters.category === "attractions") {
    filteredRestaurants = [];
  } else if (filters.category === "restaurants") {
    filteredAttractions = [];
  }

  // Combine filtered results (attractions first, then restaurants, both sorted by score)
  const filteredResults = [...filteredAttractions, ...filteredRestaurants];

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    dispatch({ type: "UPDATE_FILTERS", payload: newFilters });
  };

  const handleClearFilters = () => {
    dispatch({ type: "CLEAR_FILTERS" });
  };

  const handleViewModeChange = (mode: typeof cardViewMode) => {
    dispatch({ type: "SET_VIEW_MODE", payload: mode });
  };

  return (
    <div className="relative h-full w-full bg-gray-50">
      {/* List View */}
      <div ref={scrollContainerRef} className="h-full w-full overflow-y-auto">
        <div className="flex flex-col">
          {/* Discover Header */}
          <div className="sticky top-0 z-10 bg-white shadow-sm">
            <DiscoverHeader />
          </div>

          {/* Filter Panel */}
          <div className="border-b border-gray-200 bg-white p-4">
            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
              resultCount={filteredResults.length}
              totalCount={discoveryResults.length}
            />
          </div>

          {/* View Mode Toggle */}
          <div className="border-b border-gray-200 bg-white px-4 py-3">
            <ViewToggle activeMode={cardViewMode} onChange={handleViewModeChange} />
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4">
            {!selectedPlace ? (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <div className="space-y-3">
                  <p className="text-lg font-medium text-gray-900">No place selected</p>
                  <p className="text-sm text-gray-500">
                    Search for a place to discover nearby attractions and restaurants
                  </p>
                </div>
              </div>
            ) : isLoadingDiscovery ? (
              <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-center">
                <div className="space-y-3">
                  <p className="text-lg font-medium text-gray-900">No results found</p>
                  <p className="text-sm text-gray-500">Try adjusting your filters</p>
                </div>
              </div>
            ) : (
              <>
                {cardViewMode === "cards" && (
                  <PlaceCardGrid places={filteredResults} onNavigateToMap={onNavigateToMap} />
                )}
                {cardViewMode === "photos" && <PhotoGrid places={filteredResults} onNavigateToMap={onNavigateToMap} />}
                {cardViewMode === "list" && <PlaceList places={filteredResults} onNavigateToMap={onNavigateToMap} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
