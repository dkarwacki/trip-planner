/**
 * Mobile Layout
 * Main container with bottom navigation, header, and view switching
 */

import React, { useState, useEffect } from "react";
import { MobileBottomNav, type MobileTab } from "./MobileBottomNav";
import { MobileHeader } from "./MobileHeader";
import { MapView } from "./MapView";
import { PlanView } from "./PlanView";
import { SearchOverlay } from "./SearchOverlay";
import { useMapState } from "../context";

interface MobileLayoutProps {
  mapId?: string;
  tripId?: string;
  conversationId?: string;
}

const TAB_STORAGE_KEY = "map-v2-mobile-active-tab";

export function MobileLayout({ mapId, tripId, conversationId }: MobileLayoutProps) {
  const { planItems } = useMapState();
  const [activeTab, setActiveTab] = useState<MobileTab>("map");
  const [showSearch, setShowSearch] = useState(false);

  // Load active tab from sessionStorage or URL on mount
  useEffect(() => {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam === "plan" || tabParam === "map") {
      setActiveTab(tabParam);
      return;
    }

    // Otherwise load from sessionStorage
    const savedTab = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (savedTab === "plan" || savedTab === "map") {
      setActiveTab(savedTab);
    }
  }, []);

  // Persist active tab to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
  };

  const handleBackClick = () => {
    if (conversationId) {
      // Navigate back to planning page
      window.location.href = `/plan-v2/${conversationId}`;
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <MobileHeader
        onSearchClick={() => setShowSearch(true)}
        showBackButton={!!conversationId}
        onBackClick={handleBackClick}
      />

      {/* Main Content Area */}
      <main
        className="absolute left-0 right-0 top-12"
        style={{
          height: "calc(100vh - 48px - 60px - env(safe-area-inset-bottom))",
        }}
      >
        {/* View Switcher with Fade Transition */}
        <div className="relative h-full w-full">
          {activeTab === "map" && (
            <div className="absolute inset-0 animate-in fade-in duration-150">
              <MapView mapId={mapId} />
            </div>
          )}
          {activeTab === "plan" && (
            <div className="absolute inset-0 animate-in fade-in duration-150">
              <PlanView />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} planItemCount={planItems.length} />

      {/* Search Overlay */}
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
}
