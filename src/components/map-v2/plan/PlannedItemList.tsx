/**
 * List of planned items within a hub card
 * Supports drag-to-reorder within the same category
 */

import React from 'react';
import PlannedItem from './PlannedItem';

interface PlannedItemListProps {
  items: any[]; // Will be typed with domain types
  category: 'attractions' | 'restaurants';
}

export default function PlannedItemList({ items, category }: PlannedItemListProps) {
  // TODO: Implement drag-drop reordering with @dnd-kit

  const handleRemove = (itemId: string) => {
    // TODO: Implement remove from plan
    console.log('Remove item:', itemId);
  };

  const handleClick = (itemId: string) => {
    // TODO: Pan map to location and show details
    console.log('Show item details:', itemId);
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <PlannedItem
          key={item.id}
          item={item}
          category={category}
          onRemove={handleRemove}
          onClick={handleClick}
        />
      ))}
    </div>
  );
}

