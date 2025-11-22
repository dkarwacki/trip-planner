/**
 * List of planned items with swipe-to-delete support (mobile)
 */

import React from "react";
import { MobilePlannedItem } from "./MobilePlannedItem";

interface MobilePlannedItemListProps {
  items: any[]; // Will be typed with domain types
  category: "attractions" | "restaurants";
}

export function MobilePlannedItemList({ items, category }: MobilePlannedItemListProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <MobilePlannedItem key={item.id} item={item} category={category} />
      ))}
    </div>
  );
}













