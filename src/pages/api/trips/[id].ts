import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import type { TripDetailDTO } from "@/infrastructure/plan/api";
import { TripRepository, type TripDAO } from "@/infrastructure/plan/database";
import { toHttpResponse } from "@/infrastructure/common/http/response-mappers";
import { AppRuntime } from "@/infrastructure/common/runtime";
import { UnexpectedError } from "@/domain/common/errors";
import type { Place } from "@/domain/common/models";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";
import { TripId, ConversationId } from "@/domain/plan/models";
import { DEV_USER_ID } from "@/utils/consts";

export const prerender = false;

/**
 * Convert domain Place[] to PlaceDAO[] for storage
 */
function placesToPlaceDAOs(places: Place[]) {
  return places.map((place, index) => ({
    id: place.id,
    name: place.name,
    lat: place.latitude,
    lng: place.longitude,
    plannedAttractions: [],
    plannedRestaurants: [],
    photos: place.photos?.map((photo) => ({
      reference: photo.reference,
      width: photo.width,
      height: photo.height,
    })),
  }));
}

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
        google_place_id: placeDAO.id,
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
 * GET /api/trips/:id
 * Get single trip with full place data
 */
export const GET: APIRoute = async ({ params }) => {
  const tripId = params.id;

  if (!tripId) {
    return new Response(JSON.stringify({ error: "Trip ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const program = Effect.gen(function* () {
    const repo = yield* TripRepository;
    const trip = yield* repo.findById(DEV_USER_ID, tripId);
    return tripDAOToDetailDTO(trip);
  });

  const result = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          console.error(`[API /api/trips/${tripId} GET] Defect caught:`, defect);
          yield* Effect.logError(`Unexpected error in GET /api/trips/${tripId}`, { defect });
          return yield* Effect.fail(new UnexpectedError("Internal server error", defect));
        })
      ),
      Effect.either
    )
  );

  if (result._tag === "Left") {
    console.error(`[API /api/trips/${tripId} GET] Request failed:`, result.left);
    return toHttpResponse(result.left as Parameters<typeof toHttpResponse>[0]);
  }

  return new Response(JSON.stringify(result.right), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * PUT /api/trips/:id
 * Update trip places (auto-save from map)
 * Accepts: { places: Place[] }
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
  const { places } = body;

  const program = Effect.gen(function* () {
    const repo = yield* TripRepository;

    // Convert Place[] to PlaceDAO[]
    const placesData = placesToPlaceDAOs(places);

    yield* repo.updatePlaces(DEV_USER_ID, tripId, placesData);

    return {
      id: TripId(tripId),
      updated_at: new Date().toISOString(),
    };
  });

  const result = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          console.error(`[API /api/trips/${tripId} PUT] Defect caught:`, defect);
          yield* Effect.logError(`Unexpected error in PUT /api/trips/${tripId}`, { defect });
          return yield* Effect.fail(new UnexpectedError("Internal server error", defect));
        })
      ),
      Effect.either
    )
  );

  if (result._tag === "Left") {
    console.error(`[API /api/trips/${tripId} PUT] Request failed:`, result.left);
    return toHttpResponse(result.left as Parameters<typeof toHttpResponse>[0]);
  }

  return new Response(JSON.stringify(result.right), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * DELETE /api/trips/:id
 * Delete trip
 */
export const DELETE: APIRoute = async ({ params }) => {
  const tripId = params.id;

  if (!tripId) {
    return new Response(JSON.stringify({ error: "Trip ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const program = Effect.gen(function* () {
    const repo = yield* TripRepository;
    yield* repo.delete(DEV_USER_ID, tripId);

    return {
      id: TripId(tripId),
      deleted: true,
    };
  });

  const result = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          console.error(`[API /api/trips/${tripId} DELETE] Defect caught:`, defect);
          yield* Effect.logError(`Unexpected error in DELETE /api/trips/${tripId}`, { defect });
          return yield* Effect.fail(new UnexpectedError("Internal server error", defect));
        })
      ),
      Effect.either
    )
  );

  if (result._tag === "Left") {
    console.error(`[API /api/trips/${tripId} DELETE] Request failed:`, result.left);
    return toHttpResponse(result.left as Parameters<typeof toHttpResponse>[0]);
  }

  return new Response(JSON.stringify(result.right), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
