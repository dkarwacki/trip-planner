import type { ValidationError } from "./validation";
import type {
  NoAttractionsFoundError,
  AttractionsAPIError,
  PlaceNotFoundError,
  PlacesAPIError,
  NoResultsError,
  GeocodingError,
  MissingGoogleMapsAPIKeyError,
  MissingOpenRouterAPIKeyError,
  MissingOpenRouterModelError,
  UnexpectedError,
  AgentError,
  InvalidToolCallError,
  ModelResponseError,
} from "@/domain/errors";

type AppError =
  | ValidationError
  | MissingGoogleMapsAPIKeyError
  | MissingOpenRouterAPIKeyError
  | MissingOpenRouterModelError
  | NoAttractionsFoundError
  | AttractionsAPIError
  | PlaceNotFoundError
  | PlacesAPIError
  | NoResultsError
  | GeocodingError
  | AgentError
  | InvalidToolCallError
  | ModelResponseError
  | UnexpectedError;

export const toHttpResponse = (error: AppError, successData?: Record<string, unknown>): Response => {
  if ("_tag" in error) {
    switch (error._tag) {
      case "ValidationError": {
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

      case "MissingGoogleMapsAPIKeyError":
      case "MissingOpenRouterAPIKeyError":
      case "MissingOpenRouterModelError":
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

      case "NoAttractionsFoundError": {
        const type = error.searchType === "restaurants" ? "restaurants" : "attractions";
        return new Response(
          JSON.stringify({
            success: false,
            error: `No ${type} found near (${error.location.lat}, ${error.location.lng})`,
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      case "AttractionsAPIError":
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

      case "PlaceNotFoundError":
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

      case "PlacesAPIError":
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

      case "NoResultsError":
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

      case "GeocodingError":
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

      case "AgentError":
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

      case "InvalidToolCallError":
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );

      case "ModelResponseError":
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

      case "UnexpectedError":
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );

      default:
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
    }
  }

  // Success response
  return new Response(
    JSON.stringify({
      success: true,
      ...successData,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
