import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { ConversationRepository } from "@/infrastructure/plan/database/repositories";
import { AppRuntime } from "@/infrastructure/common/runtime";
import { UpdateConversationMessagesCommandSchema } from "@/infrastructure/plan/api/schemas";

export const prerender = false;

/**
 * PUT /api/conversations/:id/messages
 * Update conversation messages (bulk update for auto-save)
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

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

    // Convert domain messages to DAO format
    const messagesDAO = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp, // Already Unix timestamp from domain model
      suggestedPlaces: msg.suggestedPlaces?.map((place) => ({
        id: place.id,
        name: place.name,
        description: place.description || place.name, // Use description or fallback to name
        reasoning: place.reasoning,
        lat: place.lat,
        lng: place.lng,
        photos: place.photos,
        validationStatus: place.validationStatus,
        searchQuery: place.searchQuery,
      })),
      thinking: msg.thinking,
    }));

    // Update messages in database
    yield* conversationRepo.updateMessages(user.id, id, messagesDAO);

    return {
      id,
      updated_at: new Date().toISOString(),
    };
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
