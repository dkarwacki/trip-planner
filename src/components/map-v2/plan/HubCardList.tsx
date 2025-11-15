/**
 * Sortable list of hub cards with drag-drop support
 */

import React, { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMapState } from "../context/MapStateContext";
import HubCard from "./HubCard";

interface HubCardListProps {
  places: any[]; // Will be typed with domain types
}

export default function HubCardList({ places }: HubCardListProps) {
  const { dispatch } = useMapState();

  // Track expanded state for each hub (placeId -> boolean)
  const [expandedHubs, setExpandedHubs] = useState<Record<string, boolean>>(() => {
    // Expand first hub by default
    if (places.length > 0) {
      return { [places[0].id || "0"]: true };
    }
    return {};
  });

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleExpand = (placeId: string) => {
    setExpandedHubs((prev) => ({
      ...prev,
      [placeId]: !prev[placeId],
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = places.findIndex((p) => (p.id || p) === active.id);
      const newIndex = places.findIndex((p) => (p.id || p) === over.id);

      dispatch({
        type: "REORDER_PLACES",
        payload: { sourceIndex: oldIndex, destinationIndex: newIndex },
      });
    }
  };

  // Get IDs for sortable context
  const placeIds = places.map((p) => p.id || p);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={placeIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-4 p-4">
          {places.map((place, index) => (
            <HubCard
              key={place.id || index}
              place={place}
              order={index + 1}
              isExpanded={expandedHubs[place.id || index] || false}
              onToggleExpand={toggleExpand}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
