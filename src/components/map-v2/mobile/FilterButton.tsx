/**
 * Filter Button
 * Opens filter options for attractions/restaurants/all
 */

import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useMapState } from '../context';
import { cn } from '@/lib/common/utils';

export function FilterButton() {
  const { filters } = useMapState();
  const [showMenu, setShowMenu] = useState(false);

  // Show badge if not showing all categories
  const hasActiveFilter = filters.category !== 'all';

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={cn(
          'relative flex h-12 w-12 items-center justify-center rounded-full',
          'bg-white text-gray-700 shadow-md transition-all',
          'hover:bg-gray-50 hover:shadow-lg',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50',
          'active:scale-95'
        )}
        aria-label="Filter places"
        aria-expanded={showMenu}
      >
        <SlidersHorizontal className="h-5 w-5" />
        
        {/* Badge for active filters */}
        {hasActiveFilter && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            1
          </span>
        )}
      </button>

      {/* Filter menu will be implemented later */}
      {showMenu && (
        <div className="absolute bottom-full left-0 mb-2 rounded-lg bg-white p-2 shadow-lg">
          <p className="text-sm text-gray-600">Filter menu coming soon</p>
        </div>
      )}
    </div>
  );
}

