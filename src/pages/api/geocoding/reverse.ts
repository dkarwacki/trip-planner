import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import { ReverseGeocode, ReverseGeocodeInputSchema } from "@/application/geocoding";
import { ValidationError } from "@/infrastructure/http/validation";
import { toHttpResponse } from "@/infrastructure/http/response-mappers";
import { AppRuntime } from "@/infrastructure/runtime";
import { UnexpectedError } from "@/domain/errors";

export const prerender = false;

const validateRequest = (body: unknown) =>
  Effect.gen(function* () {
    const result = ReverseGeocodeInputSchema.safeParse(body);

    if (!result.success) {
      return yield* Effect.fail(new ValidationError(result.error));
    }

    return result.data;
  });

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  const program = Effect.gen(function* () {
    const input = yield* validateRequest(body);
    const place = yield* ReverseGeocode(input);
    return { place };
  });

  const response = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          yield* Effect.logError("Unexpected error in /api/geocoding/reverse", { defect });
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
