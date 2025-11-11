import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { suggestNearbyAttractions } from "@/application/map/attractions";
import { SuggestNearbyAttractionsCommandSchema } from "@/infrastructure/map/api";
import { ValidationError } from "@/infrastructure/common/http/validation";
import { toHttpResponse } from "@/infrastructure/common/http/response-mappers";
import { AppRuntime } from "@/infrastructure/common/runtime";
import { UnexpectedError } from "@/domain/common/errors";

export const prerender = false;

const validateRequest = (body: unknown) =>
  Effect.gen(function* () {
    const result = SuggestNearbyAttractionsCommandSchema.safeParse(body);

    if (!result.success) {
      return yield* Effect.fail(new ValidationError(result.error));
    }

    return result.data;
  });

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  const program = Effect.gen(function* () {
    const input = yield* validateRequest(body);
    const suggestions = yield* suggestNearbyAttractions(input);
    return { suggestions };
  });

  const response = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          yield* Effect.logError("Unexpected error in /api/attractions/suggest", { defect });
          return yield* Effect.fail(new UnexpectedError("Internal server error", defect));
        })
      ),
      Effect.match({
        onFailure: (error) => {
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
