/**
 * Hook for optimistic UI updates when adding places to plan
 * Provides smooth transitions by tracking "adding" state locally
 * while planned state is managed in Zustand store
 */

import { useState, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useMapStore, selectPlannedIds } from "../stores/mapStore";

interface UseOptimisticPlannedReturn {
  isAdded: (id: string) => boolean;
  isAdding: (id: string) => boolean;
  addOptimistic: (id: string) => () => void;
  plannedIds: Set<string>;
}

/**
 * Manages optimistic state for adding places to plan
 * Similar to useAIChat's addingPlaceIds pattern but generalized
 */
export function useOptimisticPlanned(): UseOptimisticPlannedReturn {
  // Local state for items currently being added (optimistic)
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

  // Global state for items already in plan
  const plannedIds = useMapStore(useShallow(selectPlannedIds));

  /**
   * Check if item is already in plan
   */
  const isAdded = useCallback((id: string) => plannedIds.has(id), [plannedIds]);

  /**
   * Check if item is currently being added (optimistic state)
   */
  const isAdding = useCallback((id: string) => addingIds.has(id), [addingIds]);

  /**
   * Mark item as being added (optimistic update)
   * Returns cleanup function to clear the optimistic state
   */
  const addOptimistic = useCallback((id: string) => {
    // Add to optimistic state
    setAddingIds((prev) => new Set(prev).add(id));

    // Return cleanup function to remove from adding state
    return () => {
      setAddingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    };
  }, []);

  return {
    isAdded,
    isAdding,
    addOptimistic,
    plannedIds,
  };
}
