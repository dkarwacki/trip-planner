import type { APIRoute } from "astro";
import { Effect, Runtime } from "effect";
import {
  UpdatePersonasCommandSchema,
  type GetUserPersonasResponseDTO,
} from "@/infrastructure/plan/api";
import { UserPersonasRepository } from "@/infrastructure/plan/database";
import { ValidationError } from "@/infrastructure/common/http/validation";
import { toHttpResponse } from "@/infrastructure/common/http/response-mappers";
import { AppRuntime } from "@/infrastructure/common/runtime";
import { UnexpectedError } from "@/domain/common/errors";

export const prerender = false;

// Hardcoded user ID for development (TODO: Replace with real auth)
const DEV_USER_ID = "0bbf70aa-4389-428d-b127-6cf505535dd7";

const validateRequest = (body: unknown) =>
  Effect.gen(function* () {
    const result = UpdatePersonasCommandSchema.safeParse(body);

    if (!result.success) {
      return yield* Effect.fail(new ValidationError(result.error));
    }

    return result.data;
  });

/**
 * GET /api/personas
 * Load user's persona preferences
 * Returns empty array if none set
 */
export const GET: APIRoute = async () => {
  const program = Effect.gen(function* () {
    const repo = yield* UserPersonasRepository;
    const data = yield* repo.find(DEV_USER_ID);

    // If no personas found, return empty array
    if (!data) {
      const emptyResponse: GetUserPersonasResponseDTO = {
        user_id: DEV_USER_ID,
        persona_types: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return emptyResponse;
    }

    // Map DAO to response DTO
    const response: GetUserPersonasResponseDTO = {
      user_id: data.userId,
      persona_types: data.personaTypes,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
    };

    return response;
  });

  const result = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          console.error("[API /api/personas GET] Defect caught:", defect);
          yield* Effect.logError("Unexpected error in GET /api/personas", { defect });
          return yield* Effect.fail(new UnexpectedError("Internal server error", defect));
        })
      ),
      Effect.either
    )
  );

  if (result._tag === "Left") {
    console.error("[API /api/personas GET] Request failed:", result.left);
    return toHttpResponse(result.left as Parameters<typeof toHttpResponse>[0]);
  }

  return new Response(JSON.stringify(result.right), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * PUT /api/personas
 * Update user's persona preferences
 * Creates or updates (upsert)
 */
export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json();

  const program = Effect.gen(function* () {
    const dto = yield* validateRequest(body);
    const repo = yield* UserPersonasRepository;
    yield* repo.save(DEV_USER_ID, dto.persona_types);

    return { success: true };
  });

  const result = await Runtime.runPromise(AppRuntime)(
    program.pipe(
      Effect.catchAllDefect((defect) =>
        Effect.gen(function* () {
          console.error("[API /api/personas PUT] Defect caught:", defect);
          yield* Effect.logError("Unexpected error in PUT /api/personas", { defect });
          return yield* Effect.fail(new UnexpectedError("Internal server error", defect));
        })
      ),
      Effect.either
    )
  );

  if (result._tag === "Left") {
    console.error("[API /api/personas PUT] Request failed:", result.left);
    return toHttpResponse(result.left as Parameters<typeof toHttpResponse>[0]);
  }

  return new Response(JSON.stringify(result.right), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
