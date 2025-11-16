/**
 * Search Area Button
 * Appears when map is panned away from selected location
 * Triggers new search for current map viewport
 */

import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/common/utils';

interface SearchAreaButtonProps {
  isVisible: boolean;
  isLoading?: boolean;
  onClick: () => void;
  className?: string;
}

export function SearchAreaButton({
  isVisible,
  isLoading = false,
  onClick,
  className,
}: SearchAreaButtonProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed top-20 left-1/2 -translate-x-1/2 z-30',
        'animate-in slide-in-from-top duration-200',
        className
      )}
    >
      <button
        onClick={onClick}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-full',
          'bg-blue-600 text-white font-medium text-sm',
          'shadow-lg hover:shadow-xl',
          'hover:bg-blue-700 active:bg-blue-800',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Mobile responsive
          'md:px-5 md:py-3 md:text-base'
        )}
        aria-label={isLoading ? 'Searching this area...' : 'Search this area'}
      >
        {isLoading ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            <span>Searching...</span>
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            <span>Search this area</span>
          </>
        )}
      </button>
    </div>
  );
}

