import type { APIRoute } from "astro";
import { Effect } from "effect";
import { searchPlace } from "@/lib/services/places.service";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { query } = body;

    // Validate query parameter
    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Query parameter is required and must be a string",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get API key from environment
    const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY as string | undefined;

    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.error("GOOGLE_MAPS_API_KEY is not configured");
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

    // Define error response type
    type ErrorResult =
      | {
          type: "not_found";
          message: string;
        }
      | {
          type: "api_error";
          message: string;
        }
      | {
          type: "unknown";
          message: string;
        };

    // Execute Effect
    const result = await Effect.runPromise(
      searchPlace(query, apiKey).pipe(
        Effect.catchAll((error) => {
          // Map tagged errors to Effects that we can handle
          if (error._tag === "PlaceNotFoundError") {
            return Effect.fail<ErrorResult>({
              type: "not_found" as const,
              message: `No results found for "${error.query}"`,
            });
          }
          if (error._tag === "PlacesAPIError") {
            return Effect.fail<ErrorResult>({
              type: "api_error" as const,
              message: error.message,
            });
          }
          return Effect.fail<ErrorResult>({
            type: "unknown" as const,
            message: "An unexpected error occurred",
          });
        })
      )
    ).catch((error: ErrorResult) => {
      // Handle failed Effects
      if (error.type === "not_found") {
        return {
          success: false as const,
          error: error.message,
          status: 404,
        };
      }
      if (error.type === "api_error") {
        return {
          success: false as const,
          error: error.message,
          status: 502,
        };
      }
      return {
        success: false as const,
        error: "An unexpected error occurred",
        status: 500,
      };
    });

    // Check if result is an error response
    if (typeof result === "object" && result !== null && "success" in result && !result.success) {
      const errorResult = result as {
        success: false;
        error: string;
        status: number;
      };
      return new Response(
        JSON.stringify({
          success: false,
          error: errorResult.error,
        }),
        {
          status: errorResult.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        place: result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
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
