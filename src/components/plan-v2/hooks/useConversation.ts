import { useState, useCallback, useEffect } from "react";
import type { ConversationId } from "@/domain/plan/models/ConversationHistory";
import { ConversationId as ConversationIdBrand } from "@/domain/plan/models/ConversationHistory";
import type { ChatMessage, PersonaType } from "@/domain/plan/models";
import type { ConversationSummary } from "../types";
import {
  getAllConversations,
  getConversation,
  createConversation,
  updateConversationMessages,
  updateConversationTitle,
  deleteConversation as deleteConversationApi,
} from "@/infrastructure/plan/clients/conversations";
import { getAllTrips, getTrip } from "@/infrastructure/plan/clients/trips";

export interface UseConversationReturn {
  conversations: ConversationSummary[];
  activeConversationId?: ConversationId;
  isLoading: boolean;
  error: string | null;
  loadConversations: () => Promise<void>;
  loadConversation: (id: ConversationId) => Promise<any>;
  createNew: (
    messages: ChatMessage[],
    personas: PersonaType[],
    title?: string,
    tripId?: string
  ) => Promise<ConversationId | null>;
  saveMessages: (conversationId: ConversationId, messages: ChatMessage[]) => Promise<void>;
  updateTitle: (conversationId: ConversationId, title: string) => Promise<void>;
  deleteConversation: (id: ConversationId) => Promise<void>;
  setActiveConversationId: (id?: ConversationId) => void;
}

/**
 * useConversation - Manage conversation library state
 *
 * Features:
 * - Load all user conversations
 * - Load specific conversation
 * - Create new conversation
 * - Delete conversation
 * - Track active conversation
 */
export function useConversation(): UseConversationReturn {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<ConversationId | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch both conversations and trips in parallel
      const [conversations, trips] = await Promise.all([getAllConversations(), getAllTrips()]);

      // Transform conversations to ConversationSummary format
      const conversationSummaries: ConversationSummary[] = conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        personas: conv.personas,
        messageCount: conv.messageCount,
        createdAt: new Date(conv.timestamp),
        updatedAt: new Date(conv.lastUpdated),
        tripId: conv.tripId,
        isActive: conv.id === activeConversationId,
      }));

      // Find orphan trips (trips without conversations)
      const orphanTrips = trips.filter((trip) => !trip.conversationId);

      // Transform orphan trips to "virtual" ConversationSummary objects
      const virtualConversations: ConversationSummary[] = orphanTrips.map((trip) => ({
        id: ConversationIdBrand(trip.id as string), // Use trip ID as conversation ID
        title: trip.title,
        personas: [], // No personas for trips without conversations
        messageCount: 0, // No messages yet
        createdAt: new Date(trip.timestamp),
        updatedAt: new Date(trip.timestamp),
        tripId: trip.id,
        isActive: ConversationIdBrand(trip.id as string) === activeConversationId,
      }));

      // Merge and sort by date (newest first)
      const allConversations = [...conversationSummaries, ...virtualConversations].sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );

      setConversations(allConversations);
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setError("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId]);

  const loadConversation = useCallback(async (id: ConversationId) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to load as a conversation first
      try {
        const conversation = await getConversation(id);
        setActiveConversationId(id);
        return conversation;
      } catch (convError) {
        // If conversation not found, try to load as a trip (virtual conversation)
        console.log("Conversation not found, trying to load as trip:", id);

        try {
          const trip = await getTrip(id as string);

          // Create a virtual conversation from the trip
          const virtualConversation = {
            id: ConversationIdBrand(trip.id as string),
            title: trip.title,
            messages: [],
            personas: [],
            timestamp: trip.timestamp,
            lastUpdated: trip.timestamp,
            messageCount: 0,
            tripId: trip.id,
          };

          setActiveConversationId(id);
          return virtualConversation;
        } catch (tripError) {
          // Neither conversation nor trip found
          throw convError;
        }
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setError("Failed to load conversation");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNew = useCallback(
    async (
      messages: ChatMessage[],
      personas: PersonaType[],
      title?: string,
      tripId?: string
    ): Promise<ConversationId | null> => {
      try {
        setIsLoading(true);
        setError(null);

        // Create conversation with messages and personas (and optional tripId)
        const conversationId = await createConversation(messages, personas, title, tripId);

        setActiveConversationId(conversationId);

        // Reload conversations list
        await loadConversations();

        return conversationId;
      } catch (err) {
        console.error("Failed to create conversation:", err);
        setError("Failed to create conversation");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [loadConversations]
  );

  const saveMessages = useCallback(
    async (conversationId: ConversationId, messages: ChatMessage[]) => {
      try {
        setError(null);

        await updateConversationMessages(conversationId, messages);

        // Optionally reload conversations to update message count
        await loadConversations();
      } catch (err) {
        console.error("Failed to save messages:", err);
        setError("Failed to save messages");
        throw err;
      }
    },
    [loadConversations]
  );

  const updateTitle = useCallback(
    async (conversationId: ConversationId, title: string) => {
      try {
        setError(null);

        // Optimistically update local state
        setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, title } : c)));

        await updateConversationTitle(conversationId, title);

        // Don't reload conversations here to avoid race conditions with stale data
        // The local update is sufficient for UI
      } catch (err) {
        console.error("Failed to update title:", err);
        setError("Failed to update title");
        // Revert local change on error
        await loadConversations();
        throw err;
      }
    },
    [loadConversations]
  );

  const deleteConv = useCallback(
    async (id: ConversationId) => {
      try {
        setIsLoading(true);
        setError(null);

        await deleteConversationApi(id);

        // If deleted conversation was active, clear active state
        if (activeConversationId === id) {
          setActiveConversationId(undefined);
        }

        // Reload conversations list
        await loadConversations();
      } catch (err) {
        console.error("Failed to delete conversation:", err);
        setError("Failed to delete conversation");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId, loadConversations]
  );

  return {
    conversations,
    activeConversationId,
    isLoading,
    error,
    loadConversations,
    loadConversation,
    createNew,
    saveMessages,
    updateTitle,
    deleteConversation: deleteConv,
    setActiveConversationId,
  };
}
