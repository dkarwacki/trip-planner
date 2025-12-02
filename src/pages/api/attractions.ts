import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { getTopAttractions } from "@/application/map/attractions";
import { AttractionsQueryParamsSchema, toDomain } from "@/infrastructure/map/api";
import { ValidationError } from "@/infrastructure/common/http/validation";
import { toHttpResponse } from "@/infrastructure/common/http/response-mappers";
import { AppRuntime } from "@/infrastructure/common/runtime";
import { UnexpectedError } from "@/domain/common/errors";
import { UserPersonasRepository } from "@/infrastructure/plan/database";
import { PERSONA_TYPES, PersonaType } from "@/domain/plan/models";

export const prerender = false;

const validateRequest = (body: unknown) =>
  Effect.gen(function* () {
    const result = AttractionsQueryParamsSchema.safeParse(body);

    if (!result.success) {
      return yield* Effect.fail(new ValidationError(result.error));
    }

    return result.data;
  });

/**
 * Map domain AttractionScore to AttractionDTO
 * Converts nested location and branded types to flat DTO structure
 */
const attractionToDTO = (scored: import("@/domain/map/models/AttractionScore").AttractionScore) => {
  const { attraction, score, breakdown } = scored;
  return {
    id: String(attraction.id), // Unwrap PlaceId branded type
    google_place_id: "", // Not available in domain model
    type: "attraction" as const,
    name: attraction.name,
    rating: attraction.rating ?? null,
    user_ratings_total: attraction.userRatingsTotal ?? null,
    types: attraction.types,
    vicinity: attraction.vicinity ?? null,
    latitude: Number(attraction.location.lat), // Unwrap Latitude and flatten
    longitude: Number(attraction.location.lng), // Unwrap Longitude and flatten
    photos: attraction.photos || [],
    score: score, // Total calculated score
    quality_score: breakdown.qualityScore,
    persona_score: breakdown.personaScore ?? null, // null if undefined
    diversity_score: breakdown.diversityScore,
    confidence_score: breakdown.confidenceScore,
  };
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("[API /api/attractions] Failed to parse JSON body:", error);
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const program = Effect.gen(function* () {
    const dto = yield* validateRequest(body);

    // Fetch user personas from database
    const personasRepo = yield* UserPersonasRepository;
    const userPersonasData = yield* personasRepo.find(user.id);

    // Use DB personas or fallback to general_tourist
    const personas = userPersonasData?.personaTypes.map((p) => PersonaType(p)) ?? [PERSONA_TYPES.GENERAL_TOURIST];

    // Map to domain with personas
    const query = {
      ...toDomain.getAttractions(dto),
      personas, // Add personas to query
    };

    const domainAttractions = yield* getTopAttractions(query);

    // Convert domain objects to DTOs
    const attractions = domainAttractions.map(attractionToDTO);

    return { attractions };
  });

  const response = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          console.error("[API /api/attractions] Defect caught:", defect);
          yield* Effect.logError("Unexpected error in /api/attractions", { defect });
          return yield* Effect.fail(new UnexpectedError("Internal server error", defect));
        })
      ),
      Effect.match({
        onFailure: (error) => {
          console.error("[API /api/attractions] Request failed:", error);
          return toHttpResponse(error);
        },
        onSuccess: (data) => {
          return toHttpResponse(data as unknown as Parameters<typeof toHttpResponse>[0], data);
        },
      })
    )
  );

  return response;
};
