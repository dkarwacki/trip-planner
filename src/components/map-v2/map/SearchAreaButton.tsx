/**
 * Search Area Button
 * Appears when map is panned away from selected location
 * Triggers new search for current map viewport
 */

import React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/common/utils";

interface SearchAreaButtonProps {
  isVisible: boolean;
  isLoading?: boolean;
  onClick: () => void;
  className?: string;
}

export function SearchAreaButton({ isVisible, isLoading = false, onClick, className }: SearchAreaButtonProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
        "animate-in fade-in duration-200 pointer-events-none",
        className
      )}
    >
      <button
        onClick={onClick}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full pointer-events-auto",
          "bg-white text-gray-700 font-medium text-sm",
          "shadow-md hover:shadow-lg",
          "border border-gray-300",
          "hover:bg-gray-50 active:bg-gray-100",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        aria-label={isLoading ? "Searching this area..." : "Search this area"}
      >
        {isLoading ? (
          <>
            <div className="animate-spin h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent rounded-full" />
            <span>Searching...</span>
          </>
        ) : (
          <>
            <Search className="h-3.5 w-3.5" />
            <span>Search this area</span>
          </>
        )}
      </button>
    </div>
  );
}
