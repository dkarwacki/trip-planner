import type { APIRoute } from "astro";
import { Effect } from "effect";
import { getTopAttractions } from "@/lib/services/attractions.service";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { lat, lng, radius = 1500 } = body;

    // Validate parameters
    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "lat and lng parameters are required and must be numbers",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (typeof radius !== "number" || radius < 100 || radius > 50000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "radius must be a number between 100 and 50000",
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

    // Execute Effect - get top 10 scored attractions
    const result = await Effect.runPromise(
      getTopAttractions(lat, lng, apiKey, 10).pipe(
        Effect.catchAll((error) => {
          // Map tagged errors to Effects that we can handle
          if (error._tag === "NoAttractionsFoundError") {
            return Effect.fail<ErrorResult>({
              type: "not_found" as const,
              message: `No attractions found near (${error.location.lat}, ${error.location.lng})`,
            });
          }
          if (error._tag === "AttractionsAPIError") {
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
        attractions: result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in /api/attractions:", error);
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
