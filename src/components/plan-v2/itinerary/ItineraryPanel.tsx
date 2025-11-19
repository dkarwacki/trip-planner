import React from "react";
import { ItineraryList } from "./ItineraryList";
import { ItineraryEmptyState } from "./ItineraryEmptyState";
import { ExportButton } from "./ExportButton";
import type { ItineraryPanelProps } from "../types";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

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
  if (isCollapsed) {
    return (
      <TooltipProvider>
        <div className="flex h-full flex-col items-center py-4 bg-white">
          <div className="flex-1 flex flex-col items-center gap-4">
            <Tooltip>
              <TooltipTrigger>
                <div className="text-2xl">📍</div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Itinerary</p>
              </TooltipContent>
            </Tooltip>

            {places.length > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {places.length}
              </span>
            )}
          </div>

          {/* Expand Button (Left to expand right sidebar) */}
          {onToggleCollapse && (
            <div className="p-2 border-t w-full flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onToggleCollapse}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    aria-label="Expand panel"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Expand Panel</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Sticky Header */}
      <div className="flex-shrink-0 bg-white border-b sticky top-0 z-[10]">
        <div className="flex items-center justify-between p-3">
          {onToggleCollapse && (
            <Button
              onClick={onToggleCollapse}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Collapse panel"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Your Itinerary</h2>
            {places.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {places.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {places.length === 0 ? (
          <ItineraryEmptyState />
        ) : (
          <ItineraryList places={places} onReorder={onReorder} onRemove={onRemove} />
        )}
      </div>

      {/* Export button */}
      {places.length > 0 && (
        <div className="border-t p-4 bg-white">
          <ExportButton onClick={onExportToMap} disabled={places.length === 0} placeCount={places.length} />
        </div>
      )}
    </div>
  );
}
