/**
 * Mobile hub card list with touch-optimized drag-and-drop
 * Supports long-press to enter reorder mode
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { DndContext, closestCenter, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMapState } from "../context/MapStateContext";
import { MobileHubCard } from "./MobileHubCard";
import { X } from "lucide-react";

interface MobileHubCardListProps {
  places: any[]; // Will be typed with domain types
}

export function MobileHubCardList({ places }: MobileHubCardListProps) {
  const { dispatch } = useMapState();
  const [isReorderMode, setIsReorderMode] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track expanded state for each hub (placeId -> boolean)
  const [expandedHubs, setExpandedHubs] = useState<Record<string, boolean>>(() => {
    // Expand first hub by default
    if (places.length > 0) {
      return { [places[0].id || "0"]: true };
    }
    return {};
  });

  // Configure touch sensors for mobile drag-and-drop
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5,
      },
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

      // Haptic feedback on drop
      if ("vibrate" in navigator) {
        navigator.vibrate(10);
      }
    }

    // Reset inactivity timer
    resetInactivityTimer();
  };

  const enterReorderMode = useCallback(() => {
    setIsReorderMode(true);

    // Haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }

    // Start inactivity timer
    resetInactivityTimer();
  }, []);

  const exitReorderMode = useCallback(() => {
    setIsReorderMode(false);

    // Clear timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Set new timer: auto-exit after 30s of inactivity
    inactivityTimerRef.current = setTimeout(() => {
      exitReorderMode();
    }, 30000);
  }, [exitReorderMode]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  // Get IDs for sortable context
  const placeIds = places.map((p) => p.id || p);

  return (
    <div className="space-y-4">
      {/* Reorder mode header */}
      {isReorderMode && (
        <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
          <h3 className="text-base font-semibold text-foreground">Reorder Hubs</h3>
          <button
            onClick={exitReorderMode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium min-h-[44px] active:opacity-80 transition-opacity"
          >
            <X className="h-5 w-5" />
            Done
          </button>
        </div>
      )}

      {/* Hub cards list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={placeIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-4 px-4">
            {places.map((place, index) => (
              <MobileHubCard
                key={place.id || index}
                place={place}
                order={index + 1}
                isExpanded={expandedHubs[place.id || index] || false}
                onToggleExpand={toggleExpand}
                showDragHandle={isReorderMode}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Helper text when not in reorder mode */}
      {!isReorderMode && places.length > 1 && (
        <div className="px-4 py-2 text-center">
          <p className="text-xs text-muted-foreground">Long-press a hub card to reorder</p>
        </div>
      )}
    </div>
  );
}


