import type { APIRoute } from "astro";
import { Effect, Layer, Runtime } from "effect";
import { z } from "zod";
import {
  getTopRestaurants,
  NoAttractionsFoundError,
  AttractionsAPIError,
  RestaurantsCacheLayer,
} from "@/lib/services/attractions";
import type { AttractionScore } from "@/types";
import { getGoogleMapsApiKey, MissingGoogleMapsAPIKeyError } from "@/lib/utils";

export const prerender = false;

const runtimeEffect = Layer.toRuntime(RestaurantsCacheLayer);
const runtime = await Effect.runPromise(Effect.scoped(runtimeEffect));

const RequestBodySchema = z.object({
  lat: z
    .number({ required_error: "lat is required" })
    .refine((val) => val >= -90 && val <= 90, { message: "Latitude must be between -90 and 90" }),
  lng: z
    .number({ required_error: "lng is required" })
    .refine((val) => val >= -180 && val <= 180, { message: "Longitude must be between -180 and 180" }),
  radius: z.number().min(100).max(50000).default(1500),
});

type RequestBody = z.infer<typeof RequestBodySchema>;

class ValidationError {
  readonly _tag = "ValidationError";
  constructor(readonly errors: z.ZodError) {}
}

const validateRequest = (body: unknown): Effect.Effect<RequestBody, ValidationError> =>
  Effect.gen(function* () {
    const result = RequestBodySchema.safeParse(body);

    if (!result.success) {
      return yield* Effect.fail(new ValidationError(result.error));
    }

    return result.data;
  });

const fetchRestaurantsProgram = (
  body: unknown
): Effect.Effect<
  AttractionScore[],
  ValidationError | MissingGoogleMapsAPIKeyError | NoAttractionsFoundError | AttractionsAPIError,
  never
> =>
  Effect.gen(function* () {
    const { lat, lng } = yield* validateRequest(body);
    const apiKey = yield* getGoogleMapsApiKey();
    const restaurants = yield* getTopRestaurants(lat, lng, apiKey, 10);
    return restaurants;
  }).pipe(Effect.provide(RestaurantsCacheLayer));

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const response = await Runtime.runPromise(runtime)(
      fetchRestaurantsProgram(body).pipe(
        Effect.match({
          onFailure: (error) => {
            if (error._tag === "ValidationError") {
              const formattedErrors = error.errors.errors.map((err) => ({
                path: err.path.join("."),
                message: err.message,
              }));

              return new Response(
                JSON.stringify({
                  success: false,
                  error: "Validation failed",
                  details: formattedErrors,
                }),
                {
                  status: 400,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }

            if (error._tag === "MissingGoogleMapsAPIKeyError") {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: "Server configuration error",
                }),
                {
                  status: 500,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }

            if (error._tag === "NoAttractionsFoundError") {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: `No restaurants found near (${error.location.lat}, ${error.location.lng})`,
                }),
                {
                  status: 404,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }

            if (error._tag === "AttractionsAPIError") {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: error.message,
                }),
                {
                  status: 502,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }

            return new Response(
              JSON.stringify({
                success: false,
                error: "An unexpected error occurred",
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            );
          },
          onSuccess: (restaurants) => {
            return new Response(
              JSON.stringify({
                success: true,
                attractions: restaurants,
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            );
          },
        })
      )
    );

    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in /api/restaurants:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
