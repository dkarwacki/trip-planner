import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import {
  type TripListResponseDTO,
  type TripDetailDTO,
} from "@/infrastructure/plan/api";
import { TripRepository, type TripDAO } from "@/infrastructure/plan/database";
import { toHttpResponse } from "@/infrastructure/common/http/response-mappers";
import { AppRuntime } from "@/infrastructure/common/runtime";
import { UnexpectedError } from "@/domain/common/errors";
import type { Place } from "@/domain/common/models";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";
import { TripId, ConversationId } from "@/domain/plan/models";

export const prerender = false;

// Hardcoded user ID for development (TODO: Replace with real auth)
const DEV_USER_ID = "0bbf70aa-4389-428d-b127-6cf505535dd7";

/**
 * Convert domain Place[] to PlaceDAO[] for storage
 * Maps from the structure used in localStorage to database structure
 */
function placesToPlaceDAOs(places: Place[]) {
  return places.map((place, index) => ({
    id: place.id,
    name: place.name,
    lat: place.latitude,
    lng: place.longitude,
    plannedAttractions: [],
    plannedRestaurants: [],
    photos: place.photos?.map(photo => ({
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
        google_place_id: placeDAO.id, // Using id as google_place_id for now
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
    created_at: dao.createdAt,
    updated_at: dao.updatedAt,
  };
}

/**
 * GET /api/trips
 * List all user trips (newest first)
 */
export const GET: APIRoute = async () => {
  const program = Effect.gen(function* () {
    const repo = yield* TripRepository;
    const trips = yield* repo.findAll(DEV_USER_ID);

    const response: TripListResponseDTO = {
      trips: trips.map((trip) => ({
        id: TripId(trip.id),
        user_id: trip.userId,
        conversation_id: trip.conversationId ? ConversationId(trip.conversationId) : null,
        title: trip.title,
        place_count: trip.placesData.length,
        created_at: trip.createdAt,
        updated_at: trip.updatedAt,
      })),
    };

    return response;
  });

  const result = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          console.error("[API /api/trips GET] Defect caught:", defect);
          yield* Effect.logError("Unexpected error in GET /api/trips", { defect });
          return yield* Effect.fail(new UnexpectedError("Internal server error", defect));
        })
      ),
      Effect.either
    )
  );

  if (result._tag === "Left") {
    console.error("[API /api/trips GET] Request failed:", result.left);
    return toHttpResponse(result.left as Parameters<typeof toHttpResponse>[0]);
  }

  return new Response(JSON.stringify(result.right), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * POST /api/trips
 * Create new trip from Place[] data (migration-compatible)
 * Accepts: { title, places: Place[], conversation_id? }
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { title, places, conversation_id } = body;

  const program = Effect.gen(function* () {
    const repo = yield* TripRepository;

    // Generate trip ID
    const tripId = crypto.randomUUID();

    // Convert Place[] to PlaceDAO[]
    const placesData = placesToPlaceDAOs(places);

    const tripDAO: TripDAO = {
      id: tripId,
      userId: DEV_USER_ID,
      title: title || "Untitled Trip",
      placesData,
      conversationId: conversation_id || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    yield* repo.create(DEV_USER_ID, tripDAO);

    // Fetch and return the created trip
    const createdTrip = yield* repo.findById(DEV_USER_ID, tripId);
    return tripDAOToDetailDTO(createdTrip);
  });

  const result = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          console.error("[API /api/trips POST] Defect caught:", defect);
          yield* Effect.logError("Unexpected error in POST /api/trips", { defect });
          return yield* Effect.fail(new UnexpectedError("Internal server error", defect));
        })
      ),
      Effect.either
    )
  );

  if (result._tag === "Left") {
    console.error("[API /api/trips POST] Request failed:", result.left);
    return toHttpResponse(result.left as Parameters<typeof toHttpResponse>[0]);
  }

  return new Response(JSON.stringify(result.right), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
