import { z } from "zod";

export class ValidationError {
  readonly _tag = "ValidationError";
  constructor(readonly errors: z.ZodError) {}
}
