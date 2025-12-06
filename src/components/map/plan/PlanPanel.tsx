/**
 * Main container for Plan mode panel (desktop)
 * Shows itinerary with places, stats, and view options
 */

import React, { useState } from "react";
import { useMapStore } from "../stores/mapStore";
import PlanItemCardList from "./PlanItemCardList";
import { Backpack } from "lucide-react";
import { PlanHeader } from "./PlanHeader";
import { PlanToolbar } from "./PlanToolbar";
import type { FilterState } from "../types";

export default function PlanPanel() {
  // Selectors
  const places = useMapStore((state) => state.places);

  // Actions
  const setActiveMode = useMapStore((state) => state.setActiveMode);

  // Local state
  const [filter, setFilter] = useState<FilterState["category"]>("all");

  const hasPlaces = places.length > 0;

  // Empty state when no places in plan
  if (!hasPlaces) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center" data-testid="plan-panel-empty">
        <div className="mb-4 rounded-full bg-muted p-6">
          <Backpack className="h-12 w-12 text-muted-foreground" />
        </div>

        <h3 className="mb-2 text-lg font-semibold text-foreground">Your itinerary is empty</h3>

        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          Select a place on the map and switch to Discover mode to start adding attractions and restaurants to your
          trip.
        </p>

        <button
          onClick={() => setActiveMode("discover")}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          data-testid="go-to-discover-button"
        >
          Go to Discover
        </button>
      </div>
    );
  }

  const handleShare = () => {
    console.log("Share clicked");
    // TODO: Implement share functionality
  };

  return (
    <div className="flex h-full flex-col bg-white" data-testid="plan-panel">
      {/* Header with stats and actions */}
      <PlanHeader places={places} onShare={handleShare} />

      {/* Toolbar with filters */}
      <div className="px-4 py-2 border-b border-gray-200">
        <PlanToolbar filter={filter} onFilterChange={setFilter} />
      </div>

      {/* Scrollable place cards area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <PlanItemCardList places={places} filter={filter} />
      </div>
    </div>
  );
}
