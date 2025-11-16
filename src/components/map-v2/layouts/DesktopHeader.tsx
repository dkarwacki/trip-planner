/**
 * Desktop header component
 * Displays branding, search bar, save status, and optional conversation link
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2, AlertCircle, Check } from "lucide-react";
import type { SaveStatus } from "../types";
import { PlaceSearchBar } from "../search/PlaceSearchBar";
import { useMapState } from "../context";

interface DesktopHeaderProps {
  conversationId?: string;
  saveStatus: SaveStatus;
  onRetrySync?: () => void;
  mapInstance?: google.maps.Map | null;
}

export function DesktopHeader({ conversationId, saveStatus, onRetrySync, mapInstance }: DesktopHeaderProps) {
  const { dispatch } = useMapState();

  // Handle place selection from search
  const handlePlaceSelect = async (placeDetails: {
    placeId: string;
    name: string;
    formattedAddress: string;
    location: { lat: number; lng: number };
  }) => {
    // Ensure coordinates are numbers (handle both number and function cases)
    const latValue = placeDetails.location.lat as unknown;
    const lngValue = placeDetails.location.lng as unknown;
    const lat = typeof latValue === "function" ? (latValue as () => number)() : Number(latValue);
    const lng = typeof lngValue === "function" ? (lngValue as () => number)() : Number(lngValue);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
      console.error("Invalid coordinates:", placeDetails.location);
      return;
    }

    // Create new place object
    const newPlace = {
      id: placeDetails.placeId,
      name: placeDetails.name,
      address: placeDetails.formattedAddress,
      lat,
      lng,
      plannedAttractions: [],
      plannedRestaurants: [],
    };

    // Add to state
    dispatch({ type: "ADD_PLACE", payload: newPlace });
    dispatch({ type: "SELECT_PLACE", payload: newPlace.id });
    dispatch({ type: "SET_ACTIVE_MODE", payload: "discover" });

    // Pan map to new location
    if (mapInstance) {
      mapInstance.panTo({ lat, lng });
      mapInstance.setZoom(13);
    }
  };

  // Calculate left position - always use expanded sidebar width so search doesn't move when collapsed
  // Sidebar is w-16 (4rem) when collapsed, w-[24rem] (24rem) on mobile, w-[28rem] (28rem) on lg+
  // Add 1rem gap after sidebar
  // Always use expanded width (24rem/28rem) regardless of collapsed state
  const searchLeft = "calc(24rem + 1rem)";
  const searchLeftLg = "calc(28rem + 1rem)";

  return (
    <header
      className="h-14 border-b bg-white flex items-center justify-between px-4 flex-shrink-0 z-[110] relative"
      style={
        {
          "--search-left": searchLeft,
          "--search-left-lg": searchLeftLg,
        } as React.CSSProperties
      }
    >
      {/* Left: Branding */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <h1 className="text-lg font-bold text-gray-900">Trip Planner</h1>
        <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded">Map</span>
      </div>

      {/* Search Bar - positioned just after sidebar */}
      <div
        className="w-80 lg:w-[32rem] xl:w-[36rem] search-bar-container"
        style={{
          position: "absolute",
          left: "var(--search-left)",
        }}
      >
        <style>{`
          @media (min-width: 1024px) {
            .search-bar-container {
              left: var(--search-left-lg) !important;
            }
          }
        `}</style>
        <PlaceSearchBar onPlaceSelect={handlePlaceSelect} placeholder="Search for a place..." />
      </div>

      {/* Right: Save Status & Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {saveStatus === "saving" && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
        {saveStatus === "saved" && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <Check className="h-3.5 w-3.5" />
            <span>Saved</span>
          </div>
        )}
        {saveStatus === "error" && (
          <div className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Error saving</span>
            {onRetrySync && (
              <button onClick={onRetrySync} className="underline hover:no-underline font-medium">
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {conversationId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = `/plan-v2?conversationId=${conversationId}`)}
            className="flex items-center gap-1.5"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Back to Chat</span>
          </Button>
        )}
      </div>
    </header>
  );
}
