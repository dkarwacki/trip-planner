/**
 * Discover panel - main container for browsing nearby attractions and restaurants
 * Implements Stage 3.1 of the UX implementation plan
 */

import React, { useEffect, useRef, useLayoutEffect, useCallback, useMemo } from "react";
import { useMapState } from "../context";
import { useNearbyPlaces } from "../hooks/useNearbyPlaces";
import { DiscoverHeader } from "./DiscoverHeader";
import { DiscoverToolbar } from "./DiscoverToolbar";
import { ContentHeader } from "./ContentHeader";
import { PlaceCardGrid } from "./PlaceCardGrid";
import { PhotoGrid } from "./PhotoGrid";
import { PlaceList } from "./PlaceList";
import { getPersistedFilters, persistFilters } from "@/lib/map-v2/filterPersistence";

// Create a context for scroll preservation
const ScrollPreservationContext = React.createContext<{
  saveScrollPosition: () => void;
  restoreScrollPosition: () => void;
} | null>(null);

export function DiscoverPanel() {
  const {
    selectedPlaceId,
    discoveryResults,
    viewMode,
    filters,
    isLoadingDiscovery,
    dispatch,
    places: plannedPlaces,
  } = useMapState();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const shouldRestoreScrollRef = useRef<boolean>(false);
  const isRestoringScrollRef = useRef<boolean>(false);

  // Use the nearby places hook to automatically fetch when place is selected
  useNearbyPlaces();

  // Load persisted filters when place is selected
  useEffect(() => {
    if (selectedPlaceId) {
      const persistedFilters = getPersistedFilters(selectedPlaceId);
      if (persistedFilters) {
        dispatch({ type: "UPDATE_FILTERS", payload: persistedFilters });
      } else {
        // Reset to defaults for new place
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

  // Save scroll position continuously (but not when we're restoring)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Don't save scroll position if we're in the middle of restoring it
      if (!isRestoringScrollRef.current) {
        scrollPositionRef.current = container.scrollTop;
      }
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

  // Function to restore scroll position
  const restoreScrollPosition = useCallback(() => {
    if (!shouldRestoreScrollRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const savedScrollTop = scrollPositionRef.current;
    if (savedScrollTop > 0) {
      // Use multiple requestAnimationFrame calls to ensure DOM has fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (container && scrollPositionRef.current > 0) {
              container.scrollTop = scrollPositionRef.current;
              shouldRestoreScrollRef.current = false;
            }
          });
        });
      });
    }
  }, []);

  // Filter and sort results based on active filters
  const filteredResults = useMemo(() => {
    let results = [...discoveryResults];

    // Category filter
    if (filters.category !== "all") {
      results = results.filter((item: any) => {
        // Simple type detection based on Google Place types
        // Note: data structure has types nested under attraction object
        const isRestaurant = item.attraction?.types?.some((t: string) =>
          ["restaurant", "food", "cafe", "bar", "bakery"].includes(t)
        );
        return filters.category === "restaurants" ? isRestaurant : !isRestaurant;
      });
    }

    // High quality filter
    if (filters.showHighQualityOnly) {
      results = results.filter((item: any) => {
        const score = item.score || 0;
        return score >= filters.minScore * 10; // Convert 7/8/9 to 70/80/90
      });
    }

    // Sort results: attractions first, then restaurants, both sorted by score (descending)
    results.sort((a: any, b: any) => {
      const isRestaurantA = a.attraction?.types?.some((t: string) =>
        ["restaurant", "food", "cafe", "bar", "bakery"].includes(t)
      );
      const isRestaurantB = b.attraction?.types?.some((t: string) =>
        ["restaurant", "food", "cafe", "bar", "bakery"].includes(t)
      );

      // Group by type: attractions (false) before restaurants (true)
      if (isRestaurantA !== isRestaurantB) {
        return isRestaurantA ? 1 : -1;
      }

      // Within same type, sort by score (descending - highest first)
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return scoreB - scoreA;
    });

    return results;
  }, [discoveryResults, filters]);

  const handleViewModeChange = useCallback(
    (mode: typeof viewMode) => {
      dispatch({ type: "SET_VIEW_MODE", payload: mode });
    },
    [dispatch]
  );

  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      dispatch({ type: "UPDATE_FILTERS", payload: newFilters });
    },
    [dispatch]
  );

  const handleClearFilters = useCallback(() => {
    dispatch({ type: "CLEAR_FILTERS" });
  }, [dispatch]);

  // Render appropriate view based on viewMode
  const renderContent = React.useCallback(() => {
    if (!selectedPlaceId) {
      return (
        <div className="flex items-center justify-center h-full p-8 text-center">
          <div>
            <div className="text-4xl mb-4">📍</div>
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
  }, [
    selectedPlaceId,
    isLoadingDiscovery,
    filteredResults,
    viewMode,
    handleClearFilters,
    filters.category,
    filters.showHighQualityOnly,
  ]);

  // Memoize content to prevent unnecessary re-renders
  const memoizedContent = useMemo(() => {
    return renderContent();
  }, [renderContent]);

  // Restore scroll position when plannedPlaces changes (after adding items)
  useEffect(() => {
    if (shouldRestoreScrollRef.current && scrollPositionRef.current > 0) {
      const savedScroll = scrollPositionRef.current;

      // Use multiple requestAnimationFrame calls to ensure DOM has fully updated
      requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        if (container && container.scrollTop !== savedScroll) {
          container.scrollTop = savedScroll;
        }
        requestAnimationFrame(() => {
          const container = scrollContainerRef.current;
          if (container && container.scrollTop !== savedScroll) {
            container.scrollTop = savedScroll;
          }
          requestAnimationFrame(() => {
            const container = scrollContainerRef.current;
            if (container && container.scrollTop !== savedScroll) {
              container.scrollTop = savedScroll;
            }
          });
        });
      });
    }
  }, [plannedPlaces]);

  // Preserve scroll position - use multiple strategies to ensure it sticks
  useLayoutEffect(() => {
    if (shouldRestoreScrollRef.current) {
      const container = scrollContainerRef.current;
      if (container && scrollPositionRef.current > 0) {
        const savedScroll = scrollPositionRef.current;
        isRestoringScrollRef.current = true;

        // Restore immediately in layout phase
        container.scrollTop = savedScroll;

        // Also restore after multiple animation frames to catch any late DOM updates
        requestAnimationFrame(() => {
          if (container && container.scrollTop !== savedScroll) {
            container.scrollTop = savedScroll;
          }
          requestAnimationFrame(() => {
            if (container && container.scrollTop !== savedScroll) {
              container.scrollTop = savedScroll;
            }
            requestAnimationFrame(() => {
              if (container && container.scrollTop !== savedScroll) {
                container.scrollTop = savedScroll;
              }
              isRestoringScrollRef.current = false;
            });
          });
        });

        shouldRestoreScrollRef.current = false;
      }
    }
  });

  // Ref callback to preserve scroll when container is recreated
  const scrollContainerCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const savedScroll = scrollPositionRef.current;
      scrollContainerRef.current = node;

      // If we have a saved scroll position, restore it immediately and keep restoring
      if (shouldRestoreScrollRef.current && savedScroll > 0) {
        isRestoringScrollRef.current = true;
        node.scrollTop = savedScroll;

        // Keep restoring until it sticks
        const restoreInterval = setInterval(() => {
          if (node.scrollTop !== savedScroll && savedScroll > 0) {
            node.scrollTop = savedScroll;
          } else {
            clearInterval(restoreInterval);
            isRestoringScrollRef.current = false;
          }
        }, 16); // ~60fps

        // Stop after 500ms max
        setTimeout(() => {
          clearInterval(restoreInterval);
          isRestoringScrollRef.current = false;
        }, 500);
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
          {memoizedContent}
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
