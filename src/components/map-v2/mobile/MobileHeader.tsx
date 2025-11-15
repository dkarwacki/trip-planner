/**
 * Mobile Header
 * Compact header with search icon and optional back button
 */

import React from 'react';
import { Search, ArrowLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/common/utils';

interface MobileHeaderProps {
  onSearchClick: () => void;
  onMenuClick?: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
  backLabel?: string;
}

export function MobileHeader({ 
  onSearchClick, 
  onMenuClick,
  showBackButton = false,
  onBackClick,
  backLabel = 'Back to Planning'
}: MobileHeaderProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-12 border-b border-gray-200 bg-white">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left side - Menu or empty */}
        <div className="flex items-center">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className={cn(
                'rounded-lg p-2 text-gray-700 transition-colors',
                'hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
              )}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Center - Search */}
        <button
          onClick={onSearchClick}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-gray-600 transition-colors',
            'hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
          )}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
          <span className="text-sm font-medium">Search</span>
        </button>

        {/* Right side - Back button or empty */}
        <div className="flex items-center">
          {showBackButton && onBackClick && (
            <button
              onClick={onBackClick}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-blue-600 transition-colors',
                'hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{backLabel}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

