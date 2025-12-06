import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ItineraryItem } from "./ItineraryItem";
import type { ItineraryPlace } from "../types";

interface ItineraryListProps {
  places: ItineraryPlace[];
  onReorder: (places: ItineraryPlace[]) => void;
  onRemove: (placeId: string) => void;
}

/**
 * ItineraryList - Drag-drop sortable list
 *
 * Features:
 * - Drag-and-drop reordering (using @dnd-kit)
 * - Keyboard navigation support
 * - Touch support for mobile
 * - Accessible with proper ARIA attributes
 */
export function ItineraryList({ places, onReorder, onRemove }: ItineraryListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = places.findIndex((p) => p.id === active.id);
      const newIndex = places.findIndex((p) => p.id === over.id);

      const newPlaces = arrayMove(places, oldIndex, newIndex);
      onReorder(newPlaces);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={places.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2" role="list" aria-label="Itinerary places" data-testid="itinerary-list">
          {places.map((place, index) => (
            <ItineraryItem key={place.id} place={place} order={index + 1} onRemove={onRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
