import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { TripRepository } from "@/infrastructure/plan/database";
import { toHttpResponse } from "@/infrastructure/common/http/response-mappers";
import { AppRuntime } from "@/infrastructure/common/runtime";
import { UnexpectedError } from "@/domain/common/errors";
import { DEV_USER_ID } from "@/utils/consts";

export const prerender = false;

/**
 * PUT /api/trips/:id/conversation
 * Associate a conversation with a trip
 */
export const PUT: APIRoute = async ({ params, request }) => {
  const tripId = params.id;

  if (!tripId) {
    return new Response(JSON.stringify({ error: "Trip ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const { conversation_id } = body;

  if (!conversation_id) {
    return new Response(JSON.stringify({ error: "conversation_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const program = Effect.gen(function* () {
    const repo = yield* TripRepository;
    yield* repo.updateConversationId(DEV_USER_ID, tripId, conversation_id);

    return {
      id: tripId,
      conversation_id,
      updated_at: new Date().toISOString(),
    };
  });

  const result = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          console.error(`[API /api/trips/${tripId}/conversation PUT] Defect caught:`, defect);
          yield* Effect.logError(`Unexpected error in PUT /api/trips/${tripId}/conversation`, { defect });
          return yield* Effect.fail(new UnexpectedError("Internal server error", defect));
        })
      ),
      Effect.either
    )
  );

  if (result._tag === "Left") {
    console.error(`[API /api/trips/${tripId}/conversation PUT] Request failed:`, result.left);
    return toHttpResponse(result.left as Parameters<typeof toHttpResponse>[0]);
  }

  return new Response(JSON.stringify(result.right), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

