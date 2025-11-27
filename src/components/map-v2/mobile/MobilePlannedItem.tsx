/**
 * Mobile planned item card with swipe-to-delete gesture
 * Larger photo (100x75px), touch-optimized interactions
 */

import React, { useRef } from "react";
import { useMapStore } from "../stores/mapStore";
import { Star, Trash2 } from "lucide-react";
import { useSwipeToDelete } from "../hooks/useSwipeToDelete";
import type { PlannedPOIViewModel } from "@/lib/map-v2/types";

interface MobilePlannedItemProps {
  item: PlannedPOIViewModel;
  category: "attractions" | "restaurants";
}

export function MobilePlannedItem({ item, category }: MobilePlannedItemProps) {
  const removePlace = useMapStore((state) => state.removePlace);

  const setMobileTab = useMapStore((state) => state.setMobileTab);
  const setExpandedCard = useMapStore((state) => state.setExpandedCard);
  const setHighlightedPlace = useMapStore((state) => state.setHighlightedPlace);
  const containerRef = useRef<HTMLDivElement>(null);

  // Swipe-to-delete hook
  const { swipeOffset, isDeleteRevealed, bind, handleDelete } = useSwipeToDelete({
    onDelete: () => {
      removePlace(item.id);
    },
    deleteThreshold: 80, // Reveal delete button after 80px swipe
  });

  const handleTap = () => {
    if (isDeleteRevealed) {
      // If delete is showing, close it
      return;
    }
    // Pan map to location and switch to Map tab
    // We want to show the card, so we use setExpandedCard
    setHighlightedPlace(item.id);
    setExpandedCard(item.id);
    setMobileTab("map");
  };

  // Mock data - replace with real data structure
  const name = item.name || "Unknown Place";
  const categoryText = category === "attractions" ? "Attraction" : "Restaurant";
  const priceLevel = "$$";
  const rating = 4.5;
  const reviewCount = 123;

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
            {/* TODO: Add actual photo */}
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />

            {/* Category icon badge */}
            <div className="absolute bottom-1 left-1 bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium">
              {category === "attractions" ? "🏛️" : "🍽️"}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground text-base mb-1 line-clamp-1">{name}</h4>

            <div className="text-sm text-muted-foreground mb-2">
              {categoryText} • {priceLevel}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 text-sm">
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-medium text-foreground">{rating}</span>
              </div>
              <span className="text-muted-foreground">({reviewCount})</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
