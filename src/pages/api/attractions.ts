import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { getTopAttractions, GetTopAttractionsInputSchema } from "@/application/map/attractions";
import { ValidationError } from "@/infrastructure/common/http/validation";
import { toHttpResponse } from "@/infrastructure/common/http/response-mappers";
import { AppRuntime } from "@/infrastructure/common/runtime";
import { UnexpectedError } from "@/domain/common/errors";

export const prerender = false;

const validateRequest = (body: unknown) =>
  Effect.gen(function* () {
    const result = GetTopAttractionsInputSchema.safeParse(body);

    if (!result.success) {
      return yield* Effect.fail(new ValidationError(result.error));
    }

    return result.data;
  });

export const POST: APIRoute = async ({ request }) => {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("[API /api/attractions] Failed to parse JSON body:", error);
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const program = Effect.gen(function* () {
    const input = yield* validateRequest(body);

    const attractions = yield* getTopAttractions(input);

    return { attractions };
  });

  const response = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          console.error("[API /api/attractions] Defect caught:", defect);
          yield* Effect.logError("Unexpected error in /api/attractions", { defect });
          return yield* Effect.fail(new UnexpectedError("Internal server error", defect));
        })
      ),
      Effect.match({
        onFailure: (error) => {
          console.error("[API /api/attractions] Request failed:", error);
          return toHttpResponse(error);
        },
        onSuccess: (data) => {
          return toHttpResponse(data as unknown as Parameters<typeof toHttpResponse>[0], data);
        },
      })
    )
  );

  return response;
};
