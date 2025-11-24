/**
 * List of planned items within a hub card
 * Supports drag-to-reorder within the same category
 */

import React from "react";
import PlannedItem from "./PlannedItem";
import { useMapStore } from "../stores/mapStore";

import type { PlannedPOIViewModel } from "@/lib/map-v2/types";

interface PlannedItemListProps {
  items: PlannedPOIViewModel[];
  category: "attractions" | "restaurants";
  placeId: string;
}

export default function PlannedItemList({ items, category, placeId }: PlannedItemListProps) {
  // Actions
  const removeAttractionFromPlace = useMapStore((state) => state.removeAttractionFromPlace);
  const removeRestaurantFromPlace = useMapStore((state) => state.removeRestaurantFromPlace);
  const setExpandedCard = useMapStore((state) => state.setExpandedCard);
  const setHighlightedPlace = useMapStore((state) => state.setHighlightedPlace);

  const handleRemove = (itemId: string) => {
    if (category === "attractions") {
      removeAttractionFromPlace(placeId, itemId);
    } else {
      removeRestaurantFromPlace(placeId, itemId);
    }
  };

  const handleClick = (itemId: string) => {
    // Set highlighted place and expanded card to show the attraction on the map
    setHighlightedPlace(itemId);
    setExpandedCard(itemId);
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <PlannedItem key={item.id} item={item} category={category} onRemove={handleRemove} onClick={handleClick} />
      ))}
    </div>
  );
}
