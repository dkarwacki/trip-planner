/**
 * Chat header showing current context
 * Sticky at top of chat panel
 */

import React from "react";
import { MapPin } from "lucide-react";

interface ChatHeaderProps {
  selectedPlace: { name: string; id: string } | null;
}

export function ChatHeader({ selectedPlace }: ChatHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-0.5">Getting suggestions for:</p>
          {selectedPlace ? (
            <p className="text-sm font-semibold text-gray-900 truncate">{selectedPlace.name}</p>
          ) : (
            <p className="text-sm text-gray-500 italic">Select a place to get AI suggestions</p>
          )}
        </div>
      </div>
    </div>
  );
}



