/**
 * Mobile Layout
 * Main container with bottom navigation, header, and view switching
 */

import React, { useState, useEffect, useRef } from "react";
import { MobileBottomNav, type MobileTab } from "./MobileBottomNav";
import { MobileHeader } from "./MobileHeader";
import { MapView } from "./MapView";
import { DiscoverView } from "./DiscoverView";
import { PlanView } from "./PlanView";
import { SearchOverlay } from "./SearchOverlay";
import { FloatingAIButton } from "./FloatingAIButton";
import { AIChatModal } from "./AIChatModal";
import { useMapStore } from "../stores/mapStore";
import { useAIChat } from "../hooks/useAIChat";

interface MobileLayoutProps {
  mapId?: string;
  tripId?: string;
  conversationId?: string;
}

const TAB_STORAGE_KEY = "map-v2-mobile-active-tab";

export function MobileLayout({ mapId, tripId, conversationId }: MobileLayoutProps) {
  // Selectors
  const selectedPlaceId = useMapStore((state) => state.selectedPlaceId);
  const places = useMapStore((state) => state.places);
  const conversation = useMapStore((state) => state.conversation);
  const context = useMapStore((state) => state.context);
  const activeMobileTab = useMapStore((state) => state.activeMobileTab);
  const bottomSheetOpen = useMapStore((state) => state.bottomSheetOpen);
  const isLoadingAI = useMapStore((state) => state.isLoading);

  // Actions
  const addPlace = useMapStore((state) => state.addPlace);
  const setMobileTab = useMapStore((state) => state.setMobileTab);
  const setAIContext = useMapStore((state) => state.setAIContext);
  const setAIChatModalOpen = useMapStore((state) => state.setAIChatModalOpen);
  const aiChatModalOpen = useMapStore((state) => state.aiChatModalOpen);

  const planItems = places;
  const [activeTab, setActiveTab] = useState<MobileTab>("map");
  const [showSearch, setShowSearch] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // AI chat functionality
  const { sendMessage, isLoading, addSuggestionToPlan, addingPlaceIds, addedPlaceIds } = useAIChat();

  // Get selected place for AI context
  const selectedPlace = selectedPlaceId ? places.find((p) => p.id === selectedPlaceId) : null;

  // Suggested prompts based on context - only show when there are no messages
  const hasMessages = conversation.length > 0;
  const suggestedPrompts =
    selectedPlace && !hasMessages
      ? ["Must-see highlights", "Best local restaurants", "Hidden gems nearby", "Family-friendly activities"]
      : [];

  // Handle place selection from search
  const handlePlaceSelect = (placeDetails: {
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
    addPlace(newPlace);

    // Switch to map tab if not already there
    if (activeTab !== "map") {
      setActiveTab("map");
    }

    // Zoom in if needed
    if (mapInstance) {
      const currentZoom = mapInstance.getZoom() || 0;
      if (currentZoom < 13) {
        mapInstance.setZoom(13);
      }
    }
  };

  // Load active tab from sessionStorage or URL on mount
  useEffect(() => {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam === "plan" || tabParam === "map" || tabParam === "discover") {
      setActiveTab(tabParam);
      return;
    }

    // Otherwise load from sessionStorage
    const savedTab = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (savedTab === "plan" || savedTab === "map" || savedTab === "discover") {
      setActiveTab(savedTab);
    }
  }, []);

  // Persist active tab to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  // Sync with global state when activeMobileTab changes (e.g., from PlanView)
  useEffect(() => {
    if (activeMobileTab && activeMobileTab !== activeTab) {
      setActiveTab(activeMobileTab);
    }
  }, [activeMobileTab, activeTab]);

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
    setMobileTab(tab);
  };

  const handleBackClick = () => {
    if (conversationId) {
      // Navigate back to planning page
      window.location.href = `/plan-v2/${conversationId}`;
    }
  };

  // AI chat handlers
  const handleOpenAIChat = () => {
    // Set AI context if place is selected
    if (selectedPlace && context !== selectedPlace.id) {
      setAIContext(selectedPlace.id);
    }
    setAIChatModalOpen(true);
  };

  const handleCloseAIChat = () => {
    setAIChatModalOpen(false);
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedPlace) {
      console.warn("No place selected");
      return;
    }
    await sendMessage(message);
  };

  const handleAddSuggestion = (placeId: string) => {
    addSuggestionToPlan(placeId);
  };

  // Helper to navigate from Discover to Map with centered attraction
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNavigateToMapWithAttraction = (attractionId: string, _lat: number, _lng: number) => {
    // Switch to map tab first
    setActiveTab("map");
    setMobileTab("map");

    // Set the expanded card after a brief delay to ensure MapCanvas is mounted
    // This allows MapCanvas's useEffect to properly center the map
    // (reuses desktop logic from MapCanvas.tsx lines 260-296)
    setTimeout(() => {
      useMapStore.getState().setExpandedCard(attractionId);
    }, 100);
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
              <MapView mapId={mapId} onMapLoad={setMapInstance} />
            </div>
          )}
          {activeTab === "discover" && (
            <div className="absolute inset-0 animate-in fade-in duration-150">
              <DiscoverView
                mapId={mapId}
                onMapLoad={setMapInstance}
                onNavigateToMap={handleNavigateToMapWithAttraction}
              />
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
      <SearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} onPlaceSelect={handlePlaceSelect} />

      {/* Floating AI Button - hidden when modal is open or bottom sheet is expanded */}
      <FloatingAIButton
        onOpenChat={handleOpenAIChat}
        isLoading={isLoadingAI}
        hidden={aiChatModalOpen || bottomSheetOpen}
      />

      {/* AI Chat Modal */}
      <AIChatModal
        isOpen={aiChatModalOpen}
        onClose={handleCloseAIChat}
        messages={conversation}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onAddSuggestion={handleAddSuggestion}
        addedPlaceIds={addedPlaceIds}
        addingPlaceIds={addingPlaceIds}
        selectedPlace={selectedPlace}
        suggestedPrompts={suggestedPrompts}
      />
    </div>
  );
}
