import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { TripService } from "@/infrastructure/map/database";
import { toHttpResponse } from "@/infrastructure/common/http/response-mappers";
import { AppRuntime } from "@/infrastructure/common/runtime";

export const prerender = false;

/**
 * GET /api/trips/recent
 * Get recent trips for trip selector (limit 10, ordered by updated_at DESC)
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
    const service = yield* TripService;
    const trips = yield* service.getRecentTrips(user.id);

    return trips.map((trip) => ({
      id: trip.id,
      user_id: trip.userId,
      title: trip.title,
      place_count: trip.placesData.length,
      conversation_id: trip.conversationId,
      created_at: trip.createdAt,
      updated_at: trip.updatedAt,
    }));
  });

  const result = await Runtime.runPromise(AppRuntime)(Effect.either(program));

  if (result._tag === "Left") {
    console.error("[API /api/trips/recent GET] Request failed:", result.left);
    return toHttpResponse(result.left as Parameters<typeof toHttpResponse>[0]);
  }

  return new Response(JSON.stringify(result.right), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
