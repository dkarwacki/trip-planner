import type { APIRoute } from "astro";
import { Effect } from "effect";
import { z } from "zod";
import { reverseGeocode, NoResultsError, GeocodingError } from "@/lib/services/geocoding";
import type { Place } from "@/types";
import { getGoogleMapsApiKey, MissingGoogleMapsAPIKeyError } from "@/lib/utils";

export const prerender = false;

const RequestBodySchema = z.object({
  lat: z.number({ required_error: "lat is required" }).min(-90, "lat must be >= -90").max(90, "lat must be <= 90"),
  lng: z.number({ required_error: "lng is required" }).min(-180, "lng must be >= -180").max(180, "lng must be <= 180"),
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

const reverseGeocodeProgram = (
  body: unknown
): Effect.Effect<Place, ValidationError | MissingGoogleMapsAPIKeyError | NoResultsError | GeocodingError> =>
  Effect.gen(function* () {
    const { lat, lng } = yield* validateRequest(body);
    const apiKey = yield* getGoogleMapsApiKey();
    const place = yield* reverseGeocode(lat, lng, apiKey);
    return place;
  });

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const response = await Effect.runPromise(
      reverseGeocodeProgram(body).pipe(
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

            if (error._tag === "NoResultsError") {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: `No results found for coordinates (${error.lat}, ${error.lng})`,
                }),
                {
                  status: 404,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }

            if (error._tag === "GeocodingError") {
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
    console.error("Unexpected error in /api/geocoding/reverse:", error);
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
