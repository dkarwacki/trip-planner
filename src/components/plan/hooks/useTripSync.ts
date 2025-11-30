import { useState, useCallback, useRef } from "react";
import type { ConversationId } from "@/domain/plan/models/ConversationHistory";
import type { ItineraryPlace, SaveStatus } from "../types";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";
import type { Place } from "@/domain/common/models";
import { createTrip, updateTrip, getTripForConversation } from "@/infrastructure/plan/clients/trips";

export interface UseTripSyncOptions {
  conversationId?: ConversationId;
  enabled?: boolean;
}

export interface UseTripSyncReturn {
  syncStatus: SaveStatus;
  syncTrip: (places: ItineraryPlace[]) => Promise<void>;
  resetStatus: () => void;
}

/**
 * Convert ItineraryPlace to domain Place model
 */
function itineraryPlaceToPlace(itineraryPlace: ItineraryPlace): Place {
  return {
    id: PlaceId(itineraryPlace.id),
    name: itineraryPlace.name,
    lat: Latitude(itineraryPlace.coordinates.lat),
    lng: Longitude(itineraryPlace.coordinates.lng),
    plannedAttractions: [],
    plannedRestaurants: [],
    photos: itineraryPlace.photos,
  };
}

/**
 * useTripSync - Handle immediate trip saves
 *
 * Features:
 * - Immediate save on action (no debouncing)
 * - Prevents concurrent saves
 * - Simple error logging (no retries)
 * - Auto-resets status after 3s (success) or 5s (error)
 */
export function useTripSync(options: UseTripSyncOptions): UseTripSyncReturn {
  const { conversationId, enabled = true } = options;
  const [syncStatus, setSyncStatus] = useState<SaveStatus>("idle");
  const isSyncingRef = useRef(false);

  const syncTrip = useCallback(
    async (places: ItineraryPlace[]): Promise<void> => {
      // Guard clauses
      if (!enabled || !conversationId) {
        return;
      }

      if (isSyncingRef.current) {
        console.log("Trip sync already in progress, skipping");
        return;
      }

      isSyncingRef.current = true;
      setSyncStatus("saving");

      try {
        // Convert to domain Places
        const domainPlaces: Place[] = places.map(itineraryPlaceToPlace);

        // Check if trip exists for this conversation
        const existingTrip = await getTripForConversation(conversationId);

        if (existingTrip) {
          // Update existing trip (even if empty - preserves trip record)
          await updateTrip(existingTrip.id, domainPlaces);
        } else {
          // Only create new trip if places exist
          if (domainPlaces.length > 0) {
            await createTrip(domainPlaces, conversationId);
          }
        }

        setSyncStatus("saved");

        // Auto-reset to idle after 3s
        setTimeout(() => {
          setSyncStatus("idle");
        }, 3000);
      } catch (error) {
        console.error("Failed to sync trip:", error);
        setSyncStatus("error");

        // Auto-reset error after 5s (longer than success)
        setTimeout(() => {
          setSyncStatus("idle");
        }, 5000);
      } finally {
        isSyncingRef.current = false;
      }
    },
    [conversationId, enabled]
  );

  const resetStatus = useCallback(() => {
    setSyncStatus("idle");
  }, []);

  return {
    syncStatus,
    syncTrip,
    resetStatus,
  };
}
