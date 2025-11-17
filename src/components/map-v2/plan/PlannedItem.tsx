/**
 * Individual planned item (attraction or restaurant)
 * Shows photo, name, category, score, with remove button
 */

import React from "react";
import { X, Landmark, UtensilsCrossed } from "lucide-react";
import { LazyImage } from "../shared/LazyImage";

interface PlannedItemProps {
  item: any; // Will be typed with domain types
  category: "attractions" | "restaurants";
  onRemove: (itemId: string) => void;
  onClick: (itemId: string) => void;
}

const PlannedItem = React.memo(
  function PlannedItem({ item, category, onRemove, onClick }: PlannedItemProps) {
    const name = item.name || "Unknown";
    const categoryLabel = category === "attractions" ? "Attraction" : "Restaurant";
    const score = item.score || 0;
    const rating = item.rating || 0;
    const reviewCount = item.reviewCount || item.userRatingsTotal || 0;

    // Get photo from photos array (Attraction model has photos?: PlacePhoto[])
    const photo = item.photos?.[0];
    const photoReference = photo?.photoReference;

    // Category icon
    const CategoryIcon = category === "attractions" ? Landmark : UtensilsCrossed;

    return (
      <div
        className="group flex gap-3 rounded-md border border-border bg-background p-3 hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick(item.id);
        }}
      >
        {/* Photo thumbnail with category badge */}
        <div className="relative flex-shrink-0">
          <div className="h-[60px] w-[80px] rounded-md bg-muted overflow-hidden">
            {photoReference ? (
              <LazyImage
                photoReference={photoReference}
                alt={name}
                size="thumbnail"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <CategoryIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Category badge overlay */}
          <div className="absolute bottom-1 left-1 rounded bg-background/90 p-1 shadow-sm">
            <CategoryIcon className="h-3 w-3 text-foreground" />
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground truncate mb-1">{name}</h4>

          <p className="text-xs text-muted-foreground mb-1">{categoryLabel}</p>

          {/* Rating and score */}
          <div className="flex items-center gap-2 text-xs">
            {rating > 0 && (
              <span className="text-muted-foreground">
                ★ {rating.toFixed(1)} {reviewCount > 0 && `(${reviewCount})`}
              </span>
            )}
            {score > 0 && <span className="font-medium text-foreground">Score: {score.toFixed(1)}</span>}
          </div>
        </div>

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Remove from plan"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Only re-render if item ID or category changes
    return prevProps.item.id === nextProps.item.id && prevProps.category === nextProps.category;
  }
);

export default PlannedItem;
