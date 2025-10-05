import type { APIRoute } from "astro";
import { Effect } from "effect";
import { z } from "zod";
import { searchPlace, PlaceNotFoundError, PlacesAPIError } from "@/lib/services/places";
import type { Place } from "@/types";
import { getGoogleMapsApiKey, MissingGoogleMapsAPIKeyError } from "@/lib/utils";

export const prerender = false;

const RequestBodySchema = z.object({
  query: z.string({ required_error: "query is required" }).min(1, "query cannot be empty"),
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

const searchPlaceProgram = (
  body: unknown
): Effect.Effect<Place, ValidationError | MissingGoogleMapsAPIKeyError | PlaceNotFoundError | PlacesAPIError> =>
  Effect.gen(function* () {
    const { query } = yield* validateRequest(body);
    const apiKey = yield* getGoogleMapsApiKey();
    const place = yield* searchPlace(query, apiKey);
    return place;
  });

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const response = await Effect.runPromise(
      searchPlaceProgram(body).pipe(
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

            if (error._tag === "PlaceNotFoundError") {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: `No results found for "${error.query}"`,
                }),
                {
                  status: 404,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }

            if (error._tag === "PlacesAPIError") {
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
          onSuccess: (place) => {
            return new Response(
              JSON.stringify({
                success: true,
                place: place,
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
    console.error("Unexpected error in /api/places/search:", error);
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
