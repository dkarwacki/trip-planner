import React, { useState, useEffect } from "react";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileHeader } from "./MobileHeader";
import { MapView } from "./MapView";
import { DiscoverView } from "./DiscoverView";
import { PlanView } from "./PlanView";
import { SearchOverlay } from "./SearchOverlay";
import { FloatingAIButton } from "./FloatingAIButton";
import { AIChatModal } from "./AIChatModal";
import { useMapStore } from "../stores/mapStore";
import { useMobileAIChat } from "./hooks/useMobileAIChat";
import { useMobileNavigation } from "./hooks/useMobileNavigation";
import type { PlannedPlaceViewModel } from "@/lib/map-v2/types";

interface MobileLayoutProps {
  mapId?: string;
  tripId?: string;
}

export function MobileLayout({ mapId }: MobileLayoutProps) {
  // Selectors
  const selectedPlaceId = useMapStore((state) => state.selectedPlaceId);
  const places = useMapStore((state) => state.places);
  const bottomSheetOpen = useMapStore((state) => state.bottomSheetOpen);

  const planItems = places;
  const selectedPlace = selectedPlaceId ? places.find((p) => p.id === selectedPlaceId) : null;

  // Local state for AI chat modal
  const [aiChatModalOpen, setAiChatModalOpen] = useState(false);

  // Custom Hooks
  const {
    activeTab,
    showSearch,
    setMapInstance,
    setShowSearch,
    handleTabChange,
    handleBackClick,
    handlePlaceSelect,
    handleNavigateToMapWithAttraction,
  } = useMobileNavigation();

  const {
    conversation,
    isLoading,
    isLoadingAI,
    suggestedPrompts,
    addedPlaceIds,
    addingPlaceIds,
    handleOpenAIChat,
    handleCloseAIChat,
    handleSendMessage,
    handleAddSuggestion,
  } = useMobileAIChat(selectedPlace as PlannedPlaceViewModel | null);

  // Effect to re-center map when switching to map tab with selected place
  useEffect(() => {
    if (activeTab === "map" && selectedPlaceId) {
      // Trigger centerOnPlace to update centerRequestTimestamp
      const centerOnPlace = useMapStore.getState().centerOnPlace;
      centerOnPlace(selectedPlaceId);
    }
  }, [activeTab, selectedPlaceId]);

  const handleOpenChat = () => {
    handleOpenAIChat();
    setAiChatModalOpen(true);
  };

  const handleCloseChat = () => {
    handleCloseAIChat();
    setAiChatModalOpen(false);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <MobileHeader onSearchClick={() => setShowSearch(true)} showBackButton={false} onBackClick={handleBackClick} />

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

      {/* Floating AI Button - positioned next to Filter Button */}
      <FloatingAIButton
        onOpenChat={handleOpenChat}
        isLoading={isLoadingAI}
        hidden={aiChatModalOpen || bottomSheetOpen}
        className="fixed bottom-[92px] left-[76px] z-40"
      />

      {/* AI Chat Modal */}
      <AIChatModal
        isOpen={aiChatModalOpen}
        onClose={handleCloseChat}
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
