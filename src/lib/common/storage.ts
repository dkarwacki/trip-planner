import type { SavedConversation, ConversationId, ChatMessage } from "@/domain/plan/models";
import type { Place } from "@/domain/common/models";
import { createSavedConversation, updateConversationMessages } from "@/domain/plan/models";

const STORAGE_KEYS = {
  CURRENT_ITINERARY: "trip-planner:current-itinerary",
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

// Trips moved to PostgreSQL - see src/infrastructure/plan/clients/trips.ts
// API: GET/POST/PUT/DELETE /api/trips

// Conversation storage
// NOTE: Trips are now stored separately in PostgreSQL via /api/trips
// Conversations in localStorage will be migrated to database in Phase 4
export const saveConversation = (
  messages: ChatMessage[],
  personas: string[],
  title?: string,
  existingId?: ConversationId
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

        localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
        return existingId;
      }
    }

    // Create new conversation
    const conversation = createSavedConversation(messages, personas, title);

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

// Legacy trip functions removed - trips are now stored in PostgreSQL
// Use getTripForConversation from src/infrastructure/plan/clients/trips.ts
// Migration function (migrateConversationTrips) is no longer needed as trips are in database
