import { useEffect, useState } from "react";
import type { PersonaType, SavedTrip, ChatMessage, ConversationId, SavedConversation } from "@/domain/plan/models";
import type { Place } from "@/domain/common/models";
import { PERSONA_TYPES } from "@/domain/plan/models";
import PersonaSelector from "./PersonaSelector";
import PersonaSelectorDrawer from "./PersonaSelectorDrawer";
import ChatInterface from "./ChatInterface";
import ItineraryPanel from "./ItineraryPanel";
import ConversationHistoryPanel from "./ConversationHistoryPanel";
import { NewConversationDialog } from "./NewConversationDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { MobileNavigation, type PlanTab } from "@/components/common/MobileNavigation";
import { Bot, MapPin, History } from "lucide-react";
import {
  savePersonas,
  loadPersonas,
  saveCurrentItinerary,
  loadCurrentItinerary,
  clearCurrentItinerary,
  saveTripToHistory,
  loadTripHistory,
  deleteTripFromHistory,
  saveConversation,
  loadConversation,
  loadAllConversations,
  deleteConversation,
} from "@/lib/common/storage";

export default function ChatPage() {
  const [personas, setPersonas] = useState<PersonaType[]>([PERSONA_TYPES.GENERAL_TOURIST]);
  const [itinerary, setItinerary] = useState<Place[]>([]);
  const [tripHistory, setTripHistory] = useState<SavedTrip[]>([]);
  const [conversationHistory, setConversationHistory] = useState<SavedConversation[]>([]);

  // Conversation state
  const [currentConversationId, setCurrentConversationId] = useState<ConversationId | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>([]);
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<PlanTab>("assistant");

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load initial state from localStorage
  useEffect(() => {
    const loadedPersonas = loadPersonas();
    if (loadedPersonas.length > 0) {
      setPersonas(loadedPersonas);
    }

    const loadedItinerary = loadCurrentItinerary();
    setItinerary(loadedItinerary);

    const loadedHistory = loadTripHistory();
    setTripHistory(loadedHistory);

    const loadedConversations = loadAllConversations();
    setConversationHistory(loadedConversations);

    // Load conversation from URL params
    const params = new URLSearchParams(window.location.search);
    const conversationId = params.get("conversationId");
    if (conversationId) {
      const conversation = loadConversation(conversationId as ConversationId);
      if (conversation) {
        setCurrentConversationId(conversation.id);
        setConversationMessages(conversation.messages);
        setPersonas(conversation.personas);
      }
    }
  }, []);

  // Save personas when changed
  const handlePersonasChange = (newPersonas: PersonaType[]) => {
    setPersonas(newPersonas);
    savePersonas(newPersonas);
  };

  // Save itinerary when changed
  useEffect(() => {
    saveCurrentItinerary(itinerary);
  }, [itinerary]);

  // Conversation handlers
  const handleMessagesChange = (messages: ChatMessage[]) => {
    setConversationMessages(messages);
    // Auto-save conversation if it exists
    if (currentConversationId && messages.length > 0) {
      saveConversation(messages, personas, undefined, currentConversationId);
    }
  };

  const handleNewConversation = () => {
    // If there are messages, show confirmation dialog
    if (conversationMessages.length > 0) {
      setShowNewConversationDialog(true);
    } else {
      // No messages, just start fresh
      startNewConversation();
    }
  };

  const handleSaveAndStartNew = () => {
    if (conversationMessages.length > 0) {
      saveConversation(conversationMessages, personas);
    }
    startNewConversation();
  };

  const handleDiscardAndStartNew = () => {
    startNewConversation();
  };

  const startNewConversation = () => {
    setConversationMessages([]);
    setCurrentConversationId(null);
    // Clear URL params
    window.history.replaceState({}, "", "/plan");
  };

  const handleLoadConversation = (conversationId: ConversationId) => {
    const conversation = loadConversation(conversationId);
    if (conversation) {
      setCurrentConversationId(conversation.id);
      setConversationMessages(conversation.messages);
      setPersonas(conversation.personas);
      // Update URL with conversation ID
      window.history.pushState({}, "", `/plan?conversationId=${conversationId}`);
      // Switch to assistant tab on mobile
      if (isMobile) {
        setMobileTab("assistant");
      }
    }
  };

  const handleDeleteConversation = (conversationId: ConversationId) => {
    deleteConversation(conversationId);
    setConversationHistory(loadAllConversations());
    // If we're deleting the current conversation, start a new one
    if (currentConversationId === conversationId) {
      startNewConversation();
    }
  };

  const handleAddPlace = (place: Place) => {
    // Check if place already exists by ID or name
    const exists = itinerary.some((p) => p.id === place.id || p.name.toLowerCase() === place.name.toLowerCase());
    if (!exists) {
      setItinerary((prev) => [...prev, place]);
    }
  };

  const handleRemovePlace = (placeId: string) => {
    setItinerary((prev) => prev.filter((p) => p.id !== placeId));
  };

  const handleReorderPlaces = (newOrder: Place[]) => {
    setItinerary(newOrder);
  };

  const handleExportToMap = () => {
    if (itinerary.length === 0) return;

    // Save or create conversation if we have messages
    let conversationId = currentConversationId;
    if (conversationMessages.length > 0 && !currentConversationId) {
      conversationId = saveConversation(conversationMessages, personas);
      setCurrentConversationId(conversationId);
    } else if (conversationMessages.length > 0 && currentConversationId) {
      saveConversation(conversationMessages, personas, undefined, currentConversationId);
    }

    // Save to history and get trip ID, linking with conversation
    const tripId = saveTripToHistory(itinerary, conversationId ?? undefined);

    // Clear current itinerary
    clearCurrentItinerary();
    setItinerary([]);

    // Reload history to reflect new trip
    setTripHistory(loadTripHistory());

    // Navigate to map with trip ID
    window.location.href = `/map?tripId=${tripId}`;
  };

  const handleOpenTrip = (tripId: string) => {
    window.location.href = `/map?tripId=${tripId}`;
  };

  const handleDeleteTrip = (tripId: string) => {
    if (confirm("Are you sure you want to delete this trip?")) {
      deleteTripFromHistory(tripId);
      setTripHistory(loadTripHistory());
    }
  };

  const handleMobileTabChange = (tab: PlanTab) => {
    setMobileTab(tab as PlanTab);
  };

  // Mobile tab configurations
  const mobileTabs = [
    {
      id: "assistant" as PlanTab,
      label: "Assistant",
      icon: Bot,
      disabled: false,
    },
    {
      id: "itinerary" as PlanTab,
      label: "Itinerary",
      icon: MapPin,
      badge: itinerary.length > 0 ? itinerary.length : undefined,
      disabled: false,
    },
    {
      id: "history" as PlanTab,
      label: "History",
      icon: History,
      badge: conversationHistory.length > 0 ? conversationHistory.length : undefined,
      disabled: false,
    },
  ];

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Desktop Persona Selector */}
      {!isMobile && (
        <div className="bg-white border-b shadow-sm p-4 flex-shrink-0">
          <div className="container mx-auto max-w-7xl">
            <PersonaSelector selected={personas} onChange={handlePersonasChange} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex">
        <div className="container mx-auto max-w-7xl flex-1 flex sm:p-4 sm:gap-6">
          {/* Desktop Layout */}
          {!isMobile && (
            <>
              {/* Chat Interface - 2/3 width */}
              <div className="flex-[2] min-w-0 flex flex-col">
                <ChatInterface
                  personas={personas}
                  itinerary={itinerary}
                  onAddPlace={handleAddPlace}
                  onRemovePlace={handleRemovePlace}
                  initialMessages={conversationMessages}
                  onMessagesChange={handleMessagesChange}
                  onNewConversation={handleNewConversation}
                  currentConversationId={currentConversationId}
                />
              </div>

              {/* Right Panel - 1/3 width */}
              <div className="flex-1 min-w-0 flex flex-col">
                <Tabs defaultValue="itinerary" className="flex flex-col h-full min-h-0">
                  <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                    <TabsTrigger value="itinerary">Itinerary ({itinerary.length})</TabsTrigger>
                    <TabsTrigger value="history">History ({conversationHistory.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="itinerary" className="flex-1 min-h-0 mt-0">
                    <ItineraryPanel
                      places={itinerary}
                      onReorder={handleReorderPlaces}
                      onRemove={handleRemovePlace}
                      onExport={handleExportToMap}
                    />
                  </TabsContent>
                  <TabsContent value="history" className="flex-1 min-h-0 mt-0">
                    <ConversationHistoryPanel
                      conversations={conversationHistory}
                      onContinueConversation={handleLoadConversation}
                      onDeleteConversation={handleDeleteConversation}
                      onOpenTrip={handleOpenTrip}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}

          {/* Mobile Layout - Show only active tab */}
          {isMobile && (
            <div className="flex-1 flex flex-col min-h-0">
              {mobileTab === "assistant" && (
                <ChatInterface
                  personas={personas}
                  itinerary={itinerary}
                  onAddPlace={handleAddPlace}
                  onRemovePlace={handleRemovePlace}
                  initialMessages={conversationMessages}
                  onMessagesChange={handleMessagesChange}
                  onNewConversation={handleNewConversation}
                  currentConversationId={currentConversationId}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Itinerary Drawer */}
      <Drawer open={isMobile && mobileTab === "itinerary"} onOpenChange={(open) => !open && setMobileTab("assistant")}>
        <DrawerContent className="h-[85vh] flex flex-col pb-20">
          <DrawerHeader className="pb-3 flex-shrink-0">
            <DrawerTitle>Itinerary ({itinerary.length} places)</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 min-h-0 overflow-hidden px-4">
            <ItineraryPanel
              places={itinerary}
              onReorder={handleReorderPlaces}
              onRemove={handleRemovePlace}
              onExport={handleExportToMap}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Mobile History Drawer */}
      <Drawer open={isMobile && mobileTab === "history"} onOpenChange={(open) => !open && setMobileTab("assistant")}>
        <DrawerContent className="h-[85vh] flex flex-col pb-20">
          <DrawerHeader className="pb-3 flex-shrink-0">
            <DrawerTitle>History ({conversationHistory.length} conversations)</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 min-h-0 overflow-hidden px-4">
            <ConversationHistoryPanel
              conversations={conversationHistory}
              onContinueConversation={handleLoadConversation}
              onDeleteConversation={handleDeleteConversation}
              onOpenTrip={handleOpenTrip}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Mobile Navigation */}
      {isMobile && <MobileNavigation activeTab={mobileTab} onTabChange={handleMobileTabChange} tabs={mobileTabs} />}

      {/* Mobile Persona Selector Button */}
      {isMobile && <PersonaSelectorDrawer selected={personas} onChange={handlePersonasChange} />}

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={showNewConversationDialog}
        onOpenChange={setShowNewConversationDialog}
        onSaveAndStartNew={handleSaveAndStartNew}
        onDiscardAndStartNew={handleDiscardAndStartNew}
      />
    </div>
  );
}
