import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { GetPhoto, GetPhotoInputSchema } from "@/application/map/photos";
import { ValidationError } from "@/infrastructure/common/http/validation";
import { AppRuntime } from "@/infrastructure/common/runtime";

export const prerender = false;

const validateRequest = (body: unknown) =>
  Effect.gen(function* () {
    const result = GetPhotoInputSchema.safeParse(body);

    if (!result.success) {
      return yield* Effect.fail(new ValidationError(result.error));
    }

    return result.data;
  });

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  const program = Effect.gen(function* () {
    const input = yield* validateRequest(body);
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
  return new Response(result.data.data, {
    status: 200,
    headers: {
      "Content-Type": result.data.contentType,
      "Cache-Control": "public, max-age=172800", // 48 hours
    },
  });
};

