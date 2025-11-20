import React, { useState, useEffect } from "react";
import { PlanHeader } from "./PlanHeader";
import { PersonaSelector } from "../personas/PersonaSelector";
import { ChatInterface } from "../chat/ChatInterface";
import { ItineraryPanel } from "../itinerary/ItineraryPanel";
import { ConversationLibraryPanel } from "../library/ConversationLibraryPanel";
import { SaveConversationDialog } from "../library/SaveConversationDialog";
import { usePersonas } from "../hooks/usePersonas";
import { useChatMessages } from "../hooks/useChatMessages";
import { useItinerary } from "../hooks/useItinerary";
import { useConversation } from "../hooks/useConversation";
import { useAutoSave } from "../hooks/useAutoSave";
import { useUnsavedChangesWarning } from "../hooks/useUnsavedChangesWarning";
import { useStateRecovery } from "../hooks/useStateRecovery";
import { useScreenReaderAnnouncement } from "../hooks/useScreenReaderAnnouncement";
import type { LayoutProps } from "../types";
import type { PlaceSuggestion } from "@/domain/plan/models/ChatMessage";
import type { ConversationId } from "@/domain/plan/models/ConversationHistory";
import { ConversationId as ConversationIdBrand } from "@/domain/plan/models/ConversationHistory";
import { createTrip, updateTrip, getTripForConversation } from "@/infrastructure/plan/clients/trips";
import { clearCurrentItinerary } from "@/lib/common/storage";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";
import type { Place } from "@/domain/common/models";
import { AnimatePresence } from "framer-motion";

/**
 * DesktopLayout - 3-column desktop layout
 *
 * Structure:
 * - Left sidebar: Conversation Library (collapsible)
 * - Center: Chat interface with persona selector at top
 * - Right sidebar: Itinerary panel (collapsible)
 * - Top: PlanHeader
 */
export function DesktopLayout({ conversationId }: LayoutProps) {
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingConversationId, setPendingConversationId] = useState<ConversationId | null>(null);

  // Track conversation creation to prevent auto-save race
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  // Persona state
  const { selected: selectedPersonas, setPersonas, isLoading: personasLoading } = usePersonas();

  // Itinerary state
  const { places, addPlace, removePlace, reorderPlaces, clearItinerary, setPlaces } = useItinerary();

  // Conversation state
  const {
    conversations,
    activeConversationId,
    isLoading: conversationsLoading,
    loadConversation,
    createNew,
    saveMessages,
    deleteConversation,
    setActiveConversationId,
  } = useConversation();

  // Chat messages with auto-save integration
  const {
    messages,
    isLoading: chatLoading,
    sendMessage,
    retryLastMessage,
    setMessages,
    clearMessages,
    error: chatError,
  } = useChatMessages({
    conversationId: activeConversationId,
    onCreateConversation: async (messages, personas) => {
      const newId = await createNew(messages, personas);
      if (newId) {
        setActiveConversationId(newId);
      }
      return newId;
    },
    onSaveMessages: async (conversationId, messages) => {
      await saveMessages(conversationId, messages);
    },
    onCreationStateChange: (isCreating) => {
      setIsCreatingConversation(isCreating);
    },
  });

  // Auto-save for messages and personas
  const { saveStatus, scheduleSave } = useAutoSave(
    activeConversationId && messages.length > 0
      ? { conversationId: activeConversationId, messages, personas: selectedPersonas }
      : null,
    {
      saveFn: async (data) => {
        await saveMessages(data.conversationId, data.messages);
        // Persona changes are already saved via usePersonas hook
      },
      debounceMs: 2000,
      maxRetries: 3,
      enabled: !!activeConversationId,
    }
  );

  // Trigger auto-save when messages or personas change (but not during conversation creation)
  useEffect(() => {
    if (activeConversationId && messages.length > 0 && !isCreatingConversation) {
      scheduleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, selectedPersonas, activeConversationId, isCreatingConversation]); // Don't include scheduleSave - it causes infinite loop

  // Warn before leaving with unsaved changes
  useUnsavedChangesWarning({
    hasUnsavedChanges: messages.length > 0 && !activeConversationId,
    message: "You have unsaved messages. Are you sure you want to leave?",
  });

  // State recovery on page refresh
  useStateRecovery({
    storageKey: "plan-session-draft",
    state:
      messages.length > 0 && !activeConversationId ? { messages, personas: selectedPersonas, itinerary: places } : null,
    enabled: messages.length > 0 && !activeConversationId,
    onRecover: (state) => {
      if (state?.messages) setMessages(state.messages);
      if (state?.personas) setPersonas(state.personas);
      if (state?.itinerary) {
        state.itinerary.forEach((place) =>
          addPlace({
            ...place,
            reasoning: "", // Add required field for PlaceSuggestion
          })
        );
      }
    },
  });

  // Screen reader announcements
  const announce = useScreenReaderAnnouncement({ politeness: "polite" });

  // Load conversation from URL on mount (only once)
  useEffect(() => {
    if (conversationId && !activeConversationId) {
      // Load conversation directly without going through handleSelectConversation
      // to avoid circular dependencies
      (async () => {
        try {
          const brandedConversationId = ConversationIdBrand(conversationId);
          const conversation = await loadConversation(brandedConversationId);
          setMessages(conversation.messages);
          setPersonas(conversation.personas);

          // Load trip places into itinerary from database
          try {
            const trip = await getTripForConversation(brandedConversationId);
            if (trip && trip.places) {
              const itineraryPlaces = trip.places.map((place) => ({
                id: place.id,
                name: place.name,
                description: undefined,
                coordinates: {
                  lat: place.lat,
                  lng: place.lng,
                },
                photos: place.photos,
              }));
              setPlaces(itineraryPlaces);
            }
          } catch (error) {
            console.error("Failed to load trip for conversation:", error);
          }
        } catch (error) {
          console.error("Failed to load conversation from URL:", error);
        }
      })();
    }
  }, []); // Empty deps - only run once on mount

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlConversationId = urlParams.get("conversationId");

      if (urlConversationId && urlConversationId !== activeConversationId) {
        // Load conversation from URL
        handleSelectConversation(urlConversationId as ConversationId);
      } else if (!urlConversationId && activeConversationId) {
        // No conversation ID in URL - start fresh
        handleNewConversation();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeConversationId]); // Re-run when active conversation changes

  // Announce save status changes
  useEffect(() => {
    if (saveStatus === "saved") {
      announce("Your changes have been saved");
    } else if (saveStatus === "error") {
      announce("Failed to save your changes. Please try again.");
    }
  }, [saveStatus, announce]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content, selectedPersonas);
  };

  const handleAddPlace = (place: PlaceSuggestion) => {
    addPlace(place);
    announce(`${place.name} added to your itinerary`);
  };

  const handleRemovePlace = (placeId: string) => {
    const place = places.find((p) => p.id === placeId);
    removePlace(placeId);
    if (place) {
      announce(`${place.name} removed from your itinerary`);
    }
  };

  const handleExportToMap = async () => {
    if (places.length === 0) {
      console.warn("Cannot export to map: no places in itinerary");
      return;
    }

    try {
      // Convert ItineraryPlace[] to Place[] for createTrip/updateTrip
      const domainPlaces: Place[] = places.map((itineraryPlace) => ({
        id: PlaceId(itineraryPlace.id),
        name: itineraryPlace.name,
        lat: Latitude(itineraryPlace.coordinates.lat),
        lng: Longitude(itineraryPlace.coordinates.lng),
        plannedAttractions: [],
        plannedRestaurants: [],
        photos: itineraryPlace.photos,
      }));

      let tripId: string;

      // Check if trip already exists for this conversation
      if (activeConversationId) {
        const existingTrip = await getTripForConversation(activeConversationId);
        if (existingTrip) {
          // Update existing trip
          await updateTrip(existingTrip.id, domainPlaces);
          tripId = existingTrip.id;
        } else {
          // Create new trip with conversation link
          tripId = await createTrip(domainPlaces, activeConversationId);
        }
      } else {
        // Create new trip without conversation link
        tripId = await createTrip(domainPlaces, undefined);
      }

      // Clear current itinerary from localStorage
      clearCurrentItinerary();
      clearItinerary();

      // Navigate to map with trip ID (and conversation ID if available)
      if (activeConversationId) {
        window.location.href = `/map-v2?tripId=${tripId}&conversationId=${activeConversationId}`;
      } else {
        window.location.href = `/map-v2?tripId=${tripId}`;
      }
    } catch (error) {
      console.error("Failed to export to map:", error);
      // TODO: Show error toast to user
    }
  };

  // Conversation handlers
  const handleNewConversation = () => {
    // Check if current conversation has unsaved messages
    if (messages.length > 0 && !activeConversationId) {
      setShowSaveDialog(true);
      setPendingConversationId(null);
      return;
    }

    // Clear state and start fresh
    clearMessages();
    clearItinerary();
    setActiveConversationId(undefined);

    // Update URL to remove conversation ID
    window.history.pushState({}, "", "/plan-v2");
  };

  const handleSelectConversation = async (id: ConversationId) => {
    // Check if current conversation has unsaved messages
    if (messages.length > 0 && id !== activeConversationId && !activeConversationId) {
      setShowSaveDialog(true);
      setPendingConversationId(id);
      return;
    }

    // Load conversation
    try {
      const conversation = await loadConversation(id);

      // Restore state
      setMessages(conversation.messages);
      setPersonas(conversation.personas);

      // Load trip places into itinerary from database (like old plan view)
      try {
        const trip = await getTripForConversation(id);
        if (trip && trip.places) {
          const itineraryPlaces = trip.places.map((place) => ({
            id: place.id,
            name: place.name,
            description: undefined,
            coordinates: {
              lat: place.lat,
              lng: place.lng,
            },
            photos: place.photos,
          }));
          setPlaces(itineraryPlaces);
        } else {
          clearItinerary();
        }
      } catch (error) {
        console.error("Failed to load trip for conversation:", error);
        clearItinerary();
      }

      // Update URL with conversation ID
      window.history.pushState({}, "", `/plan-v2?conversationId=${id}`);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleDeleteConversation = async (id: ConversationId) => {
    try {
      await deleteConversation(id);

      // If deleted conversation was active, start fresh
      if (id === activeConversationId) {
        clearMessages();
        clearItinerary();
        setActiveConversationId(undefined);

        // Update URL to remove conversation ID
        window.history.pushState({}, "", "/plan-v2");
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleSaveAndContinue = async () => {
    setShowSaveDialog(false);

    // Save current conversation if it exists or create a new one
    try {
      if (messages.length > 0 && !activeConversationId) {
        // Create new conversation with current messages
        const newId = await createNew(messages, selectedPersonas);
        if (newId) {
          setActiveConversationId(newId);
        }
      }

      // Now proceed with the requested action
      if (pendingConversationId) {
        await handleSelectConversation(pendingConversationId);
      } else {
        handleNewConversation();
      }
    } catch (error) {
      console.error("Failed to save conversation:", error);
      // Still proceed with action even if save failed
      if (pendingConversationId) {
        await handleSelectConversation(pendingConversationId);
      } else {
        handleNewConversation();
      }
    }
  };

  const handleDiscard = () => {
    setShowSaveDialog(false);

    if (pendingConversationId) {
      handleSelectConversation(pendingConversationId);
    } else {
      clearMessages();
      clearItinerary();
      setActiveConversationId(undefined);
    }
  };

  const handleOpenMap = (id: ConversationId) => {
    window.location.href = `/map-v2?conversationId=${id}`;
  };

  // Determine if we should show the header persona selector
  // Only show when we have messages (chat started)
  const showHeaderPersonas = messages.length > 0;

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header with save status */}
      <PlanHeader
        saveStatus={saveStatus}
        conversationId={activeConversationId ? String(activeConversationId) : undefined}
      />

      {/* Main content area - 3 columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Conversation Library */}
        <div
          className={`bg-white border-r shadow-sm transition-all duration-300 flex-shrink-0 ${
            isLeftCollapsed ? "w-16" : "w-[24rem] lg:w-[28rem]"
          }`}
        >
          <ConversationLibraryPanel
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={handleSelectConversation}
            onDelete={handleDeleteConversation}
            onNewConversation={handleNewConversation}
            onOpenMap={handleOpenMap}
            isLoading={conversationsLoading}
            isCollapsed={isLeftCollapsed}
            onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
          />
        </div>

        {/* Center - Chat Interface */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Persona Selector Area - conditionally rendered at top */}
          <AnimatePresence>
            {showHeaderPersonas && (
              <div className="flex-shrink-0 border-b p-4 bg-background">
                <PersonaSelector
                  selected={selectedPersonas}
                  onChange={setPersonas}
                  isLoading={personasLoading}
                  readOnly={true}
                  showOnlySelected={true}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Chat Interface - fills remaining space */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              messages={messages}
              isLoading={chatLoading}
              onSendMessage={handleSendMessage}
              onAddPlace={handleAddPlace}
              selectedPersonas={selectedPersonas}
              onPersonaChange={setPersonas}
              error={chatError}
              onRetry={retryLastMessage}
              addedPlaceIds={new Set(places.map((p) => p.id))}
            />
          </div>
        </div>

        {/* Right Sidebar - Itinerary Panel */}
        <div
          className={`bg-white border-l shadow-sm transition-all duration-300 flex-shrink-0 ${
            isRightCollapsed ? "w-16" : "w-[24rem] lg:w-[28rem]"
          }`}
        >
          <ItineraryPanel
            places={places}
            onReorder={reorderPlaces}
            onRemove={handleRemovePlace}
            onExportToMap={handleExportToMap}
            isCollapsed={isRightCollapsed}
            onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
          />
        </div>
      </div>

      {/* Dialogs */}
      <SaveConversationDialog
        isOpen={showSaveDialog}
        onSave={handleSaveAndContinue}
        onDiscard={handleDiscard}
        onCancel={() => setShowSaveDialog(false)}
      />
    </div>
  );
}
