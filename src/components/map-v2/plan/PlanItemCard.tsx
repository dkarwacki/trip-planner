/**
 * Individual plan item card with banner, stats, collapsible sections
 * Shows attractions and restaurants grouped for a place (city/location)
 */

import React, { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMapStore } from "../stores/mapStore";
import { Search, X } from "lucide-react";
import PlannedItemList from "./PlannedItemList";
import { LazyImage } from "../shared/LazyImage";

import type { PlannedPlace, FilterState } from "../types";

interface PlanItemCardProps {
  id: string;
  place: PlannedPlace;
  order: number;
  isExpanded: boolean;
  onToggleExpand: (placeId: string) => void;
  filter?: FilterState["category"];
}

const PlanItemCard = React.memo(
  function PlanItemCard({ id, place, order, isExpanded, onToggleExpand, filter = "all" }: PlanItemCardProps) {
    // Actions
    const setSelectedPlace = useMapStore((state) => state.setSelectedPlace);
    const setActiveMode = useMapStore((state) => state.setActiveMode);
    const centerOnPlace = useMapStore((state) => state.centerOnPlace);
    const removePlace = useMapStore((state) => state.removePlace);

    // Setup sortable
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: id,
    });

    // Get actual attractions and restaurants from place data
    // No need for useMemo - simple array check is faster than memoization overhead
    const attractions = (Array.isArray(place.plannedAttractions) ? place.plannedAttractions : []) as any[];
    const restaurants = (Array.isArray(place.plannedRestaurants) ? place.plannedRestaurants : []) as any[];

    // Get first attraction's photo for banner (memoized)
    const bannerPhoto = useMemo(() => attractions[0]?.photos?.[0], [attractions]);

    const placeName = place.name || place.displayName || "Unknown Place";

    const handleDiscoverMore = () => {
      setSelectedPlace(id);
      setActiveMode("discover");
    };

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      removePlace(id);
    };

    const handleCardClick = (e: React.MouseEvent | React.KeyboardEvent) => {
      // Don't trigger if clicking on interactive elements
      const target = e.target as HTMLElement;
      const closestRoleButton = target.closest('[role="button"]');
      const isInteractiveElement =
        target.closest("button") ||
        target.closest("a") ||
        // Ignore the card's own role="button", only check for child interactive elements
        (closestRoleButton && closestRoleButton !== e.currentTarget) ||
        target.closest("[data-sortable-handle]");

      // Don't trigger if clicking on the drag handle area
      if (target.closest('[class*="cursor-grab"]') || target.closest('[class*="cursor-grabbing"]')) {
        return;
      }

      if (!isInteractiveElement) {
        onToggleExpand(id);
        centerOnPlace(id);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCardClick(e);
      }
    };

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} className={`relative flex gap-6 ${isDragging ? "opacity-50 z-50" : ""}`}>
        {/* Timeline Node */}
        <div className="flex-shrink-0 flex flex-col items-center pt-4">
          <div
            {...attributes}
            {...listeners}
            data-sortable-handle
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-gray-400 text-sm font-medium text-gray-500 shadow-sm cursor-grab hover:border-gray-600 hover:text-gray-700 active:cursor-grabbing z-10"
          >
            {order}
          </div>
        </div>

        {/* Card Content */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleCardClick}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-2xl bg-white shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 group"
        >
          <div className="flex p-4 gap-4">
            {/* Left Thumbnail */}
            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
              {bannerPhoto ? (
                <LazyImage
                  photoReference={bannerPhoto.photoReference}
                  alt={attractions[0]?.name || "Place photo"}
                  lat={attractions[0]?.location?.lat || 0}
                  lng={attractions[0]?.location?.lng || 0}
                  placeName={attractions[0]?.name || ""}
                  size="small"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Search className="h-8 w-8" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-gray-900 leading-tight truncate pr-2">{placeName}</h3>
                <button
                  onClick={handleRemove}
                  className="text-gray-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Remove place"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-1 space-y-0.5">
                <p className="text-sm text-gray-600">
                  {attractions.length} {attractions.length === 1 ? "attraction" : "attractions"}
                </p>
                <p className="text-sm text-gray-600">
                  {restaurants.length} {restaurants.length === 1 ? "restaurant" : "restaurants"}
                </p>
              </div>
            </div>
          </div>

          {/* Collapsible Sections */}
          {isExpanded && (
            <div className="border-t border-gray-100 bg-gray-50/50 p-3 space-y-4">
              {/* Combined list of items */}
              <div className="space-y-4">
                {/* Attractions */}
                {(filter === "all" || filter === "attractions") && attractions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 pl-1">
                      Attractions
                    </h4>
                    <PlannedItemList items={attractions} category="attractions" placeId={id} />
                  </div>
                )}

                {/* Restaurants */}
                {(filter === "all" || filter === "restaurants") && restaurants.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 pl-1">
                      Restaurants
                    </h4>
                    <PlannedItemList items={restaurants} category="restaurants" placeId={id} />
                  </div>
                )}

                {/* Empty state if nothing added */}
                {attractions.length === 0 && restaurants.length === 0 && (
                  <p className="text-sm text-gray-400 italic py-2 px-2 text-center">
                    No items added to this place yet.
                  </p>
                )}
              </div>

              {/* Discover More Button (Visible when expanded) */}
              <div className="pt-2 border-t border-gray-200/50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDiscoverMore();
                  }}
                  className="w-full rounded-lg bg-white border border-blue-200 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Search className="h-4 w-4" />
                  Discover more
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Compare actual IDs to catch when items are removed/added even if length stays same
    const prevAttractionIds = prevProps.place.plannedAttractions?.map((a) => a.id).join(",") || "";
    const nextAttractionIds = nextProps.place.plannedAttractions?.map((a) => a.id).join(",") || "";
    const prevRestaurantIds = prevProps.place.plannedRestaurants?.map((r) => r.id).join(",") || "";
    const nextRestaurantIds = nextProps.place.plannedRestaurants?.map((r) => r.id).join(",") || "";

    return (
      prevProps.place.id === nextProps.place.id &&
      prevProps.order === nextProps.order &&
      prevProps.isExpanded === nextProps.isExpanded &&
      prevAttractionIds === nextAttractionIds &&
      prevRestaurantIds === nextRestaurantIds &&
      prevProps.filter === nextProps.filter
    );
  }
);

export default PlanItemCard;
