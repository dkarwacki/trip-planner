/**
 * Sortable list of plan item cards with drag-drop support
 */

import React, { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMapStore } from "../stores/mapStore";
import PlanItemCard from "./PlanItemCard";

interface PlanItemCardListProps {
  places: { id?: string | number; [key: string]: unknown }[]; // Will be typed with domain Place type
}

export default function PlanItemCardList({ places }: PlanItemCardListProps) {
  // Actions
  const reorderPlaces = useMapStore((state) => state.reorderPlaces);

  // Track expanded state for each place (placeId -> boolean)
  const [expandedPlaces, setExpandedPlaces] = useState<Record<string, boolean>>(() => {
    // Expand first place by default
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
    setExpandedPlaces((prev) => ({
      ...prev,
      [placeId]: !prev[placeId],
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = places.findIndex((p) => (p.id || p) === active.id);
      const newIndex = places.findIndex((p) => (p.id || p) === over.id);

      reorderPlaces(oldIndex, newIndex);
    }
  };

  // Get IDs for sortable context
  const placeIds = places.map((p, index) => {
    const id = p.id ?? index;
    return typeof id === "string" || typeof id === "number" ? id : String(index);
  });

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={placeIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-4 p-4">
          {places.map((place, index) => (
            <PlanItemCard
              key={place.id || index}
              place={place}
              order={index + 1}
              isExpanded={expandedPlaces[place.id || index] || false}
              onToggleExpand={toggleExpand}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
