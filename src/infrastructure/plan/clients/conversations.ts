import type { SavedConversation, ConversationId, ChatMessage } from "@/domain/plan/models";
import { ConversationId as ConversationIdBrand, MessageId } from "@/domain/plan/models";
import { PersonaType as PersonaTypeBrand } from "@/domain/plan/models";

// API response types (matching server responses)
interface ConversationListResponse {
  conversations: Array<{
    id: string;
    user_id: string;
    title: string;
    personas: string[];
    message_count: number;
    created_at: string;
    updated_at: string;
    has_trip: boolean;
  }>;
}

interface ConversationDetailResponse {
  id: string;
  user_id: string;
  title: string;
  personas: string[];
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface ErrorResponse {
  error: string;
}

/**
 * Convert ConversationDetailResponse to domain SavedConversation
 */
function conversationDetailToSaved(detail: ConversationDetailResponse): SavedConversation {
  const messages: ChatMessage[] = detail.messages.map((msg) => ({
    id: MessageId(msg.id),
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.timestamp).getTime(),
  }));

  return {
    id: ConversationIdBrand(detail.id),
    title: detail.title,
    personas: detail.personas.map((p) => PersonaTypeBrand(p)),
    messages,
    messageCount: messages.length,
    lastUpdated: new Date(detail.updated_at).getTime(),
  };
}

/**
 * Get all user conversations (newest first)
 */
export const getAllConversations = async (): Promise<SavedConversation[]> => {
  const response = await fetch("/api/conversations");

  if (!response.ok) {
    throw new Error(`Failed to load conversations: ${response.statusText}`);
  }

  const data: ConversationListResponse | ErrorResponse = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }

  // Convert to SavedConversation format (simplified without full messages)
  return data.conversations.map((conv) => ({
    id: ConversationIdBrand(conv.id),
    title: conv.title,
    personas: conv.personas.map((p) => PersonaTypeBrand(p)),
    messages: [], // List view doesn't include full messages
    messageCount: conv.message_count,
    lastUpdated: new Date(conv.updated_at).getTime(),
  }));
};

/**
 * Get single conversation with full message history
 */
export const getConversation = async (conversationId: ConversationId): Promise<SavedConversation> => {
  const response = await fetch(`/api/conversations/${conversationId}`);

  if (!response.ok) {
    throw new Error(`Failed to load conversation: ${response.statusText}`);
  }

  const data: ConversationDetailResponse | ErrorResponse = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }

  return conversationDetailToSaved(data);
};

/**
 * Create new conversation with initial message
 * Returns the created conversation with AI response
 */
export const createConversation = async (
  title: string,
  personas: string[],
  initialMessage: string
): Promise<SavedConversation> => {
  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      personas,
      initial_message: initialMessage,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create conversation: ${response.statusText}`);
  }

  const data: ConversationDetailResponse | ErrorResponse = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }

  return conversationDetailToSaved(data);
};

/**
 * Add message to existing conversation
 * Returns the new messages (user + AI response)
 */
export const addMessage = async (
  conversationId: ConversationId,
  message: string
): Promise<ChatMessage[]> => {
  const response = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add message: ${response.statusText}`);
  }

  const data = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }

  // Convert new messages to domain format
  return data.new_messages.map((msg: any) => ({
    id: MessageId(msg.id),
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.timestamp).getTime(),
  }));
};

/**
 * Update conversation metadata (title)
 */
export const updateConversation = async (conversationId: ConversationId, title: string): Promise<void> => {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update conversation: ${response.statusText}`);
  }

  const data = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }
};

/**
 * Delete conversation
 */
export const deleteConversation = async (conversationId: ConversationId): Promise<void> => {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete conversation: ${response.statusText}`);
  }

  const data = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }
};
