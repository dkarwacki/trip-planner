/**
 * Filter Bottom Sheet - Mobile filter overlay
 * Full filter controls in a bottom sheet modal
 */

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/common/utils";
import type { FilterState } from "../types";

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  className?: string;
}

export function FilterBottomSheet({ isOpen, onClose, filters, onApply, className }: FilterBottomSheetProps) {
  // Local state for editing filters before applying
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Update local state when prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleCancel = () => {
    setLocalFilters(filters); // Reset to original
    onClose();
  };

  const categories: { id: FilterState["category"]; label: string }[] = [
    { id: "all", label: "All" },
    { id: "attractions", label: "Attractions" },
    { id: "restaurants", label: "Restaurants" },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-white rounded-t-2xl shadow-2xl",
          "max-h-[70vh] overflow-hidden",
          "animate-in slide-in-from-bottom duration-300",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={handleCancel}
              className={cn(
                "p-2 rounded-lg text-gray-500 hover:text-gray-700",
                "hover:bg-gray-100 active:bg-gray-200",
                "transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              )}
              aria-label="Close filters"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 space-y-6">
            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Category</h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border-2",
                      "cursor-pointer transition-all",
                      localFilters.category === cat.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <span
                      className={cn(
                        "text-base font-medium",
                        localFilters.category === cat.id ? "text-blue-900" : "text-gray-900"
                      )}
                    >
                      {cat.label}
                    </span>
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={localFilters.category === cat.id}
                      onChange={() => setLocalFilters({ ...localFilters, category: cat.id })}
                      className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Quality Filter */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quality</h3>
              <div className="space-y-4">
                <label
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border-2",
                    "cursor-pointer transition-all",
                    localFilters.showHighQualityOnly ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"
                  )}
                >
                  <span
                    className={cn(
                      "text-base font-medium",
                      localFilters.showHighQualityOnly ? "text-blue-900" : "text-gray-900"
                    )}
                  >
                    High-quality only
                  </span>
                  <input
                    type="checkbox"
                    checked={localFilters.showHighQualityOnly}
                    onChange={(e) => setLocalFilters({ ...localFilters, showHighQualityOnly: e.target.checked })}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>

                {localFilters.showHighQualityOnly && (
                  <div className="pl-4">
                    <label htmlFor="min-score-select" className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum score
                    </label>
                    <select
                      id="min-score-select"
                      value={localFilters.minScore}
                      onChange={(e) =>
                        setLocalFilters({
                          ...localFilters,
                          minScore: Number(e.target.value) as FilterState["minScore"],
                        })
                      }
                      className={cn(
                        "w-full px-4 py-3 text-base border border-gray-300 rounded-lg",
                        "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                        "bg-white"
                      )}
                    >
                      <option value={7}>7.0 and above</option>
                      <option value={8}>8.0 and above</option>
                      <option value={9}>9.0 and above</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 px-4 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleCancel}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg",
                "text-base font-medium text-gray-700",
                "border border-gray-300 bg-white",
                "hover:bg-gray-50 active:bg-gray-100",
                "transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg",
                "text-base font-medium text-white",
                "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
                "transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              )}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
