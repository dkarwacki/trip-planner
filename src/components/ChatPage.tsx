import { useEffect, useState } from "react";
import type { PersonaType, Place, SavedTrip } from "@/domain/models";
import { PERSONA_TYPES } from "@/domain/models";
import PersonaSelector from "./PersonaSelector";
import ChatInterface from "./ChatInterface";
import ItineraryPanel from "./ItineraryPanel";
import TripHistoryPanel from "./TripHistoryPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  savePersonas,
  loadPersonas,
  saveCurrentItinerary,
  loadCurrentItinerary,
  clearCurrentItinerary,
  saveTripToHistory,
  loadTripHistory,
  deleteTripFromHistory,
} from "@/lib/storage";

export default function ChatPage() {
  const [personas, setPersonas] = useState<PersonaType[]>([PERSONA_TYPES.GENERAL_TOURIST]);
  const [itinerary, setItinerary] = useState<Place[]>([]);
  const [tripHistory, setTripHistory] = useState<SavedTrip[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);

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

    // Save to history and get trip ID
    const tripId = saveTripToHistory(itinerary);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={isFullScreen ? "h-screen flex flex-col" : "container mx-auto p-4 max-w-7xl"}>
        {/* Header */}
        {!isFullScreen && (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Trip Planner</h1>
              <p className="text-gray-600">Plan your perfect trip with AI-powered place recommendations</p>
            </div>

            {/* Persona Selector */}
            <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
              <PersonaSelector selected={personas} onChange={handlePersonasChange} />
            </div>
          </>
        )}

        {/* Main Content Grid */}
        <div
          className={isFullScreen ? "flex-1 flex flex-col min-h-0" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}
          style={!isFullScreen ? { height: "calc(100vh - 280px)" } : undefined}
        >
          {/* Left Column - Chat Interface */}
          <div className={isFullScreen ? "flex flex-col h-full min-h-0" : "lg:col-span-2 flex flex-col h-full min-h-0"}>
            <ChatInterface
              personas={personas}
              itinerary={itinerary}
              onAddPlace={handleAddPlace}
              onRemovePlace={handleRemovePlace}
              isFullScreen={isFullScreen}
              onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
            />
          </div>

          {/* Right Column - Tabbed Panel */}
          {!isFullScreen && (
            <div className="flex flex-col h-full min-h-0">
              <Tabs defaultValue="itinerary" className="flex flex-col h-full min-h-0">
                <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                  <TabsTrigger value="itinerary">My Itinerary ({itinerary.length})</TabsTrigger>
                  <TabsTrigger value="history">Trip History ({tripHistory.length})</TabsTrigger>
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
                  <TripHistoryPanel trips={tripHistory} onOpenTrip={handleOpenTrip} onDeleteTrip={handleDeleteTrip} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
