import { Effect } from "effect";
import type { z } from "zod";
import { ModelResponseError } from "@/domain/common/errors";

/**
 * Extracts JSON from potentially messy AI response and validates with Zod schema.
 * Handles cases where AI models include extra text before/after JSON.
 * Works with schemas that include transforms, properly inferring the output type.
 */
export const parseAndValidateJson = <Output>(content: string, schema: z.ZodType<Output, z.ZodTypeDef, unknown>) =>
  Effect.gen(function* () {
    try {
      // Claude sometimes includes extra text, extract JSON boundaries
      let jsonContent = content.trim();

      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonContent);
      const validationResult = schema.safeParse(parsed);

      if (!validationResult.success) {
        return yield* Effect.fail(
          new ModelResponseError(
            `Schema validation failed: ${validationResult.error.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", ")}`,
            validationResult.error
          )
        );
      }

      return validationResult.data;
    } catch (error) {
      return yield* Effect.fail(new ModelResponseError("Invalid JSON format", error));
    }
  });
