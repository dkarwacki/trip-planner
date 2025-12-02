import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import type { TripDetailDTO } from "@/infrastructure/plan/api";
import { TripRepository, type TripDAO } from "@/infrastructure/plan/database";
import { toHttpResponse } from "@/infrastructure/common/http/response-mappers";
import { AppRuntime } from "@/infrastructure/common/runtime";
import { UnexpectedError } from "@/domain/common/errors";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";
import { TripId, ConversationId } from "@/domain/plan/models";

export const prerender = false;

/**
 * Convert TripDAO to TripDetailDTO for response
 */
function tripDAOToDetailDTO(dao: TripDAO): TripDetailDTO {
  return {
    id: TripId(dao.id),
    user_id: dao.userId,
    conversation_id: dao.conversationId ? ConversationId(dao.conversationId) : null,
    title: dao.title,
    places: dao.placesData.map((placeDAO, index) => ({
      place: {
        id: PlaceId(placeDAO.id),
        google_place_id: "",
        name: placeDAO.name,
        latitude: Latitude(placeDAO.lat),
        longitude: Longitude(placeDAO.lng),
        photos: placeDAO.photos || [],
        validation_status: "verified" as const,
      },
      display_order: index,
      attractions: placeDAO.plannedAttractions.map((a) => ({
        id: PlaceId(a.id),
        google_place_id: a.googlePlaceId || "",
        type: "attraction" as const,
        name: a.name,
        rating: a.rating ?? null,
        user_ratings_total: a.userRatingsTotal ?? null,
        types: a.types || [],
        vicinity: a.vicinity || "",
        latitude: Latitude(a.location.lat),
        longitude: Longitude(a.location.lng),
        photos: a.photos,
        quality_score: a.qualityScore ?? null,
        diversity_score: a.diversityScore ?? null,
        confidence_score: a.confidenceScore ?? null,
      })),
      restaurants: placeDAO.plannedRestaurants.map((r) => ({
        id: PlaceId(r.id),
        google_place_id: r.googlePlaceId || "",
        type: "restaurant" as const,
        name: r.name,
        rating: r.rating ?? null,
        user_ratings_total: r.userRatingsTotal ?? null,
        types: r.types || [],
        vicinity: r.vicinity || "",
        price_level: r.priceLevel ?? null,
        latitude: Latitude(r.location.lat),
        longitude: Longitude(r.location.lng),
        photos: r.photos,
        quality_score: r.qualityScore ?? null,
        diversity_score: r.diversityScore ?? null,
        confidence_score: r.confidenceScore ?? null,
      })),
    })),
    created_at: new Date(dao.createdAt).toISOString(),
    updated_at: new Date(dao.updatedAt).toISOString(),
  };
}

/**
 * GET /api/trips/by-conversation/:conversationId
 * Get trip for conversation (one-to-one relationship)
 * Returns null if no trip found
 */
export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const conversationId = params.conversationId;

  if (!conversationId) {
    return new Response(JSON.stringify({ error: "Conversation ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const program = Effect.gen(function* () {
    const repo = yield* TripRepository;
    const trip = yield* repo.findByConversationId(user.id, conversationId);

    // Return null if no trip found (not an error)
    if (!trip) {
      return null;
    }

    return tripDAOToDetailDTO(trip);
  });

  const result = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          console.error(`[API /api/trips/by-conversation/${conversationId} GET] Defect caught:`, defect);
          yield* Effect.logError(`Unexpected error in GET /api/trips/by-conversation/${conversationId}`, { defect });
          return yield* Effect.fail(new UnexpectedError("Internal server error", defect));
        })
      ),
      Effect.either
    )
  );

  if (result._tag === "Left") {
    console.error(`[API /api/trips/by-conversation/${conversationId} GET] Request failed:`, result.left);
    return toHttpResponse(result.left as Parameters<typeof toHttpResponse>[0]);
  }

  return new Response(JSON.stringify(result.right), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
