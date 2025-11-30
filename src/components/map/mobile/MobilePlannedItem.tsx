/**
 * Mobile planned item card with swipe-to-delete gesture
 * Larger photo (100x75px), touch-optimized interactions
 */

import React, { useRef } from "react";
import { useMapStore } from "../stores/mapStore";
import { Star, Trash2, Landmark, UtensilsCrossed } from "lucide-react";
import { useSwipeToDelete } from "../hooks/useSwipeToDelete";
import { LazyImage } from "../shared/LazyImage";
import type { PlannedPOIViewModel } from "@/lib/map/types";

interface MobilePlannedItemProps {
  item: PlannedPOIViewModel;
  category: "attractions" | "restaurants";
  placeId: string;
}

export function MobilePlannedItem({ item, category, placeId }: MobilePlannedItemProps) {
  const removeAttractionFromPlace = useMapStore((state) => state.removeAttractionFromPlace);
  const removeRestaurantFromPlace = useMapStore((state) => state.removeRestaurantFromPlace);

  const setMobileTab = useMapStore((state) => state.setMobileTab);
  const containerRef = useRef<HTMLDivElement>(null);

  // Swipe-to-delete hook
  const { swipeOffset, isDeleteRevealed, bind, handleDelete } = useSwipeToDelete({
    onDelete: () => {
      if (category === "attractions") {
        removeAttractionFromPlace(placeId, item.id);
      } else {
        removeRestaurantFromPlace(placeId, item.id);
      }
    },
    deleteThreshold: 80, // Reveal delete button after 80px swipe
  });

  const handleTap = () => {
    if (isDeleteRevealed) {
      // If delete is showing, close it
      return;
    }

    setMobileTab("map");

    setTimeout(() => {
      const store = useMapStore.getState();
      store.setHighlightedPlace(item.id);
      store.setExpandedCard(item.id);
    }, 300);
  };

  // Extract real data from item
  const name = item.name || "Unknown Place";
  const categoryText = category === "attractions" ? "Attraction" : "Restaurant";
  const priceLevel = item.priceLevel ? "$".repeat(item.priceLevel) : undefined;
  const rating = item.rating || 0;
  const reviewCount = item.userRatingsTotal || 0;
  const photo = item.photos?.[0];
  const photoReference = photo?.photoReference;

  // Category icon
  const CategoryIcon = category === "attractions" ? Landmark : UtensilsCrossed;

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-lg">
      {/* Delete button background - revealed by swipe */}
      <div className="absolute inset-0 bg-destructive flex items-center justify-end px-6">
        <button onClick={handleDelete} className="flex items-center gap-2 text-destructive-foreground font-medium">
          <Trash2 className="h-5 w-5" />
          <span>Delete</span>
        </button>
      </div>

      {/* Item card - swipeable */}
      <div
        {...bind()}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? "transform 0.2s ease-out" : "none",
        }}
        className="bg-card border border-border rounded-lg overflow-hidden active:opacity-90"
      >
        <button onClick={handleTap} className="w-full p-3 flex gap-3 items-start text-left">
          {/* Larger photo for mobile: 100x75px */}
          <div className="relative shrink-0 w-[100px] h-[75px] rounded overflow-hidden bg-muted">
            {photoReference ? (
              <LazyImage
                photoReference={photoReference}
                alt={name}
                lat={item.latitude}
                lng={item.longitude}
                placeName={name}
                size="thumbnail"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <CategoryIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}

            {/* Category icon badge */}
            <div className="absolute bottom-1 left-1 bg-background/90 backdrop-blur-sm p-1 rounded shadow-sm">
              <CategoryIcon className="h-3 w-3 text-foreground" />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground text-base mb-1 line-clamp-1">{name}</h4>

            <div className="text-sm text-muted-foreground mb-2">
              {categoryText}
              {priceLevel && ` • ${priceLevel}`}
            </div>

            {/* Rating */}
            {rating > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                </div>
                {reviewCount > 0 && <span className="text-muted-foreground">({reviewCount})</span>}
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
