import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { GetPhoto } from "@/application/map/photos";
import { GetPhotoCommandSchema } from "@/infrastructure/map/api";
import { ValidationError } from "@/infrastructure/common/http/validation";
import { AppRuntime } from "@/infrastructure/common/runtime";

export const prerender = false;

const validateRequest = (params: URLSearchParams) =>
  Effect.gen(function* () {
    const photoReference = params.get("ref");
    const maxWidth = params.get("width");

    const result = GetPhotoCommandSchema.safeParse({
      photoReference,
      maxWidth: maxWidth ? parseInt(maxWidth, 10) : 800,
    });

    if (!result.success) {
      return yield* Effect.fail(new ValidationError(result.error));
    }

    return result.data;
  });

export const GET: APIRoute = async ({ url }) => {
  const program = Effect.gen(function* () {
    const input = yield* validateRequest(url.searchParams);
    const photoData = yield* GetPhoto(input);
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
