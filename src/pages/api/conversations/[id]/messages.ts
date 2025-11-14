import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { ConversationRepository } from "@/infrastructure/plan/database/repositories";
import { AppRuntime } from "@/infrastructure/common/runtime";
import {
  UpdateConversationMessagesCommandSchema,
  UpdateConversationMessagesResponseSchema,
} from "@/infrastructure/plan/api/schemas";
import { DEV_USER_ID } from "@/utils/consts";

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
    const conversationRepo = yield* ConversationRepository;

    // Convert messages to DAO format
    const messagesDAO = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp).getTime(), // Convert ISO string to Unix timestamp
      suggestedPlaces: msg.suggestedPlaces?.map((place) => ({
        id: place.place_id,
        name: place.name,
        description: place.name, // Use name as description if not provided
        reasoning: place.reason,
        lat: place.lat,
        lng: place.lng,
        photos: place.photos,
        validationStatus: place.validation_status,
      })),
      thinking: msg.thinkingProcess,
    }));

    // Update messages in database
    yield* conversationRepo.updateMessages(DEV_USER_ID, id, messagesDAO);

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
