/**
 * Plan header - shows itinerary stats and primary actions
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { PlannedPlace } from "../types";

interface PlanHeaderProps {
  places: PlannedPlace[];
  onShare?: () => void;
}

export function PlanHeader({ places, onShare }: PlanHeaderProps) {
  // Count hubs (unique places)
  const hubCount = places.length;

  // Count attractions and restaurants from the data structure
  const attractionCount = places.reduce((sum, place) => {
    return sum + (place.plannedAttractions?.length || 0);
  }, 0);

  const restaurantCount = places.reduce((sum, place) => {
    return sum + (place.plannedRestaurants?.length || 0);
  }, 0);

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Your Itinerary</h2>
          <p className="text-xs text-gray-600">
            {hubCount} {hubCount === 1 ? "place" : "places"}
            {attractionCount > 0 && (
              <span>
                {" • "}
                {attractionCount} {attractionCount === 1 ? "attraction" : "attractions"}
              </span>
            )}
            {restaurantCount > 0 && (
              <span>
                {" • "}
                {restaurantCount} {restaurantCount === 1 ? "restaurant" : "restaurants"}
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2" onClick={onShare}>
                  <ExternalLink className="h-4 w-4" />
                  Share
                </Button>
              </TooltipTrigger>
              <TooltipContent className="z-[150]">
                <p>Share plan (Coming Soon)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
