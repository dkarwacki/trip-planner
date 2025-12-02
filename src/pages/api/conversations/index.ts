import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { ConversationRepository, TripRepository } from "@/infrastructure/plan/database/repositories";
import { toSavedConversation } from "@/infrastructure/plan/database/types";
import { CreateConversationCommandSchema } from "@/infrastructure/plan/api/schemas";
import { AppRuntime } from "@/infrastructure/common/runtime";

export const prerender = false;

/**
 * GET /api/conversations
 * List all user conversations (newest first)
 */
export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const program = Effect.gen(function* () {
    // Get the repository service instance
    const conversationRepo = yield* ConversationRepository;

    const conversations = yield* conversationRepo.findAll(user.id);

    const domainConversations = conversations.map((conv) => toSavedConversation(conv));

    return {
      conversations: domainConversations,
    };
  }).pipe(
    Effect.catchAll((error) => {
      console.error("[API /conversations GET] Error:", error);
      return Effect.succeed({
        error: error._tag === "DatabaseError" ? "Database error" : "Failed to load conversations",
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

/**
 * POST /api/conversations
 * Create new conversation with initial message
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

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

  const { title, personas, initial_message, trip_id } = validation.data;

  const program = Effect.gen(function* () {
    const conversationId = crypto.randomUUID();
    const now = new Date().toISOString();
    const nowTimestamp = Date.now();

    const conversationData = {
      id: conversationId,
      userId: user.id,
      title,
      personas,
      messages: initial_message
        ? [
            {
              id: crypto.randomUUID(),
              role: "user" as const,
              content: initial_message,
              timestamp: nowTimestamp,
            },
          ]
        : [],
      createdAt: now,
      updatedAt: now,
    };

    const conversationRepo = yield* ConversationRepository;
    yield* conversationRepo.create(user.id, conversationData);

    // If tripId provided, link trip to conversation
    if (trip_id) {
      const tripRepo = yield* TripRepository;

      // Verify trip exists and belongs to user
      yield* tripRepo.findById(user.id, trip_id);

      // Link trip to conversation
      yield* tripRepo.updateConversationId(user.id, trip_id, conversationId);
    }

    const conversation = yield* conversationRepo.findById(user.id, conversationId);
    const domainConversation = toSavedConversation(conversation);

    return domainConversation;
  }).pipe(
    Effect.catchAll((error) => {
      console.error("[API /conversations POST] Error:", error);
      return Effect.succeed({
        error: error._tag === "DatabaseError" ? "Database error" : "Failed to create conversation",
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
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
