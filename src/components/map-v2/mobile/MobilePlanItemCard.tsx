/**
 * Mobile-optimized plan item card with touch-friendly interactions
 * Larger touch targets, more padding, simplified layout
 */

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMapStore } from "../stores/mapStore";
import { GripVertical, ChevronRight, ChevronDown, Search } from "lucide-react";
import { MobilePlannedItemList } from "./MobilePlannedItemList";
import type { PlannedPlaceViewModel, PlannedPOIViewModel } from "@/lib/map-v2/types";

interface MobilePlanItemCardProps {
  place: PlannedPlaceViewModel;
  order: number;
  isExpanded: boolean;
  onToggleExpand: (placeId: string) => void;
  showDragHandle?: boolean; // Only show in reorder mode
}

export function MobilePlanItemCard({
  place,
  order,
  isExpanded,
  onToggleExpand,
  showDragHandle = false,
}: MobilePlanItemCardProps) {
  const centerOnPlace = useMapStore((state) => state.centerOnPlace);
  const setSelectedPlace = useMapStore((state) => state.setSelectedPlace);
  const setMobileTab = useMapStore((state) => state.setMobileTab);

  // Setup sortable
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: place.id,
  });

  // Track which category sections are expanded (attractions, restaurants)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    attractions: true, // Expand attractions by default on mobile
    restaurants: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Get actual attractions and restaurants from place data
  const attractions: PlannedPOIViewModel[] = place.plannedAttractions || [];
  const restaurants: PlannedPOIViewModel[] = place.plannedRestaurants || [];

  const placeName = place.name || "Unknown Place";
  const placeLocation = ""; // PlannedPlaceViewModel doesn't have vicinity field

  const handleBannerTap = () => {
    // Pan map to place location and switch to Map tab
    centerOnPlace(place.id);
    setMobileTab("map");
  };

  const handleDiscoverMore = () => {
    setSelectedPlace(place.id);
    setMobileTab("discover");
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-border bg-card shadow-sm overflow-hidden ${
        isDragging ? "opacity-50 shadow-lg scale-105" : ""
      }`}
    >
      {/* Banner with photo - shorter aspect ratio for mobile (16:3) */}
      <button
        onClick={handleBannerTap}
        className="relative w-full h-20 bg-gradient-to-br from-primary/20 to-primary/5 active:opacity-80 transition-opacity"
      >
        {/* Drag handle - only visible in reorder mode */}
        {showDragHandle && (
          <div
            {...attributes}
            {...listeners}
            className="absolute left-0 top-0 bottom-0 flex w-11 items-center justify-center cursor-grab bg-black/10 active:cursor-grabbing z-10"
            onClick={(e) => e.stopPropagation()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
              }
            }}
          >
            <GripVertical className="h-6 w-6 text-foreground" />
          </div>
        )}

        {/* Number badge */}
        <div className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground shadow">
          {order}
        </div>

        {/* TODO: Add banner photo when available */}
      </button>

      {/* Card content with more padding for mobile */}
      <div className="p-4">
        {/* Place name and location - tap to toggle expand */}
        <button onClick={() => onToggleExpand(place.id)} className="w-full text-left">
          <h3 className="text-lg font-semibold text-foreground mb-1">{placeName}</h3>
          {placeLocation && <p className="text-sm text-muted-foreground">{placeLocation}</p>}
        </button>

        {/* Stats - larger text for mobile */}
        <div className="mt-3 text-sm text-muted-foreground">
          {attractions.length} {attractions.length === 1 ? "attraction" : "attractions"} • {restaurants.length}{" "}
          {restaurants.length === 1 ? "restaurant" : "restaurants"}
        </div>

        {/* Collapsible sections */}
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Attractions section */}
            <div>
              <button
                onClick={() => toggleSection("attractions")}
                className="flex w-full items-center gap-2 py-2 text-base font-medium text-foreground active:opacity-70 transition-opacity min-h-[44px]"
              >
                {expandedSections.attractions ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <span>Attractions ({attractions.length})</span>
              </button>

              {expandedSections.attractions && (
                <div className="mt-2">
                  {attractions.length > 0 ? (
                    <MobilePlannedItemList items={attractions} category="attractions" />
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-3 px-2">No attractions added yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Restaurants section */}
            <div>
              <button
                onClick={() => toggleSection("restaurants")}
                className="flex w-full items-center gap-2 py-2 text-base font-medium text-foreground active:opacity-70 transition-opacity min-h-[44px]"
              >
                {expandedSections.restaurants ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <span>Restaurants ({restaurants.length})</span>
              </button>

              {expandedSections.restaurants && (
                <div className="mt-2">
                  {restaurants.length > 0 ? (
                    <MobilePlannedItemList items={restaurants} category="restaurants" />
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-3 px-2">No restaurants added yet</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Discover more button - larger for mobile (min-h-44px) */}
        {isExpanded && (
          <button
            onClick={handleDiscoverMore}
            className="mt-4 w-full rounded-lg border border-border bg-background px-4 py-3 text-base font-medium text-foreground active:bg-muted transition-colors flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Search className="h-5 w-5" />
            Discover more here
          </button>
        )}
      </div>
    </div>
  );
}
