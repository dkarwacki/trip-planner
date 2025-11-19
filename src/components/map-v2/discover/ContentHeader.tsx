/**
 * Content header - displays result count and view toggle inline
 */

import React from "react";
import { cn } from "@/lib/common/utils";
import type { ViewMode, FilterState } from "../types";
import { ViewToggle } from "./ViewToggle";

interface ContentHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  resultCount: number;
  totalCount: number;
  filters: FilterState;
  className?: string;
}

export function ContentHeader({
  viewMode,
  onViewModeChange,
  resultCount,
  totalCount,
  filters,
  className,
}: ContentHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {/* Result count */}
      <div className="text-sm text-gray-600">
        Showing {resultCount} of {totalCount} {filters.category === "all" ? "places" : filters.category}
      </div>

      {/* View toggle */}
      <ViewToggle activeMode={viewMode} onChange={onViewModeChange} variant="compact" />
    </div>
  );
}










