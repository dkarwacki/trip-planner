import type { ToolName } from "@/domain/models";

export class AgentError {
  readonly _tag = "AgentError";
  constructor(
    readonly message: string,
    readonly cause?: unknown
  ) {}
}

export class InvalidToolCallError {
  readonly _tag = "InvalidToolCallError";
  constructor(
    readonly message: string,
    readonly toolName: ToolName,
    readonly cause?: unknown
  ) {}
}

export class ModelResponseError {
  readonly _tag = "ModelResponseError";
  constructor(
    readonly message: string,
    readonly cause?: unknown
  ) {}
}
