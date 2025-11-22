import React, { useState, useEffect } from "react";
import { MessageCircle, MapPin, MessagesSquare } from "lucide-react";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import { PersonaSelectorMobile } from "../personas/PersonaSelectorMobile";
import { ChatInterface } from "../chat/ChatInterface";
import { ItineraryDrawer } from "../itinerary/ItineraryDrawer";
import { ConversationLibraryDrawer } from "../library/ConversationLibraryDrawer";
import { SaveConversationDialog } from "../library/SaveConversationDialog";
import { DeleteConversationDialog } from "../library/DeleteConversationDialog";
import { usePersonas } from "../hooks/usePersonas";
import { useChatMessages } from "../hooks/useChatMessages";
import { useItinerary } from "../hooks/useItinerary";
import { useConversation } from "../hooks/useConversation";
import { useAutoSave } from "../hooks/useAutoSave";
import { useUnsavedChangesWarning } from "../hooks/useUnsavedChangesWarning";
import { useStateRecovery } from "../hooks/useStateRecovery";
import { useScreenReaderAnnouncement } from "../hooks/useScreenReaderAnnouncement";
import type { LayoutProps, MobileTab } from "../types";
import type { PlaceSuggestion } from "@/domain/plan/models/ChatMessage";
import type { ConversationId } from "@/domain/plan/models/ConversationHistory";
import { ConversationId as ConversationIdBrand } from "@/domain/plan/models/ConversationHistory";
import { createTrip, updateTrip, getTripForConversation } from "@/infrastructure/plan/clients/trips";
import { clearCurrentItinerary } from "@/lib/common/storage";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";
import type { Place } from "@/domain/common/models";

/**
 * MobileLayout - Mobile-optimized layout with bottom navigation
 *
 * Structure:
 * - Top: Header with save status
 * - Main: Active tab content (Chat / Plan / Sessions)
 * - Bottom: Navigation tabs
 * - Drawers: Slide up for Plan and Sessions
 */
export function MobileLayout({ conversationId }: LayoutProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>("chat");

  // Dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingConversationId, setPendingConversationId] = useState<ConversationId | null>(null);
  const [conversationToDelete, setConversationToDelete] = useState<{ id: ConversationId; title: string } | null>(null);

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

  // Update conversation title when itinerary changes
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
      debounceMs: 750,
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

  // Announce tab changes
  useEffect(() => {
    const tabNames: Record<MobileTab, string> = {
      chat: "Chat",
      plan: "Plan",
      sessions: "Chats",
    };
    announce(`Switched to ${tabNames[activeTab]} tab`);
  }, [activeTab, announce]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content, selectedPersonas);
  };

  const handleAddPlace = (place: PlaceSuggestion) => {
    addPlace(place);
    announce(`${place.name} added to your itinerary`);
    // Auto-switch to plan tab when place added
    setActiveTab("plan");
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
      // Add mode=discover to open discover panel
      if (activeConversationId) {
        window.location.href = `/map-v2?tripId=${tripId}&conversationId=${activeConversationId}&mode=discover`;
      } else {
        window.location.href = `/map-v2?tripId=${tripId}&mode=discover`;
      }
    } catch (error) {
      console.error("Failed to export to map:", error);
      // TODO: Show error toast to user
    }
  };

  // Conversation handlers (same as DesktopLayout)
  const handleNewConversation = () => {
    if (messages.length > 0 && !activeConversationId) {
      setShowSaveDialog(true);
      setPendingConversationId(null);
      return;
    }

    clearMessages();
    clearItinerary();
    setActiveConversationId(undefined);
    setActiveTab("chat");

    // Update URL to remove conversation ID
    window.history.pushState({}, "", "/plan-v2");
  };

  const handleSelectConversation = async (id: ConversationId) => {
    if (messages.length > 0 && id !== activeConversationId && !activeConversationId) {
      setShowSaveDialog(true);
      setPendingConversationId(id);
      return;
    }

    try {
      const conversation = await loadConversation(id);
      setMessages(conversation.messages);
      setPersonas(conversation.personas);
      setActiveTab("chat");

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

  const handleDeleteConversation = (id: ConversationId) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setConversationToDelete({ id, title: conv.title });
      setShowDeleteDialog(true);
    }
  };

  const confirmDelete = async () => {
    if (conversationToDelete) {
      try {
        await deleteConversation(conversationToDelete.id);
        setShowDeleteDialog(false);
        setConversationToDelete(null);

        if (conversationToDelete.id === activeConversationId) {
          clearMessages();
          clearItinerary();
          setActiveConversationId(undefined);

          // Update URL to remove conversation ID
          window.history.pushState({}, "", "/plan-v2");
        }
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    }
  };

  const handleSaveAndContinue = async () => {
    console.log("Save current conversation");
    setShowSaveDialog(false);

    if (pendingConversationId) {
      handleSelectConversation(pendingConversationId);
    } else {
      handleNewConversation();
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

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">Trip Planner</h1>
        <SaveStatusIndicator status={saveStatus} />
      </div>

      {/* Main content area - changes based on active tab */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" && (
          <div className="flex h-full flex-col overflow-hidden">
            {/* Compact Persona Selector - fixed at top */}
            <div className="flex-shrink-0 border-b px-4 py-2 bg-background">
              <PersonaSelectorMobile selected={selectedPersonas} onChange={setPersonas} isLoading={personasLoading} />
            </div>

            {/* Chat Interface - fills remaining space */}
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                messages={messages}
                isLoading={chatLoading}
                onSendMessage={handleSendMessage}
                onAddPlace={handleAddPlace}
                selectedPersonas={selectedPersonas}
                error={chatError ?? undefined}
                onRetry={retryLastMessage}
                addedPlaceIds={new Set(places.map((p) => p.id))}
              />
            </div>
          </div>
        )}

        {activeTab === "plan" && (
          <div className="h-full pb-safe">
            <ItineraryDrawer
              places={places}
              onReorder={reorderPlaces}
              onRemove={handleRemovePlace}
              onExportToMap={handleExportToMap}
            />
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="h-full pb-safe">
            <ConversationLibraryDrawer
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelect={handleSelectConversation}
              onDelete={handleDeleteConversation}
              onNewConversation={handleNewConversation}
              onOpenMap={handleOpenMap}
              isLoading={conversationsLoading}
            />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t bg-background pb-safe">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex flex-1 flex-col items-center gap-1 py-3 ${
              activeTab === "chat" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Chat tab"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs">Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("plan")}
            className={`flex flex-1 flex-col items-center gap-1 py-3 ${
              activeTab === "plan" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Plan tab"
          >
            <MapPin className="h-6 w-6" />
            <span className="text-xs">Plan</span>
          </button>

          <button
            onClick={() => setActiveTab("sessions")}
            className={`flex flex-1 flex-col items-center gap-1 py-3 ${
              activeTab === "sessions" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Chats tab"
          >
            <MessagesSquare className="h-6 w-6" />
            <span className="text-xs">Chats</span>
          </button>
        </div>
      </div>

      {/* Dialogs */}
      <SaveConversationDialog
        isOpen={showSaveDialog}
        onSave={handleSaveAndContinue}
        onDiscard={handleDiscard}
        onCancel={() => setShowSaveDialog(false)}
      />

      <DeleteConversationDialog
        isOpen={showDeleteDialog}
        conversationTitle={conversationToDelete?.title || ""}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setConversationToDelete(null);
        }}
      />
    </div>
  );
}
