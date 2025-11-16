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
import { useMapState } from "../context";
import { useAIChat } from "../hooks/useAIChat";

interface MobileLayoutProps {
  mapId?: string;
  tripId?: string;
  conversationId?: string;
}

const TAB_STORAGE_KEY = "map-v2-mobile-active-tab";

export function MobileLayout({ mapId, tripId, conversationId }: MobileLayoutProps) {
  const { planItems, aiChatModalOpen, setAIChatModalOpen, state, dispatch } = useMapState();
  const [activeTab, setActiveTab] = useState<MobileTab>("map");
  const [showSearch, setShowSearch] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // AI chat functionality
  const { sendMessage, isLoading, addSuggestionToPlan, addingPlaceIds, addedPlaceIds } = useAIChat();

  // Get selected place for AI context
  const selectedPlace = state.selectedPlaceId ? state.places.find((p) => p.id === state.selectedPlaceId) : null;

  // Suggested prompts based on context - only show when there are no messages
  const hasMessages = state.aiConversation.length > 0;
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
    dispatch({ type: "ADD_PLACE", payload: newPlace });
    dispatch({ type: "SELECT_PLACE", payload: newPlace.id });

    // Switch to map tab if not already there
    if (activeTab !== "map") {
      setActiveTab("map");
    }

    // Pan map to new location
    if (mapInstance) {
      mapInstance.panTo({ lat, lng });
      mapInstance.setZoom(13);
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
    if (state.activeMobileTab && state.activeMobileTab !== activeTab) {
      setActiveTab(state.activeMobileTab);
    }
  }, [state.activeMobileTab, activeTab]);

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
    dispatch({ type: "SET_MOBILE_TAB", payload: tab });
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
    if (selectedPlace && state.aiContext !== selectedPlace.id) {
      dispatch({ type: "SET_AI_CONTEXT", payload: selectedPlace.id });
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
    dispatch({ type: "SET_MOBILE_TAB", payload: "map" });

    // Set the expanded card after a brief delay to ensure MapCanvas is mounted
    // This allows MapCanvas's useEffect to properly center the map
    // (reuses desktop logic from MapCanvas.tsx lines 260-296)
    setTimeout(() => {
      dispatch({ type: "SET_EXPANDED_CARD", payload: attractionId });
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
        isLoading={state.isLoadingAI}
        hidden={aiChatModalOpen || state.bottomSheetOpen}
      />

      {/* AI Chat Modal */}
      <AIChatModal
        isOpen={aiChatModalOpen}
        onClose={handleCloseAIChat}
        messages={state.aiConversation}
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
