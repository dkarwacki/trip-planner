/**
 * Trip Selector Component
 *
 * Purpose: Allow users to switch between trips or create new ones
 * - Display recent trips (up to 10)
 * - Show trip metadata (title, place count, last updated)
 * - Create new trip option
 * - Current trip indicator
 */

import React, { useEffect, useState } from "react";
import { Clock, Plus, MapPin, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/common/utils";
import { useMapStore } from "../stores/mapStore";
import { plannedPlacesFromDAOs } from "@/lib/map-v2/tripMappers";

interface TripSummary {
  id: string;
  title: string;
  place_count: number;
  conversation_id: string | null;
  updated_at: string;
}

interface TripSelectorProps {
  children: React.ReactNode;
}

export function TripSelector({ children }: TripSelectorProps) {
  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const tripId = useMapStore((state) => state.tripId);
  const setTripId = useMapStore((state) => state.setTripId);
  const setTripTitle = useMapStore((state) => state.setTripTitle);
  const setConversationId = useMapStore((state) => state.setConversationId);
  const setPlaces = useMapStore((state) => state.setPlaces);
  const markSynced = useMapStore((state) => state.markSynced);

  // Load recent trips when popover opens
  useEffect(() => {
    if (open) {
      loadRecentTrips();
    }
  }, [open]);

  const loadRecentTrips = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/trips/recent");
      if (response.ok) {
        const data = await response.json();
        setTrips(data);
      }
    } catch (error) {
      console.error("Failed to load recent trips:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTrip = async (trip: TripSummary) => {
    try {
      // Load the full trip data
      const response = await fetch(`/api/trips/${trip.id}`);
      if (!response.ok) {
        throw new Error("Failed to load trip");
      }

      const fullTrip = await response.json();

      // Update store with new trip
      setTripId(fullTrip.id);
      setTripTitle(fullTrip.title);
      setConversationId(fullTrip.conversation_id);

      // Convert PlaceDAOs to PlannedPlaces and set them
      const places = plannedPlacesFromDAOs(fullTrip.places || []);
      setPlaces(places);
      markSynced(places);

      setOpen(false);
    } catch (error) {
      console.error("Failed to switch trip:", error);
    }
  };

  const handleCreateNewTrip = async () => {
    setIsCreating(true);
    setOpen(false); // Close popover immediately for better UX

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Trip to ...",
          places: [],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create trip");
      }

      const newTrip = await response.json();

      // Update store with new trip
      setTripId(newTrip.id);
      setTripTitle(newTrip.title);
      setConversationId(null);
      setPlaces([]);
      markSynced([]);
    } catch (error) {
      console.error("Failed to create new trip:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTrip = async (e: React.MouseEvent, tripIdToDelete: string) => {
    e.stopPropagation(); // Prevent trip selection

    try {
      const response = await fetch(`/api/trips/${tripIdToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete trip");
      }

      // If the deleted trip is the current trip, create a new one
      if (tripIdToDelete === tripId) {
        const createResponse = await fetch("/api/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Trip to ...",
            places: [],
          }),
        });

        if (createResponse.ok) {
          const newTrip = await createResponse.json();
          setTripId(newTrip.id);
          setTripTitle(newTrip.title);
          setConversationId(null);
          setPlaces([]);
          markSynced([]);
        }
      }

      // Reload the trips list
      await loadRecentTrips();
    } catch (error) {
      console.error("Failed to delete trip:", error);
      alert("Failed to delete trip. Please try again.");
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0 z-[120]" align="end">
        <div className="flex flex-col max-h-[400px]">
          {/* Header */}
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">Your Trips</h3>
          </div>

          {/* Trip List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading trips...</div>
            ) : trips.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No trips yet</div>
            ) : (
              <div className="py-2">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className={cn(
                      "w-full px-4 py-3 hover:bg-muted/50 transition-colors",
                      "flex items-start gap-3 border-b last:border-b-0 group"
                    )}
                  >
                    <button onClick={() => handleSelectTrip(trip)} className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{trip.title}</span>
                        {trip.id === tripId && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {trip.place_count} {trip.place_count === 1 ? "place" : "places"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(trip.updated_at)}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={(e) => handleDeleteTrip(e, trip.id)}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 transition-opacity",
                        "p-1.5 hover:bg-destructive/10 rounded text-destructive",
                        "flex-shrink-0"
                      )}
                      aria-label="Delete trip"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Create New */}
          <div className="px-3 py-3 border-t bg-muted/30">
            <Button onClick={handleCreateNewTrip} disabled={isCreating} variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? "Creating..." : "Create New Trip"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
