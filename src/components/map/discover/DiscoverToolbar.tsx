/**
 * Compact discover toolbar - category buttons + filter popover for quality options
 */

import React, { useState } from "react";
import { Filter, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/common/utils";
import type { FilterState } from "../types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DiscoverToolbarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onClearFilters?: () => void;
  className?: string;
}

export function DiscoverToolbar({ filters, onFilterChange, onClearFilters, className }: DiscoverToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);

  const categories: { id: FilterState["category"]; label: string }[] = [
    { id: "all", label: "All" },
    { id: "attractions", label: "Attractions" },
    { id: "restaurants", label: "Restaurants" },
  ];

  const handleCategoryChange = (category: FilterState["category"]) => {
    onFilterChange({ category });
  };

  const handleQualityToggle = () => {
    onFilterChange({ showHighQualityOnly: !filters.showHighQualityOnly });
  };

  const handleScoreThresholdChange = (minScore: FilterState["minScore"]) => {
    onFilterChange({ minScore });
  };

  // Only count quality filters, not category
  const hasQualityFilters = filters.showHighQualityOnly;
  const qualityFilterCount = hasQualityFilters ? 1 : 0;

  const scoreOptions: { value: FilterState["minScore"]; label: string; helper: string }[] = [
    { value: 7, label: "7.0+", helper: "Solid picks" },
    { value: 8, label: "8.0+", helper: "Standout" },
    { value: 9, label: "9.0+", helper: "Top tier" },
  ];

  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      {/* Category buttons */}
      <div className="flex items-center gap-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              filters.category === cat.id
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
            aria-pressed={filters.category === cat.id}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filter button with quality options popover */}
      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border",
              hasQualityFilters
                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            )}
            aria-label="Open quality filters"
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
            {qualityFilterCount > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">{qualityFilterCount}</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 border-none bg-transparent p-0 shadow-none z-[130]" align="end">
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-xl ring-1 ring-black/5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                Quality filter
              </p>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  filters.showHighQualityOnly
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-500"
                )}
              >
                {filters.showHighQualityOnly ? `≥ ${filters.minScore}.0` : "Off"}
              </span>
            </div>

            <label className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 transition hover:border-slate-300">
              <p className="text-sm font-semibold text-slate-900">High-quality only</p>
              <div className="relative inline-flex h-5 w-9 items-center">
                <input
                  type="checkbox"
                  checked={filters.showHighQualityOnly}
                  onChange={handleQualityToggle}
                  className="peer sr-only"
                  aria-label="Toggle high-quality filter"
                />
                <span className="pointer-events-none absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-blue-600" />
                <span className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
              </div>
            </label>

            <div
              className={cn(
                "grid gap-1.5 overflow-hidden transition-all duration-200",
                filters.showHighQualityOnly ? "mt-3 max-h-80 opacity-100" : "mt-0 max-h-0 opacity-0"
              )}
              aria-hidden={!filters.showHighQualityOnly}
            >
              <span className="text-xs font-medium text-slate-600">Minimum score</span>
              <div className="grid grid-cols-3 gap-1.5">
                {scoreOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => handleScoreThresholdChange(option.value)}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      filters.minScore === option.value
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <div>{option.label}</div>
                    <div className="text-[10px] font-medium text-slate-500">{option.helper}</div>
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-500">Scores below this floor stay hidden.</span>
            </div>

            {hasQualityFilters && (
              <button
                onClick={() => {
                  if (onClearFilters) {
                    onClearFilters();
                  } else {
                    onFilterChange({ showHighQualityOnly: false });
                  }
                  setFilterOpen(false);
                }}
                className={cn(
                  "mt-3 w-full rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-slate-500 transition",
                  "hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                <span className="inline-flex items-center gap-1">
                  <X className="h-4 w-4" />
                  Clear quality filter
                </span>
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
