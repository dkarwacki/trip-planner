import type { APIRoute } from "astro";
import { Effect } from "effect";
import { ConversationRepository } from "@/infrastructure/plan/database/repositories";
import { toSavedConversation, toConversationInsert } from "@/infrastructure/plan/database/types";
import {
  ConversationListResponseSchema,
  CreateConversationCommandSchema,
  ConversationDetailSchema,
} from "@/infrastructure/plan/api/schemas";

// Hardcoded development user ID
// TODO: Replace with real authentication when auth is implemented
const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

export const prerender = false;

/**
 * GET /api/conversations
 * List all user conversations (newest first)
 */
export const GET: APIRoute = async () => {
  const program = Effect.gen(function* () {
    // Get all conversations for user
    const conversations = yield* ConversationRepository.findAll(DEV_USER_ID);

    // Convert to API response format
    const responseConversations = conversations.map((conv) => ({
      id: conv.id,
      user_id: conv.userId,
      title: conv.title,
      personas: conv.personas,
      message_count: conv.messages.length,
      created_at: conv.createdAt,
      updated_at: conv.updatedAt,
      has_trip: false, // TODO: Check if trip exists for conversation
    }));

    return ConversationListResponseSchema.parse({
      conversations: responseConversations,
    });
  }).pipe(
    Effect.catchAll((error) => {
      console.error("[API /conversations GET] Error:", error);
      return Effect.succeed({
        error: error._tag === "DatabaseError" ? "Database error" : "Failed to load conversations",
      });
    })
  );

  const result = await Effect.runPromise(program);

  if ("error" in result) {
    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * POST /api/conversations
 * Create new conversation with initial message
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  // Validate request body
  const validation = CreateConversationCommandSchema.safeParse(body);
  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request body",
        details: validation.error.errors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { title, personas, initial_message } = validation.data;

  const program = Effect.gen(function* () {
    // Generate new conversation ID
    const conversationId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Create conversation with initial messages (user + assistant)
    // For now, just create user message. AI response will be added via /messages endpoint
    const conversationData = {
      id: conversationId,
      title,
      personas,
      messages: [
        {
          id: crypto.randomUUID(),
          role: "user" as const,
          content: initial_message,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Create the conversation
    yield* ConversationRepository.create(DEV_USER_ID, conversationData);

    // Fetch the created conversation
    const conversation = yield* ConversationRepository.findById(DEV_USER_ID, conversationId);

    // Convert to API response format
    const domainConversation = toSavedConversation(conversation);

    return ConversationDetailSchema.parse({
      id: domainConversation.id,
      user_id: conversation.userId,
      title: domainConversation.title,
      personas: domainConversation.personas,
      messages: domainConversation.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).toISOString(),
      })),
      created_at: conversation.createdAt,
      updated_at: conversation.updatedAt,
    });
  }).pipe(
    Effect.catchAll((error) => {
      console.error("[API /conversations POST] Error:", error);
      return Effect.succeed({
        error: error._tag === "DatabaseError" ? "Database error" : "Failed to create conversation",
      });
    })
  );

  const result = await Effect.runPromise(program);

  if ("error" in result) {
    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(result), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
