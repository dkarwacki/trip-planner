import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { TravelPlanningChat, ChatRequestInputSchema } from "@/application/plan";
import { ValidationError } from "@/infrastructure/common/http/validation";
import { toHttpResponse } from "@/infrastructure/common/http/response-mappers";
import { AppRuntime } from "@/infrastructure/common/runtime";
import { UnexpectedError } from "@/domain/common/errors";

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

  const result = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          yield* Effect.logError("Unexpected error in /api/plan", { defect });
          return yield* Effect.fail(new UnexpectedError("Internal server error", defect));
        })
      ),
      Effect.either
    )
  );

  if (result._tag === "Left") {
    return toHttpResponse(result.left as Parameters<typeof toHttpResponse>[0]);
  }

  // Success case - create response directly
  return new Response(
    JSON.stringify({
      success: true,
      ...result.right,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
