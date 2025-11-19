/**
 * Main container for Plan mode panel (desktop)
 * Shows itinerary with places, stats, and view options
 */

import React from "react";
import { useMapStore } from "../stores/mapStore";
import ItineraryStats from "./ItineraryStats";
import PlanItemCardList from "./PlanItemCardList";
import { Backpack } from "lucide-react";

export default function PlanPanel() {
  // Selectors
  const places = useMapStore((state) => state.places);

  // Actions
  const setActiveMode = useMapStore((state) => state.setActiveMode);

  const hasPlaces = places.length > 0;

  // Empty state when no places in plan
  if (!hasPlaces) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
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
        >
          Go to Discover
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with stats */}
      <div className="border-b border-border bg-background px-4 py-3 sticky top-0 z-10">
        <ItineraryStats places={places} />
      </div>

      {/* Scrollable place cards area */}
      <div className="flex-1 overflow-y-auto">
        <PlanItemCardList places={places} />
      </div>
    </div>
  );
}
