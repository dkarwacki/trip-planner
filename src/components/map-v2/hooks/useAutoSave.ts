/**
 * Auto-Save Hook for Map-v2
 *
 * Purpose: Handle automatic syncing of place changes to Supabase
 * - Debounced saves (500ms)
 * - Optimistic updates
 * - Error recovery
 */

import { useEffect, useRef, useCallback } from "react";
import { useMapStore } from "../stores/mapStore";
import { plannedPlacesToDAOs } from "@/lib/map-v2/tripMappers";
import { DEV_USER_ID } from "@/utils/consts";

interface UseAutoSaveOptions {
  enabled?: boolean;
  debounceMs?: number;
}

export function useAutoSave({ enabled = true, debounceMs = 500 }: UseAutoSaveOptions = {}) {
  const places = useMapStore((state) => state.places);
  const tripId = useMapStore((state) => state.tripId);
  const tripTitle = useMapStore((state) => state.tripTitle);
  const isDirty = useMapStore((state) => state.isDirty);
  const setSaveStatus = useMapStore((state) => state.setSaveStatus);
  const setLastSaved = useMapStore((state) => state.setLastSaved);
  const setTripTitle = useMapStore((state) => state.setTripTitle);
  const markSynced = useMapStore((state) => state.markSynced);
  const setSyncError = useMapStore((state) => state.setSyncError);

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);

  const savePlaces = useCallback(async () => {
    if (!tripId || !enabled || isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setSaveStatus("saving");

    try {
      // Convert PlannedPlace[] to PlaceDAO[]
      const placesData = plannedPlacesToDAOs(places);

      // Auto-update title if it's "Trip to ..." and we have places
      let newTitle = tripTitle;
      if (tripTitle === "Trip to ..." && places.length > 0) {
        newTitle = `Trip to ${places[0].name}`;
      }

      // Prepare body - include title if it changed
      const body: { places: unknown; title?: string } = { places: placesData };
      if (newTitle !== tripTitle) {
        body.title = newTitle;
      }

      // Call API to update trip places (and title if needed)
      const response = await fetch(`/api/trips/${tripId}/places`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save trip");
      }

      // Success - mark as synced
      markSynced([...places]);
      setSaveStatus("saved");
      setLastSaved(new Date());
      setSyncError(null);

      // Update title in store if it changed
      if (newTitle !== tripTitle) {
        setTripTitle(newTitle);
      }

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Auto-save failed:", error);
      setSaveStatus("error");
      setSyncError(error instanceof Error ? error : new Error("Unknown error"));
    } finally {
      isSavingRef.current = false;
    }
  }, [tripId, tripTitle, places, enabled, setSaveStatus, setLastSaved, setTripTitle, markSynced, setSyncError]);

  // Debounced save effect
  useEffect(() => {
    if (!enabled || !isDirty || !tripId) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      savePlaces();
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, tripId, enabled, debounceMs, savePlaces]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Return manual save function for retry button
  const manualSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    savePlaces();
  }, [savePlaces]);

  return {
    manualSave,
    isSaving: isSavingRef.current,
  };
}

