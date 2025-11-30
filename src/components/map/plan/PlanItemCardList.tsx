/**
 * Sortable list of plan item cards with drag-drop support
 */

import React, { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMapStore } from "../stores/mapStore";
import PlanItemCard from "./PlanItemCard";

import type { FilterState, PlannedPlace } from "../types";

interface PlanItemCardListProps {
  places: PlannedPlace[];
  filter?: FilterState["category"];
}

export default function PlanItemCardList({ places, filter = "all" }: PlanItemCardListProps) {
  // Actions
  const reorderPlaces = useMapStore((state) => state.reorderPlaces);

  // Track expanded place ID (only one can be expanded at a time)
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(() => {
    // Expand first place by default
    if (places.length > 0) {
      return places[0].id || "0";
    }
    return null;
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
    setExpandedPlaceId((prevId) => (prevId === placeId ? null : placeId));
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
        <div className="relative space-y-6 p-6">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[2.5rem] top-6 bottom-6 w-0.5 bg-gray-300 -z-10" />

          {places.map((place, index) => (
            <PlanItemCard
              key={place.id || index}
              id={place.id || String(index)}
              place={place}
              order={index + 1}
              isExpanded={expandedPlaceId === (place.id || String(index))}
              onToggleExpand={toggleExpand}
              filter={filter}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
