/**
 * Recent Searches component
 * Displays search history with remove capability
 */

import React from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/common/utils";
import type { RecentSearch } from "@/lib/map-v2/recentSearches";

interface RecentSearchesProps {
  searches: RecentSearch[];
  onSelect: (search: RecentSearch) => void;
  onRemove: (placeId: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function RecentSearches({ searches, onSelect, onRemove, onClearAll, className }: RecentSearchesProps) {
  if (searches.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase">Recent Searches</h3>
        {searches.length >= 3 && (
          <button
            onClick={onClearAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
            aria-label="Clear all recent searches"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="space-y-1">
        {searches.map((search) => (
          <div
            key={search.placeId}
            className={cn(
              "group flex items-center justify-between",
              "px-3 py-2 rounded-md",
              "hover:bg-gray-50 transition-colors",
              "cursor-pointer"
            )}
          >
            <button
              onClick={() => onSelect(search)}
              className="flex items-center gap-3 flex-1 text-left"
              aria-label={`Search for ${search.mainText}`}
            >
              <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{search.mainText}</div>
                {search.secondaryText && <div className="text-xs text-gray-500 truncate">{search.secondaryText}</div>}
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(search.placeId);
              }}
              className={cn(
                "p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              )}
              aria-label={`Remove ${search.mainText} from recent searches`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}













