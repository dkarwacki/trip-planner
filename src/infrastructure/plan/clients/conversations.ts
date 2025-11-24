import type { SavedConversation, ConversationId, ChatMessage, PersonaType } from "@/domain/plan/models";

interface ConversationListResponse {
  conversations: SavedConversation[];
}

type ConversationDetailResponse = SavedConversation;

interface UpdateMessagesResponse {
  id: string;
  updated_at: string;
}

interface UpdateConversationResponse {
  id: string;
  title: string;
  updated_at: string;
}

interface DeleteResponse {
  id: string;
  deleted: boolean;
}

interface ErrorResponse {
  error: string;
}

export const getAllConversations = async (): Promise<SavedConversation[]> => {
  const response = await fetch("/api/conversations");

  if (!response.ok) {
    throw new Error(`Failed to load conversations: ${response.statusText}`);
  }

  const data: ConversationListResponse | ErrorResponse = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }

  return data.conversations;
};

export const getConversation = async (
  id: ConversationId,
  options?: { silent?: boolean }
): Promise<SavedConversation> => {
  const response = await fetch(`/api/conversations/${id}`);

  if (!response.ok) {
    // Only log error if not in silent mode or if it's not a 404
    if (!options?.silent || response.status !== 404) {
      console.error(`Failed to load conversation ${id}: ${response.statusText}`);
    }
    throw new Error(`Failed to load conversation: ${response.statusText}`);
  }

  const data: ConversationDetailResponse | ErrorResponse = await response.json();

  if ("error" in data) {
    if (!options?.silent) {
      console.error(`Failed to load conversation ${id}:`, data.error);
    }
    throw new Error(data.error);
  }

  return data;
};

export const createConversation = async (
  messages: ChatMessage[],
  personas: PersonaType[],
  title?: string,
  tripId?: string
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
      trip_id: tripId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create conversation: ${response.statusText}`);
  }

  const data: ConversationDetailResponse | ErrorResponse = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }

  // If there are more messages than just the first one, update with all messages
  if (messages.length > 1) {
    await updateConversationMessages(data.id, messages);
  }

  return data.id;
};

export const updateConversationMessages = async (id: ConversationId, messages: ChatMessage[]): Promise<void> => {
  const response = await fetch(`/api/conversations/${id}/messages`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
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

export const updateConversationTitle = async (id: ConversationId, title: string): Promise<void> => {
  const response = await fetch(`/api/conversations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update conversation title: ${response.statusText}`);
  }

  const data: UpdateConversationResponse | ErrorResponse = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }
};

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
