import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { ConversationRepository } from "@/infrastructure/plan/database/repositories";
import { toSavedConversation } from "@/infrastructure/plan/database/types";
import {
  UpdateConversationCommandSchema,
  UpdateConversationResponseSchema,
  DeleteConversationResponseSchema,
} from "@/infrastructure/plan/api/schemas";
import { DeleteConversationWithTrip } from "@/application/plan";
import { AppRuntime } from "@/infrastructure/common/runtime";

export const prerender = false;

/**
 * GET /api/conversations/:id
 * Get single conversation with full message history
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

  const program = Effect.gen(function* () {
    const conversationRepo = yield* ConversationRepository;
    const conversation = yield* conversationRepo.findById(user.id, id);
    const domainConversation = toSavedConversation(conversation);

    return domainConversation;
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

    // Update with new title
    yield* conversationRepo.updateTitle(user.id, id, title);

    // Get updated conversation
    const updatedConversation = yield* conversationRepo.findById(user.id, id);

    return UpdateConversationResponseSchema.parse({
      id: updatedConversation.id,
      title: updatedConversation.title,
      updated_at: new Date(updatedConversation.updatedAt).toISOString(),
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
export const DELETE: APIRoute = async ({ params, locals }) => {
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

  const program = Effect.gen(function* () {
    yield* DeleteConversationWithTrip(user.id, id);

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
