import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { GetPhoto } from "@/application/map/photos";
import { GetPhotoCommandSchema, toDomain } from "@/infrastructure/map/api";
import { ValidationError } from "@/infrastructure/common/http/validation";
import { AppRuntime } from "@/infrastructure/common/runtime";

export const prerender = false;

// Always fetch photos at max size and let browser scale down
const MAX_PHOTO_WIDTH = 1600;

const validateRequest = (params: URLSearchParams) =>
  Effect.gen(function* () {
    const photoReference = params.get("ref");
    const lat = params.get("lat");
    const lng = params.get("lng");
    const placeName = params.get("name");

    const result = GetPhotoCommandSchema.safeParse({
      photoReference,
      maxWidth: MAX_PHOTO_WIDTH, // Always use max width
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      placeName: placeName || undefined,
    });

    if (!result.success) {
      return yield* Effect.fail(new ValidationError(result.error));
    }

    return result.data;
  });

export const GET: APIRoute = async ({ url }) => {
  const program = Effect.gen(function* () {
    const dto = yield* validateRequest(url.searchParams);
    const query = toDomain.getPhoto(dto);
    const photoData = yield* GetPhoto(query);
    return photoData;
  });

  const result = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          yield* Effect.logError("Unexpected error in /api/photos", { defect });
          return yield* Effect.fail({ _tag: "UnexpectedError", message: "Internal server error" });
        })
      ),
      Effect.match({
        onFailure: (error) => ({ success: false as const, error }),
        onSuccess: (data) => ({ success: true as const, data }),
      })
    )
  );

  if (!result.success) {
    const status = result.error._tag === "ValidationError" ? 400 : 500;
    return new Response(JSON.stringify({ error: "message" in result.error ? result.error.message : "Unknown error" }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Return the photo binary data with appropriate content type
  // Browsers will cache this for 48 hours
  // Convert Buffer to Uint8Array for Response constructor
  return new Response(new Uint8Array(result.data.data), {
    status: 200,
    headers: {
      "Content-Type": result.data.contentType,
      "Cache-Control": "public, max-age=172800, immutable", // 48 hours, immutable for better caching
    },
  });
};
