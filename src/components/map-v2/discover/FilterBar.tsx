/**
 * Filter bar - category and quality filters for discovery results
 */

import React from 'react';
import type { FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: Partial<FilterState>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function FilterBar({ filters, onChange, onClear, hasActiveFilters }: FilterBarProps) {
  const categories: Array<{ id: FilterState['category']; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'attractions', label: 'Attractions' },
    { id: 'restaurants', label: 'Restaurants' },
  ];

  const handleCategoryChange = (category: FilterState['category']) => {
    onChange({ category });
  };

  const handleQualityToggle = () => {
    onChange({ showHighQualityOnly: !filters.showHighQualityOnly });
  };

  const handleScoreThresholdChange = (minScore: FilterState['minScore']) => {
    onChange({ minScore });
  };

  return (
    <div className="space-y-3">
      {/* Category chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${
                filters.category === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }
            `}
            aria-pressed={filters.category === cat.id}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Quality filter */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.showHighQualityOnly}
            onChange={handleQualityToggle}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-sm font-medium text-gray-700">High-quality only</span>
        </label>

        {filters.showHighQualityOnly && (
          <select
            value={filters.minScore}
            onChange={(e) => handleScoreThresholdChange(Number(e.target.value) as FilterState['minScore'])}
            className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Minimum score threshold"
          >
            <option value={7}>7.0+</option>
            <option value={8}>8.0+</option>
            <option value={9}>9.0+</option>
          </select>
        )}
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

