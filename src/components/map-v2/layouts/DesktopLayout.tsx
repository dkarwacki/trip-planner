/**
 * Desktop layout component
 * Main layout structure with header, sidebar, and map
 */

import React, { useState } from "react";
import { useMapState } from "../context";
import { DesktopHeader } from "./DesktopHeader";
import { DynamicSidebar } from "./DynamicSidebar";
import { MapCanvas } from "../map/MapCanvas";
import { DiscoverMode } from "../modes/DiscoverMode";
import { PlanMode } from "../modes/PlanMode";
import { AIMode } from "../modes/AIMode";
import { FloatingPlaceSearch } from "../map/FloatingPlaceSearch";

interface DesktopLayoutProps {
  mapId?: string;
  tripId?: string;
  conversationId?: string;
}

export function DesktopLayout({ mapId, tripId, conversationId }: DesktopLayoutProps) {
  const { activeMode, sidebarCollapsed, saveStatus, dispatch, setActiveMode, toggleSidebar } = useMapState();
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const handleModeChange = (mode: typeof activeMode) => {
    setActiveMode(mode);
  };

  const handleToggleCollapse = () => {
    toggleSidebar();
  };

  const handleRetrySync = () => {
    // Retry save logic will be implemented later
    console.log("Retry sync");
  };

  // Render appropriate mode content based on activeMode
  const renderModeContent = () => {
    switch (activeMode) {
      case "discover":
        return <DiscoverMode />;
      case "plan":
        return <PlanMode />;
      case "ai":
        return <AIMode />;
      default:
        return <DiscoverMode />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <DesktopHeader conversationId={conversationId} saveStatus={saveStatus} onRetrySync={handleRetrySync} />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Dynamic Sidebar */}
        <DynamicSidebar
          activeMode={activeMode}
          isCollapsed={sidebarCollapsed}
          onModeChange={handleModeChange}
          onToggleCollapse={handleToggleCollapse}
        >
          {renderModeContent()}
        </DynamicSidebar>

        {/* Map Canvas */}
        <div className="flex-1 relative">
          <MapCanvas mapId={mapId} onMapLoad={setMapInstance} />
          <FloatingPlaceSearch mapInstance={mapInstance} />
        </div>
      </div>
    </div>
  );
}
