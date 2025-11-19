/**
 * Individual plan item card with banner, stats, collapsible sections
 * Shows attractions and restaurants grouped for a place (city/location)
 */

import React, { useState, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMapStore } from "../stores/mapStore";
import { GripVertical, ChevronRight, ChevronDown, Search, X } from "lucide-react";
import PlannedItemList from "./PlannedItemList";
import { LazyImage } from "../shared/LazyImage";

interface PlanItemCardProps {
  place: any; // Will be typed with domain types
  order: number;
  isExpanded: boolean;
  onToggleExpand: (placeId: string) => void;
}

const PlanItemCard = React.memo(
  function PlanItemCard({ place, order, isExpanded, onToggleExpand }: PlanItemCardProps) {
    // Actions
    const setSelectedPlace = useMapStore((state) => state.setSelectedPlace);
    const setActiveMode = useMapStore((state) => state.setActiveMode);
    const centerOnPlace = useMapStore((state) => state.centerOnPlace);
    const removePlace = useMapStore((state) => state.removePlace);

    // Setup sortable
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: place.id || place,
    });

    // Track which category sections are expanded (attractions, restaurants)
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
      attractions: isExpanded,
      restaurants: false,
    });

    const toggleSection = (section: string) => {
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    };

    // Get actual attractions and restaurants from place data (memoized to avoid recalculation)
    const attractions: any[] = useMemo(() => place.plannedAttractions || [], [place.plannedAttractions]);
    const restaurants: any[] = useMemo(() => place.plannedRestaurants || [], [place.plannedRestaurants]);

    // Get first attraction's photo for banner (memoized)
    const bannerPhoto = useMemo(() => attractions[0]?.photos?.[0], [attractions]);

    const placeName = place.name || place.displayName || "Unknown Place";
    const placeLocation = place.location || place.vicinity || "";

    const handleDiscoverMore = () => {
      setSelectedPlace(place.id);
      setActiveMode("discover");
    };

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      removePlace(place.id);
    };

    const handleCardClick = (e: React.MouseEvent) => {
      // Don't trigger if clicking on interactive elements
      const target = e.target as HTMLElement;
      const isInteractiveElement =
        target.closest("button") ||
        target.closest("a") ||
        target.closest('[role="button"]') ||
        target.closest("[data-sortable-handle]");

      // Don't trigger if clicking on the drag handle area
      if (target.closest('[class*="cursor-grab"]') || target.closest('[class*="cursor-grabbing"]')) {
        return;
      }

      if (!isInteractiveElement) {
        onToggleExpand(place.id);
        centerOnPlace(place.id);
      }
    };

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        onClick={handleCardClick}
        className={`rounded-lg border border-border bg-card shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
          isDragging ? "opacity-50 shadow-lg scale-105" : ""
        }`}
      >
        {/* Banner with drag handle and photo */}
        <div className="relative h-24 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
          {/* Background photo if available */}
          {bannerPhoto && attractions[0] && (
            <div className="absolute inset-0">
              <LazyImage
                photoReference={bannerPhoto.photoReference}
                alt={attractions[0]?.name || "Place photo"}
                lat={attractions[0].location.lat}
                lng={attractions[0].location.lng}
                placeName={attractions[0].name}
                size="small"
                className="w-full h-full object-cover opacity-70"
              />
              {/* Overlay gradient for better contrast */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10" />
            </div>
          )}

          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            data-sortable-handle
            className="absolute left-0 top-0 bottom-0 flex w-11 items-center justify-center cursor-grab hover:bg-black/5 active:cursor-grabbing z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Number badge */}
          <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow z-10">
            {order}
          </div>
        </div>

        {/* Card content */}
        <div className="p-4 group">
          {/* Hub name and location */}
          <div className="w-full text-left relative">
            <h3 className="text-lg font-semibold text-foreground mb-1 pr-8">{placeName}</h3>
            {placeLocation && <p className="text-sm text-muted-foreground">{placeLocation}</p>}
            {/* Remove button */}
            <button
              onClick={handleRemove}
              className="absolute top-0 right-0 flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Remove place from itinerary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="mt-2 text-sm text-muted-foreground">
            <span className="text-blue-600 font-medium">
              {attractions.length} {attractions.length === 1 ? "attraction" : "attractions"}
            </span>{" "}
            •{" "}
            <span className="text-red-600 font-medium">
              {restaurants.length} {restaurants.length === 1 ? "restaurant" : "restaurants"}
            </span>
          </div>

          {/* Collapsible sections */}
          {isExpanded && (
            <div className="mt-4 space-y-3">
              {/* Attractions section */}
              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection("attractions");
                  }}
                  className="flex w-full items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {expandedSections.attractions ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span>Attractions ({attractions.length})</span>
                </button>

                {expandedSections.attractions && (
                  <div className="mt-2">
                    {attractions.length > 0 ? (
                      <PlannedItemList items={attractions} category="attractions" placeId={place.id} />
                    ) : (
                      <p className="text-sm text-muted-foreground italic py-2 px-4">No attractions added yet</p>
                    )}
                  </div>
                )}
              </div>

              {/* Restaurants section */}
              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection("restaurants");
                  }}
                  className="flex w-full items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  {expandedSections.restaurants ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span>Restaurants ({restaurants.length})</span>
                </button>

                {expandedSections.restaurants && (
                  <div className="mt-2">
                    {restaurants.length > 0 ? (
                      <PlannedItemList items={restaurants} category="restaurants" placeId={place.id} />
                    ) : (
                      <p className="text-sm text-muted-foreground italic py-2 px-4">No restaurants added yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Discover more button */}
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDiscoverMore();
              }}
              className="mt-4 w-full rounded-md border border-blue-200 bg-blue-50/50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
            >
              <Search className="h-4 w-4" />
              Discover more
            </button>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if these specific props change
    return (
      prevProps.place.id === nextProps.place.id &&
      prevProps.order === nextProps.order &&
      prevProps.isExpanded === nextProps.isExpanded &&
      prevProps.place.plannedAttractions?.length === nextProps.place.plannedAttractions?.length &&
      prevProps.place.plannedRestaurants?.length === nextProps.place.plannedRestaurants?.length
    );
  }
);

export default PlanItemCard;
