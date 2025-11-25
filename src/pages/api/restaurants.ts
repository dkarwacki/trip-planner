import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { getTopRestaurants } from "@/application/map/attractions";
import { RestaurantsQueryParamsSchema, toDomain } from "@/infrastructure/map/api";
import { ValidationError } from "@/infrastructure/common/http/validation";
import { toHttpResponse } from "@/infrastructure/common/http/response-mappers";
import { AppRuntime } from "@/infrastructure/common/runtime";
import { UnexpectedError } from "@/domain/common/errors";

export const prerender = false;

const validateRequest = (body: unknown) =>
  Effect.gen(function* () {
    const result = RestaurantsQueryParamsSchema.safeParse(body);

    if (!result.success) {
      return yield* Effect.fail(new ValidationError(result.error));
    }

    return result.data;
  });

/**
 * Map domain AttractionScore (restaurant) to RestaurantDTO
 * Restaurants use same AttractionScore structure as attractions
 */
const restaurantToDTO = (scored: import("@/domain/map/models/AttractionScore").AttractionScore) => {
  const { attraction, score, breakdown } = scored;
  return {
    id: String(attraction.id),
    google_place_id: "",
    type: "restaurant" as const,
    name: attraction.name,
    rating: attraction.rating ?? null,
    user_ratings_total: attraction.userRatingsTotal ?? null,
    types: attraction.types,
    vicinity: attraction.vicinity ?? null,
    price_level: attraction.priceLevel ?? null,
    latitude: Number(attraction.location.lat),
    longitude: Number(attraction.location.lng),
    photos: attraction.photos || [],
    score: score, // Total calculated score
    quality_score: breakdown.qualityScore,
    persona_score: breakdown.personaScore,
    diversity_score: breakdown.diversityScore,
    confidence_score: breakdown.confidenceScore,
  };
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  const program = Effect.gen(function* () {
    const dto = yield* validateRequest(body);
    const query = toDomain.getRestaurants(dto);
    const domainRestaurants = yield* getTopRestaurants(query);

    // Convert domain objects to DTOs
    const restaurants = domainRestaurants.map(restaurantToDTO);

    return { restaurants };
  });

  const response = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          yield* Effect.logError("Unexpected error in /api/restaurants", { defect });
          return yield* Effect.fail(new UnexpectedError("Internal server error", defect));
        })
      ),
      Effect.match({
        onFailure: (error) => toHttpResponse(error),
        onSuccess: (data) => toHttpResponse(data as unknown as Parameters<typeof toHttpResponse>[0], data),
      })
    )
  );

  return response;
};
