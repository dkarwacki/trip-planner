import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { TripService } from "@/infrastructure/map/database";
import { toHttpResponse } from "@/infrastructure/common/http/response-mappers";
import { AppRuntime } from "@/infrastructure/common/runtime";
import { DEV_USER_ID } from "@/utils/consts";

export const prerender = false;

/**
 * GET /api/trips/current
 * Get current trip or create a new one if none exists
 * Returns the most recently updated trip, or creates a new one
 */
export const GET: APIRoute = async () => {
  const program = Effect.gen(function* () {
    const service = yield* TripService;
    const trip = yield* service.getCurrentOrCreate(DEV_USER_ID);

    return {
      id: trip.id,
      user_id: trip.userId,
      title: trip.title,
      places_data: trip.placesData,
      conversation_id: trip.conversationId,
      created_at: trip.createdAt,
      updated_at: trip.updatedAt,
    };
  });

  const result = await Runtime.runPromise(AppRuntime)(Effect.either(program));

  if (result._tag === "Left") {
    console.error("[API /api/trips/current GET] Request failed:", result.left);
    return toHttpResponse(result.left as Parameters<typeof toHttpResponse>[0]);
  }

  return new Response(JSON.stringify(result.right), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
