/**
 * Plan toolbar - filters for plan items
 */

import React from "react";
import { cn } from "@/lib/common/utils";
import type { FilterState } from "../types";

interface PlanToolbarProps {
  filter: FilterState["category"];
  onFilterChange: (category: FilterState["category"]) => void;
  className?: string;
}

export function PlanToolbar({ filter, onFilterChange, className }: PlanToolbarProps) {
  const categories: { id: FilterState["category"]; label: string }[] = [
    { id: "all", label: "All" },
    { id: "attractions", label: "Attractions" },
    { id: "restaurants", label: "Restaurants" },
  ];

  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      {/* Category buttons */}
      <div className="flex items-center gap-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onFilterChange(cat.id)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              filter === cat.id ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
            aria-pressed={filter === cat.id}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
