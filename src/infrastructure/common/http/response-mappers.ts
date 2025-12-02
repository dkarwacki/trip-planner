import type { ValidationError } from "./validation";
import type {
  MissingGoogleMapsAPIKeyError,
  MissingOpenRouterAPIKeyError,
  MissingOpenRouterModelError,
  UnexpectedError,
  AgentError,
  InvalidToolCallError,
  ModelResponseError,
} from "@/domain/common/errors";
import type {
  NoAttractionsFoundError,
  AttractionsAPIError,
  AttractionNotFoundError,
  PlaceNotFoundError,
  PlacesAPIError,
  NoResultsError,
  GeocodingError,
} from "@/domain/map/errors";
import type { AuthenticationError, RegistrationError, PasswordResetError } from "@/domain/auth/errors";

type AppError =
  | ValidationError
  | MissingGoogleMapsAPIKeyError
  | MissingOpenRouterAPIKeyError
  | MissingOpenRouterModelError
  | NoAttractionsFoundError
  | AttractionsAPIError
  | AttractionNotFoundError
  | PlaceNotFoundError
  | PlacesAPIError
  | NoResultsError
  | GeocodingError
  | AgentError
  | InvalidToolCallError
  | ModelResponseError
  | UnexpectedError
  | AuthenticationError
  | RegistrationError
  | PasswordResetError;

export const toHttpResponse = (error: AppError, successData?: Record<string, unknown>): Response => {
  if ("_tag" in error) {
    switch (error._tag) {
      case "ValidationError": {
        const formattedErrors = error.errors.errors.map((err: { path: (string | number)[]; message: string }) => ({
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

      case "AttractionNotFoundError":
        return new Response(
          JSON.stringify({
            success: false,
            error: `No attraction found for "${error.query}"`,
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

      // Auth errors
      case "AuthenticationError":
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
            code: error.code,
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );

      case "RegistrationError": {
        const status = error.code === "email_already_exists" ? 409 : 400;
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
            code: error.code,
          }),
          {
            status,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      case "PasswordResetError":
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message,
            code: error.code,
          }),
          {
            status: 400,
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
