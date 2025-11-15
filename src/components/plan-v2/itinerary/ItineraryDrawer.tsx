import React from "react";
import { ItineraryList } from "./ItineraryList";
import { ItineraryEmptyState } from "./ItineraryEmptyState";
import { ExportButton } from "./ExportButton";
import type { ItineraryPanelProps } from "../types";

/**
 * ItineraryDrawer - Mobile full-screen view
 *
 * Features:
 * - Full-height mobile layout
 * - Header with count
 * - Scrollable list
 * - Export button at bottom
 * - Safe area insets
 */
export function ItineraryDrawer({
  places,
  onReorder,
  onRemove,
  onExportToMap,
}: ItineraryPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Your Itinerary</h2>
          {places.length > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
              {places.length}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {places.length === 0 ? (
          <ItineraryEmptyState />
        ) : (
          <ItineraryList places={places} onReorder={onReorder} onRemove={onRemove} />
        )}
      </div>

      {/* Export button */}
      {places.length > 0 && (
        <div className="border-t p-4 pb-safe">
          <ExportButton
            onClick={onExportToMap}
            disabled={places.length === 0}
            placeCount={places.length}
          />
        </div>
      )}
    </div>
  );
}
