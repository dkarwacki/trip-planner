/**
 * Search Overlay
 * Full-screen search overlay for mobile
 * Will be fully implemented later
 */

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/common/utils';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
          <button
            onClick={onClose}
            className={cn(
              'rounded-lg p-2 text-gray-700 transition-colors',
              'hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
            )}
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </button>
          <input
            type="text"
            placeholder="Search places..."
            className="flex-1 border-none bg-transparent text-base outline-none"
            autoFocus
          />
        </div>

        {/* Search Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-center text-gray-500">Search functionality coming soon</p>
        </div>
      </div>
    </div>
  );
}

