import type { SavedConversation, ConversationId, ChatMessage, PersonaType } from "@/domain/plan/models";
import { ConversationId as ConversationIdBrand, MessageId, ConversationTimestamp } from "@/domain/plan/models";

// API response types (matching server responses)
interface ConversationListResponse {
  conversations: {
    id: string;
    user_id: string;
    title: string;
    personas: string[];
    message_count: number;
    created_at: string;
    updated_at: string;
    has_trip: boolean;
  }[];
}

interface ConversationDetailResponse {
  id: string;
  user_id: string;
  title: string;
  personas: string[];
  messages: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    suggestedPlaces?: any[];
    thinkingProcess?: string[];
  }[];
  created_at: string;
  updated_at: string;
}

interface UpdateMessagesResponse {
  id: string;
  updated_at: string;
}

interface DeleteResponse {
  id: string;
  deleted: boolean;
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
    suggestedPlaces: msg.suggestedPlaces?.map((place) => ({
      id: place.place_id,
      name: place.name,
      description: place.reason || "",
      reasoning: place.reason || "",
      lat: place.lat,
      lng: place.lng,
      photos: place.photos,
      validationStatus: place.validation_status,
    })),
    thinking: msg.thinkingProcess,
  }));

  return {
    id: ConversationIdBrand(detail.id),
    title: detail.title,
    messages,
    personas: detail.personas,
    timestamp: ConversationTimestamp(new Date(detail.created_at).getTime()),
    lastUpdated: ConversationTimestamp(new Date(detail.updated_at).getTime()),
    messageCount: messages.length,
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

  // Convert to SavedConversation format (simplified without full message data)
  return data.conversations.map((conv) => ({
    id: ConversationIdBrand(conv.id),
    title: conv.title,
    messages: [], // List view doesn't include full messages
    personas: conv.personas,
    timestamp: ConversationTimestamp(new Date(conv.created_at).getTime()),
    lastUpdated: ConversationTimestamp(new Date(conv.updated_at).getTime()),
    messageCount: conv.message_count,
  }));
};

/**
 * Get single conversation with full message history
 */
export const getConversation = async (id: ConversationId): Promise<SavedConversation> => {
  const response = await fetch(`/api/conversations/${id}`);

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
 * Create new conversation with initial messages
 * Returns the created conversation ID
 */
export const createConversation = async (
  messages: ChatMessage[],
  personas: PersonaType[],
  title?: string
): Promise<ConversationId> => {
  // Generate title if not provided
  const conversationTitle =
    title || (messages.length > 0 ? `Chat about ${messages[0].content.substring(0, 30)}...` : "New Conversation");

  // Get the first user message as initial message
  const firstMessage = messages.find((m) => m.role === "user");
  if (!firstMessage) {
    throw new Error("At least one user message is required to create a conversation");
  }

  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: conversationTitle,
      personas,
      initial_message: firstMessage.content,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create conversation: ${response.statusText}`);
  }

  const data: ConversationDetailResponse | ErrorResponse = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }

  return ConversationIdBrand(data.id);
};

/**
 * Update conversation messages (bulk update for auto-save)
 */
export const updateConversationMessages = async (id: ConversationId, messages: ChatMessage[]): Promise<void> => {
  const response = await fetch(`/api/conversations/${id}/messages`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).toISOString(),
        suggestedPlaces: msg.suggestedPlaces?.map((place) => ({
          place_id: place.id,
          name: place.name,
          reason: place.reasoning,
          lat: place.lat,
          lng: place.lng,
          photos: place.photos,
          validation_status: place.validationStatus,
        })),
        thinkingProcess: msg.thinking,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update conversation messages: ${response.statusText}`);
  }

  const data: UpdateMessagesResponse | ErrorResponse = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }
};

/**
 * Delete conversation
 */
export const deleteConversation = async (id: ConversationId): Promise<void> => {
  const response = await fetch(`/api/conversations/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete conversation: ${response.statusText}`);
  }

  const data: DeleteResponse | ErrorResponse = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }
};
