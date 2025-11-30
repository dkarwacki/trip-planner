/**
 * Main orchestrator component for map
 * Detects platform and renders appropriate layout
 */

import React from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { MapStateProvider } from "./context";
import { useResponsive } from "./hooks";
import { DesktopLayout } from "./layouts/DesktopLayout";
import { MobileLayout } from "./mobile/MobileLayout";

interface MapPlannerProps {
  apiKey: string;
  mapId?: string;
  tripId?: string;
  conversationId?: string;
}

export function MapPlanner({ apiKey, mapId, tripId, conversationId }: MapPlannerProps) {
  return (
    <MapStateProvider tripId={tripId} conversationId={conversationId}>
      <MapPlannerInner apiKey={apiKey} mapId={mapId} tripId={tripId} conversationId={conversationId} />
    </MapStateProvider>
  );
}

// Separate inner component to use context hooks
function MapPlannerInner({ apiKey, mapId, tripId }: MapPlannerProps) {
  const { isDesktop, isTablet } = useResponsive();

  // Treat tablet as desktop for now (can be refined later)
  const shouldShowDesktop = isDesktop || isTablet;

  // Wrap both layouts in a single APIProvider to avoid duplicate API loading
  return (
    <APIProvider apiKey={apiKey} libraries={["geometry", "places", "marker"]}>
      {shouldShowDesktop ? (
        <DesktopLayout mapId={mapId} tripId={tripId} />
      ) : (
        <MobileLayout mapId={mapId} tripId={tripId} />
      )}
    </APIProvider>
  );
}
