import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { analyzeTripPlan, AnalyzeTripPlanInputSchema } from "@/application/agent";
import { ValidationError } from "@/infrastructure/http/validation";
import { toHttpResponse } from "@/infrastructure/http/response-mappers";
import { AppRuntime } from "@/infrastructure/runtime";
import { UnexpectedError } from "@/domain/errors";

export const prerender = false;

const validateRequest = (body: unknown) =>
  Effect.gen(function* () {
    const result = AnalyzeTripPlanInputSchema.safeParse(body);

    if (!result.success) {
      return yield* Effect.fail(new ValidationError(result.error));
    }

    return result.data;
  });

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  const program = Effect.gen(function* () {
    const input = yield* validateRequest(body);
    const analysis = yield* analyzeTripPlan(input);
    return { analysis };
  });

  const response = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          yield* Effect.logError("Unexpected error in /api/agent/analyze", { defect });
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
