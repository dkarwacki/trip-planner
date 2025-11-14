import type { APIRoute } from "astro";
import { Effect } from "effect";
import { ConversationRepository } from "@/infrastructure/plan/database/repositories";
import {
  UpdateConversationMessagesCommandSchema,
  UpdateConversationMessagesResponseSchema,
} from "@/infrastructure/plan/api/schemas";

// Hardcoded development user ID
// TODO: Replace with real authentication when auth is implemented
const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

export const prerender = false;

/**
 * PUT /api/conversations/:id/messages
 * Update conversation messages (bulk update for auto-save)
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
  const validation = UpdateConversationMessagesCommandSchema.safeParse(body);
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

  const { messages } = validation.data;

  const program = Effect.gen(function* () {
    // Convert messages to DAO format (snake_case to camelCase already handled by validation)
    const messagesDAO = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      suggestedPlaces: msg.suggestedPlaces,
      thinkingProcess: msg.thinkingProcess,
    }));

    // Update messages in database
    yield* ConversationRepository.updateMessages(DEV_USER_ID, id, messagesDAO);

    return UpdateConversationMessagesResponseSchema.parse({
      id,
      updated_at: new Date().toISOString(),
    });
  }).pipe(
    Effect.catchAll((error) => {
      console.error(`[API /conversations/${id}/messages PUT] Error:`, error);
      if (error._tag === "ConversationNotFoundError") {
        return Effect.succeed({ error: "Conversation not found", notFound: true });
      }
      return Effect.succeed({
        error: error._tag === "DatabaseError" ? "Database error" : "Failed to update messages",
      });
    })
  );

  const result = await Effect.runPromise(program);

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
