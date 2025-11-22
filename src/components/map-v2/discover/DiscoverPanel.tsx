/**
 * Discover panel - main container for browsing nearby attractions and restaurants
 * Implements Stage 3.1 of the UX implementation plan
 */

import React, { useRef, useLayoutEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { useMapStore } from "../stores/mapStore";
import { useNearbyPlaces } from "../hooks/useNearbyPlaces";
import { useDiscoverFilters } from "./hooks/useDiscoverFilters";
import { DiscoverHeader } from "./DiscoverHeader";
import { DiscoverToolbar } from "./DiscoverToolbar";
import { ContentHeader } from "./ContentHeader";
import { PlaceCardGrid } from "./PlaceCardGrid";
import { PhotoGrid } from "./PhotoGrid";
import { PlaceList } from "./PlaceList";

// Create a context for scroll preservation
const ScrollPreservationContext = React.createContext<{
  saveScrollPosition: () => void;
  restoreScrollPosition: () => void;
} | null>(null);

export function DiscoverPanel() {
  // Selectors
  const selectedPlaceId = useMapStore((state) => state.selectedPlaceId);
  const discoveryResults = useMapStore((state) => state.discoveryResults);
  const viewMode = useMapStore((state) => state.viewMode);
  const isLoadingDiscovery = useMapStore((state) => state.isLoadingDiscovery);
  const setViewMode = useMapStore((state) => state.setViewMode);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const shouldRestoreScrollRef = useRef<boolean>(false);

  // Use the nearby places hook to automatically fetch when place is selected
  useNearbyPlaces();

  // Use filters hook
  const { filters, filteredResults, handleFilterChange, handleClearFilters } = useDiscoverFilters();

  // Save scroll position continuously
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      scrollPositionRef.current = container.scrollTop;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Function to save current scroll position
  const saveScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      scrollPositionRef.current = container.scrollTop;
      shouldRestoreScrollRef.current = true;
    }
  }, []);

  // Function to restore scroll position (not used directly, but kept for context API)
  const restoreScrollPosition = useCallback(() => {
    // Restoration now happens automatically in useLayoutEffect
  }, []);

  const handleViewModeChange = useCallback(
    (mode: typeof viewMode) => {
      setViewMode(mode);
    },
    [setViewMode]
  );

  // Render appropriate view based on viewMode
  const renderContent = React.useCallback(() => {
    if (!selectedPlaceId) {
      return (
        <div className="flex items-center justify-center h-full p-8 text-center">
          <div>
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a place to explore</h3>
            <p className="text-sm text-gray-600">
              Tap any location on the map to discover nearby attractions and restaurants
            </p>
          </div>
        </div>
      );
    }

    if (isLoadingDiscovery) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-sm text-gray-600">Loading places...</p>
          </div>
        </div>
      );
    }

    if (filteredResults.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No places found</h3>
          <p className="text-sm text-gray-600 mb-4">Try adjusting your filters or search a different area</p>
          {(filters.category !== "all" || filters.showHighQualityOnly) && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      );
    }

    switch (viewMode) {
      case "grid":
        return <PhotoGrid places={filteredResults} />;
      case "list":
        return <PlaceList places={filteredResults} />;
      case "cards":
      default:
        return <PlaceCardGrid places={filteredResults} />;
    }
  }, [selectedPlaceId, isLoadingDiscovery, filteredResults, viewMode, handleClearFilters, filters]);

  // Simplified scroll restoration - runs after layout updates
  useLayoutEffect(() => {
    if (!shouldRestoreScrollRef.current) return;

    const container = scrollContainerRef.current;
    const savedScroll = scrollPositionRef.current;

    if (container && savedScroll > 0) {
      // Restore immediately in layout phase
      container.scrollTop = savedScroll;

      // Use one requestAnimationFrame to handle any late DOM updates
      requestAnimationFrame(() => {
        if (container && container.scrollTop !== savedScroll) {
          container.scrollTop = savedScroll;
        }
      });

      shouldRestoreScrollRef.current = false;
    }
  });

  // Simplified ref callback
  const scrollContainerCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      scrollContainerRef.current = node;

      // Restore scroll position if needed
      if (shouldRestoreScrollRef.current && scrollPositionRef.current > 0) {
        node.scrollTop = scrollPositionRef.current;
      }
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with place context and stats */}
      <DiscoverHeader
        selectedPlaceId={selectedPlaceId}
        totalCount={discoveryResults.length}
        filteredCount={filteredResults.length}
      />

      {/* Compact toolbar with filters only */}
      <div className="px-4 py-2 border-b border-gray-200">
        <DiscoverToolbar filters={filters} onFilterChange={handleFilterChange} onClearFilters={handleClearFilters} />
      </div>

      {/* Content header with result count and view toggle */}
      <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50">
        <ContentHeader
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          resultCount={filteredResults.length}
          totalCount={discoveryResults.length}
          filters={filters}
        />
      </div>

      {/* Scrollable content area */}
      <ScrollPreservationContext.Provider value={{ saveScrollPosition, restoreScrollPosition }}>
        <div ref={scrollContainerCallback} className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </ScrollPreservationContext.Provider>
    </div>
  );
}

// Hook to use scroll preservation
export function useScrollPreservation() {
  const context = React.useContext(ScrollPreservationContext);
  return context;
}
