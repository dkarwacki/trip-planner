/**
 * Desktop layout component
 * Main layout structure with header, sidebar, and map
 */

import React, { useState, useCallback } from "react";
import { useMapStore } from "../stores/mapStore";
import { DesktopHeader } from "./DesktopHeader";
import { DynamicSidebar } from "./DynamicSidebar";
import { MapCanvas } from "../map/MapCanvas";
import { FloatingPlaceSearch } from "../map/FloatingPlaceSearch";
import { DiscoverMode } from "../modes/DiscoverMode";
import { PlanMode } from "../modes/PlanMode";
import { AIMode } from "../modes/AIMode";

interface DesktopLayoutProps {
  mapId?: string;
  tripId?: string;
}

export function DesktopLayout({ mapId }: DesktopLayoutProps) {
  // Selectors
  const activeMode = useMapStore((state) => state.activeMode);
  const sidebarCollapsed = useMapStore((state) => state.sidebarCollapsed);
  const saveStatus = useMapStore((state) => state.saveStatus);

  // Actions
  const setActiveMode = useMapStore((state) => state.setActiveMode);
  const toggleSidebar = useMapStore((state) => state.toggleSidebar);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const handleModeChange = (mode: typeof activeMode) => {
    setActiveMode(mode);
  };

  const handleToggleCollapse = () => {
    toggleSidebar();
  };

  const handleRetrySync = () => {
    // Retry save logic will be implemented later
  };

  // Render appropriate mode content based on activeMode
  // Memoized to prevent recreation on every render
  const renderModeContent = useCallback(() => {
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
  }, [activeMode]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <DesktopHeader saveStatus={saveStatus} onRetrySync={handleRetrySync} />

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
