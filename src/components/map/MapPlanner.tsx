/**
 * Main orchestrator component for map
 * Detects platform and renders appropriate layout
 */

import React, { useEffect } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { MapStateProvider } from "./context";
import { useResponsive } from "./hooks";
import { DesktopLayout } from "./layouts/DesktopLayout";
import { MobileLayout } from "./mobile/MobileLayout";
import { useAuthStore, type AuthUser } from "@/components/auth";

interface MapPlannerProps {
  apiKey: string;
  mapId?: string;
  tripId?: string;
  conversationId?: string;
  user?: AuthUser;
}

export function MapPlanner({ apiKey, mapId, tripId, conversationId, user }: MapPlannerProps) {
  const setUser = useAuthStore((state) => state.setUser);

  // Initialize auth store with user from props (runs once on mount)
  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  return (
    <MapStateProvider tripId={tripId} conversationId={conversationId}>
      <MapPlannerInner apiKey={apiKey} mapId={mapId} tripId={tripId} conversationId={conversationId} user={user} />
    </MapStateProvider>
  );
}

// Separate inner component to use context hooks
function MapPlannerInner({ apiKey, mapId, tripId, user }: MapPlannerProps) {
  const { isDesktop, isTablet } = useResponsive();

  // Treat tablet as desktop for now (can be refined later)
  const shouldShowDesktop = isDesktop || isTablet;

  // Wrap both layouts in a single APIProvider to avoid duplicate API loading
  return (
    <APIProvider apiKey={apiKey} libraries={["geometry", "places", "marker"]}>
      {shouldShowDesktop ? (
        <DesktopLayout mapId={mapId} tripId={tripId} user={user} />
      ) : (
        <MobileLayout mapId={mapId} tripId={tripId} user={user} />
      )}
    </APIProvider>
  );
}
