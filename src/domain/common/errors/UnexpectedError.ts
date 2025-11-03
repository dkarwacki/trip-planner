/**
 * UnexpectedError represents defects - unexpected failures that occur during program execution.
 * These are different from expected errors (validation, API failures, etc.) which are modeled
 * in the error channel of Effect.
 *
 * Examples: bugs, out-of-memory errors, network failures, unhandled exceptions
 *
 * This error is used in catchAllDefect handlers at API boundaries to convert defects
 * into a trackable error type.
 */
export class UnexpectedError {
  readonly _tag = "UnexpectedError";
  constructor(
    readonly message: string,
    readonly defect?: unknown
  ) {}
}
