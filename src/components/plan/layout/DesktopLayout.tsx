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
import { useTripSync } from "../hooks/useTripSync";
import { useUnsavedChangesWarning } from "../hooks/useUnsavedChangesWarning";
import { useStateRecovery } from "../hooks/useStateRecovery";
import { useScreenReaderAnnouncement } from "../hooks/useScreenReaderAnnouncement";
import type { LayoutProps, ItineraryPlace } from "../types";
import type { PlaceSuggestion } from "@/domain/plan/models/ChatMessage";
import type { ConversationId } from "@/domain/plan/models/ConversationHistory";
import { ConversationId as ConversationIdBrand } from "@/domain/plan/models/ConversationHistory";
import type { PersonaType } from "@/domain/plan/models";
import { PersonaType as PersonaTypeBrand } from "@/domain/plan/models";
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
export function DesktopLayout({ conversationId, user }: LayoutProps) {
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingConversationId, setPendingConversationId] = useState<ConversationId | null>(null);

  // Track conversation creation to prevent auto-save race
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  // Track last title update to prevent infinite loops
  const lastTitleUpdate = React.useRef<{ id: ConversationId; title: string } | null>(null);

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
    updateTitle,
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
      // Safety check: ensure there's at least one user message
      const hasUserMessage = messages.some((msg) => msg.role === "user");
      if (!hasUserMessage) {
        // Cannot create conversation without user messages - return null
        return null;
      }

      // Generate title based on itinerary or default
      let title = "Trip to ...";
      if (places.length > 0) {
        title = `Trip to ${places[0].name}`;
      }

      // Check if activeConversationId is a virtual conversation (trip)
      // by checking if it exists in conversations list and has messageCount === 0 and tripId === id
      const currentConv = conversations.find((c) => c.id === activeConversationId);
      const isVirtualConversation =
        currentConv &&
        currentConv.messageCount === 0 &&
        currentConv.tripId &&
        String(currentConv.tripId) === String(currentConv.id);

      // If it's a virtual conversation, pass the tripId to link the conversation to the trip
      const tripIdToLink = isVirtualConversation ? (activeConversationId as string) : undefined;

      const newId = await createNew(messages, personas, title, tripIdToLink);
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

  // Update conversation title when itinerary has places
  useEffect(() => {
    if (!activeConversationId || places.length === 0) return;

    const currentConv = conversations.find((c) => c.id === activeConversationId);
    if (!currentConv) return;

    const newTitle = `Trip to ${places[0].name}`;

    // Only update if title is different and matches our pattern (starts with "Trip to")
    // or if it was "Trip to ..."
    if (
      currentConv.title !== newTitle &&
      (currentConv.title === "Trip to ..." || currentConv.title.startsWith("Trip to "))
    ) {
      // Prevent infinite loops by checking if we just tried to update to this title
      if (lastTitleUpdate.current?.id === activeConversationId && lastTitleUpdate.current?.title === newTitle) {
        return;
      }

      lastTitleUpdate.current = { id: activeConversationId, title: newTitle };
      updateTitle(activeConversationId, newTitle);
    }
  }, [activeConversationId, places, conversations, updateTitle]);

  // Handle empty trip case - revert title to "Trip to ..." but only for auto-generated titles
  useEffect(() => {
    if (!activeConversationId) return;

    const currentConv = conversations.find((c) => c.id === activeConversationId);
    if (!currentConv) return;

    // Only update if:
    // 1. Places array is empty
    // 2. Current title starts with "Trip to " (auto-generated, not custom)
    // 3. Current title is not already "Trip to ..."
    if (places.length === 0 && currentConv.title.startsWith("Trip to ") && currentConv.title !== "Trip to ...") {
      const newTitle = "Trip to ...";

      // Prevent infinite loops
      if (lastTitleUpdate.current?.id === activeConversationId && lastTitleUpdate.current?.title === newTitle) {
        return;
      }

      lastTitleUpdate.current = { id: activeConversationId, title: newTitle };
      updateTitle(activeConversationId, newTitle);
    }
  }, [activeConversationId, places, conversations, updateTitle]);

  // Trip sync for itinerary changes
  const { syncStatus: tripSyncStatus, syncTrip } = useTripSync({
    conversationId: activeConversationId,
    enabled: !!activeConversationId,
  });

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
          if (conversation) {
            setMessages(conversation.messages);
            setPersonas(conversation.personas.map((p) => PersonaTypeBrand(p)) as PersonaType[]);
          }

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

  // Announce trip sync status changes
  useEffect(() => {
    if (tripSyncStatus === "saved") {
      announce("Your trip has been saved");
    } else if (tripSyncStatus === "error") {
      announce("Failed to save your trip. Please try again.");
    }
  }, [tripSyncStatus, announce]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content, selectedPersonas);
  };

  const handleAddPlace = async (place: PlaceSuggestion) => {
    addPlace(place);
    announce(`${place.name} added to your itinerary`);

    // Immediate trip sync
    const newPlace = {
      id: place.id || place.name,
      name: place.name,
      description: place.description,
      coordinates: {
        lat: place.lat || 0,
        lng: place.lng || 0,
      },
      photos: place.photos,
    };
    await syncTrip([...places, newPlace]);
  };

  const handleRemovePlace = async (placeId: string) => {
    const place = places.find((p) => p.id === placeId);
    removePlace(placeId);
    if (place) {
      announce(`${place.name} removed from your itinerary`);
    }

    // Immediate trip sync
    const updatedPlaces = places.filter((p) => p.id !== placeId);
    await syncTrip(updatedPlaces);
  };

  const handleReorderPlaces = async (newPlaces: ItineraryPlace[]) => {
    reorderPlaces(newPlaces);

    // Immediate trip sync
    await syncTrip(newPlaces);
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
      // Add mode=discover to open discover panel
      if (activeConversationId) {
        window.location.href = `/map?tripId=${tripId}&conversationId=${activeConversationId}&mode=discover`;
      } else {
        window.location.href = `/map?tripId=${tripId}&mode=discover`;
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
    window.history.pushState({}, "", "/plan");
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

      if (conversation) {
        // Restore state
        setMessages(conversation.messages);
        setPersonas(conversation.personas.map((p) => PersonaTypeBrand(p)) as PersonaType[]);
      }

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
      window.history.pushState({}, "", `/plan?conversationId=${id}`);
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
        window.history.pushState({}, "", "/plan");
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
    window.location.href = `/map?conversationId=${id}`;
  };

  // Determine if we should show the header persona selector
  // Only show when we have messages (chat started)
  const showHeaderPersonas = messages.length > 0;

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header with save status */}
      <PlanHeader
        saveStatus={tripSyncStatus}
        conversationId={activeConversationId ? String(activeConversationId) : undefined}
        user={user}
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
              error={chatError ?? undefined}
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
            onReorder={handleReorderPlaces}
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
