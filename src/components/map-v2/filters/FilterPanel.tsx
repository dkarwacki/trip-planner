/**
 * Filter Panel - Desktop horizontal filter layout
 * Category, quality, and price range filters
 */

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/common/utils";
import type { FilterState } from "../types";

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: Partial<FilterState>) => void;
  onClear: () => void;
  resultCount?: number;
  totalCount?: number;
  className?: string;
}

export function FilterPanel({ filters, onChange, onClear, resultCount, totalCount, className }: FilterPanelProps) {
  const categories: { id: FilterState["category"]; label: string }[] = [
    { id: "all", label: "All" },
    { id: "attractions", label: "Attractions" },
    { id: "restaurants", label: "Restaurants" },
  ];

  const handleCategoryChange = (category: FilterState["category"]) => {
    onChange({ category });
  };

  const handleQualityToggle = () => {
    onChange({ showHighQualityOnly: !filters.showHighQualityOnly });
  };

  const handleScoreThresholdChange = (minScore: FilterState["minScore"]) => {
    onChange({ minScore });
  };

  // Check if filters are active (not default)
  const hasActiveFilters = filters.category !== "all" || filters.showHighQualityOnly;

  const activeFilterCount = [filters.category !== "all", filters.showHighQualityOnly].filter(Boolean).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Category chips */}
        <div className="flex items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                filters.category === cat.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              )}
              aria-pressed={filters.category === cat.id}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Quality filter */}
        <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
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
              onChange={(e) => handleScoreThresholdChange(Number(e.target.value) as FilterState["minScore"])}
              className={cn(
                "text-sm px-3 py-1.5 border border-gray-300 rounded-md",
                "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "bg-white"
              )}
              aria-label="Minimum score threshold"
            >
              <option value={7}>7.0+</option>
              <option value={8}>8.0+</option>
              <option value={9}>9.0+</option>
            </select>
          )}
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md",
              "text-sm font-medium text-blue-600 hover:text-blue-700",
              "hover:bg-blue-50 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            )}
          >
            <X className="h-4 w-4" />
            Clear filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Result count */}
      {resultCount !== undefined && totalCount !== undefined && (
        <div className="text-sm text-gray-600">
          Showing {resultCount} of {totalCount} {filters.category === "all" ? "places" : filters.category}
        </div>
      )}
    </div>
  );
}
