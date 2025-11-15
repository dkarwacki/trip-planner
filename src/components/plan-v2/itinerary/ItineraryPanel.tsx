import React from "react";
import { ItineraryList } from "./ItineraryList";
import { ItineraryEmptyState } from "./ItineraryEmptyState";
import { ExportButton } from "./ExportButton";
import type { ItineraryPanelProps } from "../types";
import { ChevronRight, ChevronLeft } from "lucide-react";

/**
 * ItineraryPanel - Desktop right sidebar
 *
 * Features:
 * - Header with place count badge
 * - Collapsible panel
 * - Empty state when no places
 * - Scrollable list
 * - Export button at bottom
 */
export function ItineraryPanel({
  places,
  onReorder,
  onRemove,
  onExportToMap,
  isCollapsed = false,
  onToggleCollapse,
}: ItineraryPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        {!isCollapsed && (
          <>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Your Itinerary</h2>
              {places.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {places.length}
                </span>
              )}
            </div>
          </>
        )}
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
      {places.length > 0 && !isCollapsed && (
        <div className="border-t p-4">
          <ExportButton
            onClick={onExportToMap}
            disabled={places.length === 0}
            placeCount={places.length}
          />
        </div>
      )}

      {/* Collapse toggle */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="border-t p-2 hover:bg-accent"
          aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
        >
          {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      )}
    </div>
  );
}
