import { useState, useCallback, useEffect } from "react";
import type { ConversationId } from "@/domain/plan/models/ConversationHistory";
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

export interface UseConversationReturn {
  conversations: ConversationSummary[];
  activeConversationId?: ConversationId;
  isLoading: boolean;
  error: string | null;
  loadConversations: () => Promise<void>;
  loadConversation: (id: ConversationId) => Promise<any>;
  createNew: (messages: ChatMessage[], personas: PersonaType[], title?: string) => Promise<ConversationId | null>;
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

      const response = await getAllConversations();

      // Transform to ConversationSummary format
      const summaries: ConversationSummary[] = response.map((conv) => ({
        id: conv.id,
        title: conv.title,
        personas: conv.personas,
        messageCount: conv.messageCount,
        createdAt: new Date(conv.timestamp),
        updatedAt: new Date(conv.lastUpdated),
        tripId: conv.tripId,
        isActive: conv.id === activeConversationId,
      }));

      setConversations(summaries);
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
      const conversation = await getConversation(id);
      setActiveConversationId(id);
      return conversation;
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setError("Failed to load conversation");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNew = useCallback(
    async (messages: ChatMessage[], personas: PersonaType[], title?: string): Promise<ConversationId | null> => {
      try {
        setIsLoading(true);
        setError(null);

        // Create conversation with messages and personas
        const conversationId = await createConversation(messages, personas, title);

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

        await updateConversationTitle(conversationId, title);

        // Reload conversations list to reflect title change
        await loadConversations();
      } catch (err) {
        console.error("Failed to update title:", err);
        setError("Failed to update title");
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
