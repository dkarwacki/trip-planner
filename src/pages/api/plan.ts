import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { TravelPlanningChat, ChatRequestInputSchema } from "@/application/chat";
import { ValidationError } from "@/infrastructure/http/validation";
import { toHttpResponse } from "@/infrastructure/http/response-mappers";
import { AppRuntime } from "@/infrastructure/runtime";
import { UnexpectedError } from "@/domain/errors";

export const prerender = false;

const validateRequest = (body: unknown) =>
  Effect.gen(function* () {
    const result = ChatRequestInputSchema.safeParse(body);

    if (!result.success) {
      return yield* Effect.fail(new ValidationError(result.error));
    }

    return result.data;
  });

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  const program = Effect.gen(function* () {
    const input = yield* validateRequest(body);
    const response = yield* TravelPlanningChat(input);
    return response;
  });

  const response = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          yield* Effect.logError("Unexpected error in /api/plan", { defect });
          return yield* Effect.fail(new UnexpectedError("Internal server error", defect));
        })
      ),
      Effect.match({
        onFailure: (error) => toHttpResponse(error),
        onSuccess: (data) => toHttpResponse(data as unknown as Parameters<typeof toHttpResponse>[0], data),
      })
    )
  );

  return response;
};
