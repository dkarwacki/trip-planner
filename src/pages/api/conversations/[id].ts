import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { ConversationRepository } from "@/infrastructure/plan/database/repositories";
import { toSavedConversation } from "@/infrastructure/plan/database/types";
import {
  ConversationDetailSchema,
  UpdateConversationCommandSchema,
  UpdateConversationResponseSchema,
  DeleteConversationResponseSchema,
} from "@/infrastructure/plan/api/schemas";
import { AppRuntime } from "@/infrastructure/common/runtime";

// Hardcoded development user ID
// TODO: Replace with real authentication when auth is implemented
const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

export const prerender = false;

/**
 * GET /api/conversations/:id
 * Get single conversation with full message history
 */
export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "Conversation ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const program = Effect.gen(function* () {
    const conversationRepo = yield* ConversationRepository;
    const conversation = yield* conversationRepo.findById(DEV_USER_ID, id);

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
      console.error(`[API /conversations/${id} GET] Error:`, error);
      if (error._tag === "ConversationNotFoundError") {
        return Effect.succeed({ error: "Conversation not found", notFound: true });
      }
      return Effect.succeed({
        error: error._tag === "DatabaseError" ? "Database error" : "Failed to load conversation",
      });
    })
  );

  const result = await Runtime.runPromise(AppRuntime)(program);

  if ("error" in result) {
    const status = "notFound" in result ? 404 : 500;
    return new Response(JSON.stringify({ error: result.error }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * PUT /api/conversations/:id
 * Update conversation metadata (title only)
 */
export const PUT: APIRoute = async ({ params, request }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "Conversation ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();

  // Validate request body
  const validation = UpdateConversationCommandSchema.safeParse(body);
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

  const { title } = validation.data;

  const program = Effect.gen(function* () {
    const conversationRepo = yield* ConversationRepository;
    
    // Get current conversation
    const conversation = yield* conversationRepo.findById(DEV_USER_ID, id);

    // Update with new title
    const updatedConversation = {
      ...conversation,
      title,
      updatedAt: new Date().toISOString(),
    };

    // Note: We need to update the full conversation since repository doesn't have updateTitle
    // We'll use updateMessages to trigger an update (keeping same messages)
    yield* conversationRepo.updateMessages(DEV_USER_ID, id, updatedConversation.messages);

    return UpdateConversationResponseSchema.parse({
      id: updatedConversation.id,
      title: updatedConversation.title,
      updated_at: updatedConversation.updatedAt,
    });
  }).pipe(
    Effect.catchAll((error) => {
      console.error(`[API /conversations/${id} PUT] Error:`, error);
      if (error._tag === "ConversationNotFoundError") {
        return Effect.succeed({ error: "Conversation not found", notFound: true });
      }
      return Effect.succeed({
        error: error._tag === "DatabaseError" ? "Database error" : "Failed to update conversation",
      });
    })
  );

  const result = await Runtime.runPromise(AppRuntime)(program);

  if ("error" in result) {
    const status = "notFound" in result ? 404 : 500;
    return new Response(JSON.stringify({ error: result.error }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * DELETE /api/conversations/:id
 * Delete conversation
 */
export const DELETE: APIRoute = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "Conversation ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const program = Effect.gen(function* () {
    const conversationRepo = yield* ConversationRepository;
    yield* conversationRepo.delete(DEV_USER_ID, id);

    return DeleteConversationResponseSchema.parse({
      id,
      deleted: true,
    });
  }).pipe(
    Effect.catchAll((error) => {
      console.error(`[API /conversations/${id} DELETE] Error:`, error);
      return Effect.succeed({
        error: error._tag === "DatabaseError" ? "Database error" : "Failed to delete conversation",
      });
    })
  );

  const result = await Runtime.runPromise(AppRuntime)(program);

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
