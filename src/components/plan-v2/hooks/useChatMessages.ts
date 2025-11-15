import { useState, useCallback, useEffect, useRef } from "react";
import type { ChatMessage, PlaceSuggestion } from "@/domain/plan/models/ChatMessage";
import { createUserMessage, createAssistantMessage } from "@/domain/plan/models/ChatMessage";
import type { PersonaType } from "@/domain/plan/models/Persona";
import type { ConversationId } from "@/domain/plan/models/ConversationHistory";

export interface UseChatMessagesOptions {
  /**
   * Current conversation ID. If undefined, a new conversation will be created on first message.
   */
  conversationId?: ConversationId;

  /**
   * Callback to create a new conversation with the initial messages
   * Should set the conversationId after creation
   */
  onCreateConversation?: (messages: ChatMessage[], personas: PersonaType[]) => Promise<ConversationId | null>;

  /**
   * Callback to save messages to an existing conversation
   */
  onSaveMessages?: (conversationId: ConversationId, messages: ChatMessage[]) => Promise<void>;

  /**
   * Callback to signal that conversation creation is in progress
   * Used to prevent auto-save race conditions
   */
  onCreationStateChange?: (isCreating: boolean) => void;
}

export interface UseChatMessagesReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, personas: PersonaType[]) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  clearMessages: () => void;
  setMessages: (messages: ChatMessage[]) => void;
}

/**
 * useChatMessages - Manage chat message state and AI interactions
 *
 * Features:
 * - Sends messages to AI and handles responses
 * - Manages loading and error states
 * - Creates properly formatted chat messages
 * - Integrates with /api/plan endpoint
 * - Auto-saves messages to conversation after AI response
 */
export function useChatMessages(options: UseChatMessagesOptions = {}): UseChatMessagesReturn {
  const { conversationId, onCreateConversation, onSaveMessages, onCreationStateChange } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we need to create a conversation on first message
  const needsConversationCreation = useRef(!conversationId);
  const lastSavedMessageCount = useRef(0);
  
  // Store last user message for retry
  const lastUserMessage = useRef<{ content: string; personas: PersonaType[] } | null>(null);

  const sendMessage = useCallback(
    async (content: string, personas: PersonaType[]) => {
      // Store for potential retry
      lastUserMessage.current = { content, personas };
      
      // Create user message
      const userMessage = createUserMessage(content);

      // Add user message to chat immediately
      const messagesWithUser = [...messages, userMessage];
      setMessages(messagesWithUser);
      setIsLoading(true);
      setError(null);

      try {
        // Build conversation history (simplified - role and content only)
        const conversationHistory = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Call AI endpoint
        const response = await fetch("/api/plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: content,
            personas: personas,
            conversation_history: conversationHistory,
          }),
        });

        if (!response.ok) {
          // Provide specific error messages based on status code
          let errorMessage = "Failed to get response from AI. Please try again.";
          
          if (response.status === 429) {
            errorMessage = "Too many requests. Please wait a moment and try again.";
          } else if (response.status === 503) {
            errorMessage = "Service temporarily unavailable. Please try again in a moment.";
          } else if (response.status === 500) {
            errorMessage = "Server error occurred. Please try again later.";
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = "Authentication error. Please refresh the page and try again.";
          } else if (response.status >= 400 && response.status < 500) {
            errorMessage = "Invalid request. Please check your input and try again.";
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Create assistant message with suggestions
        const assistantMessage = createAssistantMessage(
          data.message || "I apologize, but I couldn't generate a response.",
          data.suggestedPlaces as PlaceSuggestion[] | undefined,
          data.thinking as string[] | undefined
        );

        // Build the complete messages array with both user and assistant messages
        const updatedMessages = [...messagesWithUser, assistantMessage];

        // Auto-save logic (must run BEFORE setMessages to prevent race)
        try {
          // If this is the first message pair and no conversation exists, create one
          if (needsConversationCreation.current && onCreateConversation) {
            // Signal that conversation creation is in progress to prevent auto-save race
            // MUST be called BEFORE setMessages to prevent auto-save from running
            onCreationStateChange?.(true);
            
            const newConversationId = await onCreateConversation(updatedMessages, personas);
            if (newConversationId) {
              needsConversationCreation.current = false;
              lastSavedMessageCount.current = updatedMessages.length;
            }
            
            // Signal that conversation creation is complete
            onCreationStateChange?.(false);
          }
          // Otherwise, save to existing conversation
          else if (conversationId && onSaveMessages) {
            await onSaveMessages(conversationId, updatedMessages);
            lastSavedMessageCount.current = updatedMessages.length;
          }
        } catch (saveError) {
          console.error("Failed to auto-save messages:", saveError);
          // Signal that conversation creation failed (if it was in progress)
          onCreationStateChange?.(false);
          // Don't show error to user - auto-save is background operation
        }

        // Add assistant message to chat AFTER save completes
        setMessages(updatedMessages);
      } catch (err) {
        console.error("Failed to send message:", err);
        
        // Use specific error message if available
        const errorMsg = err instanceof Error ? err.message : "Failed to get response from AI. Please try again.";
        setError(errorMsg);

        // Add error message to chat
        const errorMessage = createAssistantMessage(
          "I'm sorry, I encountered an error. Please try again."
        );
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, conversationId, onCreateConversation, onSaveMessages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    needsConversationCreation.current = true;
    lastSavedMessageCount.current = 0;
    lastUserMessage.current = null;
  }, []);

  const retryLastMessage = useCallback(async () => {
    if (!lastUserMessage.current) {
      return;
    }

    const { content, personas } = lastUserMessage.current;
    
    // Remove the error message (last assistant message) before retrying
    setMessages((prev) => {
      // Find last assistant message (likely an error message)
      const lastAssistantIndex = prev.findLastIndex(m => m.role === 'assistant');
      if (lastAssistantIndex !== -1) {
        return prev.slice(0, lastAssistantIndex);
      }
      return prev;
    });

    // Remove the last user message too (we'll re-add it via sendMessage)
    setMessages((prev) => {
      const lastUserIndex = prev.findLastIndex(m => m.role === 'user');
      if (lastUserIndex !== -1) {
        return prev.slice(0, lastUserIndex);
      }
      return prev;
    });

    // Resend the message
    await sendMessage(content, personas);
  }, [sendMessage]);

  // Update conversation creation flag when conversationId changes
  useEffect(() => {
    needsConversationCreation.current = !conversationId;
  }, [conversationId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    retryLastMessage,
    clearMessages,
    setMessages,
  };
}
