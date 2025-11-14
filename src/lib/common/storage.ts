import type { PersonaType, SavedTrip, SavedConversation, ConversationId, ChatMessage } from "@/domain/plan/models";
import type { Place } from "@/domain/common/models";
import {
  createSavedTrip,
  updateTripPlaces,
  createSavedConversation,
  updateConversationMessages,
  TripId,
} from "@/domain/plan/models";

const STORAGE_KEYS = {
  CURRENT_ITINERARY: "trip-planner:current-itinerary",
  TRIP_HISTORY: "trip-planner:trip-history",
  CONVERSATIONS: "trip-planner:conversations",
} as const;

// Helper to safely parse JSON from localStorage
const safeJsonParse = <T>(json: string | null, fallback: T): T => {
  if (!json) return fallback;

  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error("Failed to parse JSON from localStorage:", error);
    return fallback;
  }
};

// Personas moved to PostgreSQL - see src/infrastructure/plan/clients/personas.ts
// API: GET/PUT /api/personas

// Current itinerary storage
export const saveCurrentItinerary = (places: Place[]): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ITINERARY, JSON.stringify(places));
  } catch (error) {
    console.error("Failed to save current itinerary:", error);
  }
};

export const loadCurrentItinerary = (): Place[] => {
  if (typeof window === "undefined") return [];

  try {
    const json = localStorage.getItem(STORAGE_KEYS.CURRENT_ITINERARY);
    return safeJsonParse(json, []);
  } catch (error) {
    console.error("Failed to load current itinerary:", error);
    return [];
  }
};

export const clearCurrentItinerary = (): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ITINERARY);
  } catch (error) {
    console.error("Failed to clear current itinerary:", error);
  }
};

// Trip history storage
export const saveTripToHistory = (places: Place[], conversationId?: ConversationId): string => {
  if (typeof window === "undefined") return "";

  try {
    const trip = createSavedTrip(places, conversationId);
    const history = loadTripHistory();

    // Add new trip to the beginning (most recent first)
    history.unshift(trip);

    localStorage.setItem(STORAGE_KEYS.TRIP_HISTORY, JSON.stringify(history));
    return trip.id;
  } catch (error) {
    console.error("Failed to save trip to history:", error);
    return "";
  }
};

export const loadTripHistory = (): SavedTrip[] => {
  if (typeof window === "undefined") return [];

  try {
    const json = localStorage.getItem(STORAGE_KEYS.TRIP_HISTORY);
    return safeJsonParse(json, []);
  } catch (error) {
    console.error("Failed to load trip history:", error);
    return [];
  }
};

export const loadTripById = (id: string): SavedTrip | null => {
  if (typeof window === "undefined") return null;

  try {
    const history = loadTripHistory();
    return history.find((trip) => trip.id === id) ?? null;
  } catch (error) {
    console.error("Failed to load trip by ID:", error);
    return null;
  }
};

export const updateTripInHistory = (tripId: string, places: Place[]): void => {
  if (typeof window === "undefined") return;

  try {
    const history = loadTripHistory();
    const tripIndex = history.findIndex((trip) => trip.id === tripId);

    if (tripIndex !== -1) {
      const updatedTrip = updateTripPlaces(history[tripIndex], places);
      history[tripIndex] = updatedTrip;
      localStorage.setItem(STORAGE_KEYS.TRIP_HISTORY, JSON.stringify(history));
    }
  } catch (error) {
    console.error("Failed to update trip in history:", error);
  }
};

export const deleteTripFromHistory = (tripId: string): void => {
  if (typeof window === "undefined") return;

  try {
    const history = loadTripHistory();
    const filteredHistory = history.filter((trip) => trip.id !== tripId);
    localStorage.setItem(STORAGE_KEYS.TRIP_HISTORY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error("Failed to delete trip from history:", error);
  }
};

// Conversation storage
export const saveConversation = (
  messages: ChatMessage[],
  personas: string[],
  title?: string,
  existingId?: ConversationId,
  places?: Place[]
): ConversationId => {
  if (typeof window === "undefined") throw new Error("Cannot save conversation on server");

  try {
    const conversations = loadAllConversations();

    if (existingId) {
      // Update existing conversation
      const existingIndex = conversations.findIndex((c) => c.id === existingId);
      if (existingIndex !== -1) {
        const updated = updateConversationMessages(conversations[existingIndex], messages);
        conversations[existingIndex] = updated;

        // Save/update trip if places provided
        if (places && places.length > 0) {
          const tripId = saveTripForConversation(existingId, places);
          conversations[existingIndex] = {
            ...conversations[existingIndex],
            tripId: TripId(tripId),
          };
        }

        localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
        return existingId;
      }
    }

    // Create new conversation
    const conversation = createSavedConversation(messages, personas, title);

    // Save trip if places provided
    if (places && places.length > 0) {
      const tripId = saveTripToHistory(places, conversation.id);
      conversation.tripId = TripId(tripId);
    }

    conversations.unshift(conversation); // Most recent first
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    return conversation.id;
  } catch (error) {
    console.error("Failed to save conversation:", error);
    throw error;
  }
};

export const loadConversation = (id: ConversationId): SavedConversation | null => {
  if (typeof window === "undefined") return null;

  try {
    const conversations = loadAllConversations();
    return conversations.find((conv) => conv.id === id) ?? null;
  } catch (error) {
    console.error("Failed to load conversation:", error);
    return null;
  }
};

export const loadAllConversations = (): SavedConversation[] => {
  if (typeof window === "undefined") return [];

  try {
    const json = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return safeJsonParse(json, []);
  } catch (error) {
    console.error("Failed to load conversations:", error);
    return [];
  }
};

export const deleteConversation = (conversationId: ConversationId): void => {
  if (typeof window === "undefined") return;

  try {
    const conversations = loadAllConversations();
    const filtered = conversations.filter((conv) => conv.id !== conversationId);
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete conversation:", error);
  }
};

export const getTripsForConversation = (conversationId: ConversationId): SavedTrip[] => {
  if (typeof window === "undefined") return [];

  try {
    const trips = loadTripHistory();
    return trips.filter((trip) => trip.conversationId === conversationId);
  } catch (error) {
    console.error("Failed to get trips for conversation:", error);
    return [];
  }
};

// Migration: Convert one-to-many to one-to-one relationship
export const migrateConversationTrips = (): void => {
  if (typeof window === "undefined") return;

  try {
    const conversations = loadAllConversations();
    const trips = loadTripHistory();
    let hasChanges = false;

    for (const conversation of conversations) {
      // Find all trips for this conversation
      const conversationTrips = trips.filter((trip) => trip.conversationId === conversation.id);

      if (conversationTrips.length > 1) {
        // Keep first trip (oldest), delete others
        const [firstTrip, ...tripsToDelete] = conversationTrips.sort((a, b) => a.timestamp - b.timestamp);

        // Update conversation to reference first trip
        const conversationIndex = conversations.findIndex((c) => c.id === conversation.id);
        if (conversationIndex !== -1) {
          conversations[conversationIndex] = {
            ...conversations[conversationIndex],
            tripId: firstTrip.id,
          };
          hasChanges = true;
        }

        // Delete other trips
        for (const tripToDelete of tripsToDelete) {
          const tripIndex = trips.findIndex((t) => t.id === tripToDelete.id);
          if (tripIndex !== -1) {
            trips.splice(tripIndex, 1);
            hasChanges = true;
          }
        }
      } else if (conversationTrips.length === 1) {
        // Link single trip to conversation if not already linked
        if (!conversation.tripId) {
          const conversationIndex = conversations.findIndex((c) => c.id === conversation.id);
          if (conversationIndex !== -1) {
            conversations[conversationIndex] = {
              ...conversations[conversationIndex],
              tripId: conversationTrips[0].id,
            };
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      localStorage.setItem(STORAGE_KEYS.TRIP_HISTORY, JSON.stringify(trips));
    }
  } catch (error) {
    console.error("Failed to migrate conversation trips:", error);
  }
};

// Get single trip for conversation (one-to-one relationship)
export const getTripForConversation = (conversationId: ConversationId): SavedTrip | null => {
  if (typeof window === "undefined") return null;

  try {
    const conversation = loadConversation(conversationId);
    if (!conversation || !conversation.tripId) {
      return null;
    }
    return loadTripById(conversation.tripId);
  } catch (error) {
    console.error("Failed to get trip for conversation:", error);
    return null;
  }
};

// Save or update trip for a conversation
export const saveTripForConversation = (conversationId: ConversationId, places: Place[]): string => {
  if (typeof window === "undefined") throw new Error("Cannot save trip on server");

  try {
    const conversation = loadConversation(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    if (conversation.tripId) {
      // Update existing trip
      updateTripInHistory(conversation.tripId, places);
      return conversation.tripId;
    } else {
      // Create new trip and link to conversation
      const tripId = saveTripToHistory(places, conversationId);
      const conversations = loadAllConversations();
      const conversationIndex = conversations.findIndex((c) => c.id === conversationId);
      if (conversationIndex !== -1) {
        conversations[conversationIndex] = {
          ...conversations[conversationIndex],
          tripId: TripId(tripId),
        };
        localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      }
      return tripId;
    }
  } catch (error) {
    console.error("Failed to save trip for conversation:", error);
    throw error;
  }
};
