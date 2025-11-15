/**
 * Discover panel - main container for browsing nearby attractions and restaurants
 * Implements Stage 3.1 of the UX implementation plan
 */

import React from 'react';
import { useMapState } from '../context';
import { DiscoverHeader } from './DiscoverHeader';
import { FilterBar } from './FilterBar';
import { ViewToggle } from './ViewToggle';
import { PlaceCardGrid } from './PlaceCardGrid';
import { PhotoGrid } from './PhotoGrid';
import { PlaceList } from './PlaceList';

export function DiscoverPanel() {
  const { selectedPlaceId, discoveryResults, viewMode, filters, isLoadingDiscovery, dispatch } = useMapState();

  // Filter results based on active filters
  const filteredResults = React.useMemo(() => {
    let results = [...discoveryResults];

    // Category filter
    if (filters.category !== 'all') {
      results = results.filter((item: any) => {
        // Simple type detection based on Google Place types
        const isRestaurant = item.types?.some((t: string) => 
          ['restaurant', 'food', 'cafe', 'bar'].includes(t)
        );
        return filters.category === 'restaurants' ? isRestaurant : !isRestaurant;
      });
    }

    // High quality filter
    if (filters.showHighQualityOnly) {
      results = results.filter((item: any) => {
        const score = item.score || 0;
        return score >= (filters.minScore * 10); // Convert 7/8/9 to 70/80/90
      });
    }

    return results;
  }, [discoveryResults, filters]);

  const handleViewModeChange = (mode: typeof viewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: newFilters });
  };

  const handleClearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  // Render appropriate view based on viewMode
  const renderContent = () => {
    if (!selectedPlaceId) {
      return (
        <div className="flex items-center justify-center h-full p-8 text-center">
          <div>
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Select a place to explore
            </h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No places found
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Try adjusting your filters or search a different area
          </p>
          {(filters.category !== 'all' || filters.showHighQualityOnly) && (
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
      case 'grid':
        return <PhotoGrid places={filteredResults} />;
      case 'list':
        return <PlaceList places={filteredResults} />;
      case 'cards':
      default:
        return <PlaceCardGrid places={filteredResults} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with place context and stats */}
      <DiscoverHeader
        selectedPlaceId={selectedPlaceId}
        totalCount={discoveryResults.length}
        filteredCount={filteredResults.length}
      />

      {/* View toggle */}
      <div className="px-4 py-3 border-b border-gray-200">
        <ViewToggle activeMode={viewMode} onChange={handleViewModeChange} />
      </div>

      {/* Filter bar */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
          hasActiveFilters={filters.category !== 'all' || filters.showHighQualityOnly}
        />
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}

