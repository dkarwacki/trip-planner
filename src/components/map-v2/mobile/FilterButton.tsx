/**
 * Filter Button
 * Opens filter bottom sheet for attractions/restaurants/all
 */

import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { useMapStore } from "../stores/mapStore";
import { cn } from "@/lib/common/utils";

export function FilterButton() {
  const filters = useMapStore((state) => state.filters);
  const setFilterSheetOpen = useMapStore((state) => state.setFilterSheetOpen);

  // Count active filters
  const activeFilterCount = [filters.category !== "all", filters.showHighQualityOnly].filter(Boolean).length;

  const hasActiveFilter = activeFilterCount > 0;

  return (
    <button
      onClick={() => setFilterSheetOpen(true)}
      className={cn(
        "relative flex h-12 w-12 items-center justify-center rounded-full",
        "bg-white text-gray-700 shadow-md transition-all",
        "hover:bg-gray-50 hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50",
        "active:scale-95"
      )}
      aria-label="Filter places"
    >
      <SlidersHorizontal className="h-5 w-5" />

      {/* Badge for active filters */}
      {hasActiveFilter && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          {activeFilterCount}
        </span>
      )}
    </button>
  );
}
