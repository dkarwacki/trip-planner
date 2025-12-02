import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { TripService } from "@/infrastructure/map/database";
import { toHttpResponse } from "@/infrastructure/common/http/response-mappers";
import { AppRuntime } from "@/infrastructure/common/runtime";
import type { PlaceDAO } from "@/infrastructure/plan/database/types";

export const prerender = false;

/**
 * PUT /api/trips/:id/places
 * Update trip places (for auto-save)
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tripId = params.id;

  if (!tripId) {
    return new Response(
      JSON.stringify({
        error: "Trip ID is required",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: "Invalid JSON body",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { places, title } = body as { places: PlaceDAO[]; title?: string };

  if (!Array.isArray(places)) {
    return new Response(
      JSON.stringify({
        error: "places must be an array",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const program = Effect.gen(function* () {
    const service = yield* TripService;
    yield* service.updateTripPlaces(user.id, tripId, places, title);

    return {
      success: true,
      message: "Trip places updated successfully",
      updated_at: new Date().toISOString(),
    };
  });

  const result = await Runtime.runPromise(AppRuntime)(Effect.either(program));

  if (result._tag === "Left") {
    console.error(`[API /api/trips/${tripId}/places PUT] Request failed:`, result.left);
    return toHttpResponse(result.left as Parameters<typeof toHttpResponse>[0]);
  }

  return new Response(JSON.stringify(result.right), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
