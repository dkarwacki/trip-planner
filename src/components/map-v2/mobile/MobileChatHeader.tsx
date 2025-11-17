/**
 * Mobile Chat Header
 * Fixed header for AI chat modal with close button and context indicator
 *
 * Features:
 * - Close button (×) on left
 * - Title in center
 * - Optional "Done" button on right
 * - Context indicator showing selected place
 */

import React from "react";
import { X, MapPin } from "lucide-react";

interface MobileChatHeaderProps {
  onClose: () => void;
  selectedPlace?: { name: string } | null;
}

export function MobileChatHeader({ onClose, selectedPlace }: MobileChatHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
      {/* Header bar */}
      <div className="flex items-center justify-between h-12 px-4">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 -ml-2 text-gray-600 hover:text-gray-900 active:bg-gray-100 rounded-full transition-colors"
          aria-label="Close AI chat"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-base font-semibold text-gray-900">AI Assistant</h2>

        <button
          onClick={onClose}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 active:text-blue-800 px-2 py-1 rounded transition-colors"
        >
          Done
        </button>
      </div>

      {/* Context indicator */}
      {selectedPlace && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-t border-blue-100">
          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-900">
            Planning for: <span className="font-medium">{selectedPlace.name}</span>
          </span>
        </div>
      )}

      {!selectedPlace && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-t border-amber-100">
          <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm text-amber-900">Select a place to get AI suggestions</span>
        </div>
      )}
    </div>
  );
}
