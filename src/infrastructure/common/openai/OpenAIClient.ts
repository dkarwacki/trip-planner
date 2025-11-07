import { Effect, Context, Layer } from "effect";
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionTool,
  ChatCompletionMessage,
} from "openai/resources/chat/completions";
import { ConfigService } from "@/infrastructure/common/config";
import { AgentError, ModelResponseError } from "@/domain/common/errors";
import { ToolName, ToolCallId } from "@/domain/plan/models";

// Extended types for reasoning models
interface ReasoningParams {
  reasoning_effort?: "low" | "medium" | "high";
}

interface ReasoningMessage extends ChatCompletionMessage {
  reasoning_content?: string;
}

export interface ChatCompletionRequest {
  messages: ChatCompletionMessageParam[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?:
    | { type: "json_object" }
    | {
        type: "json_schema";
        json_schema: {
          name: string;
          strict?: boolean;
          schema: Record<string, unknown>;
        };
      };
  tools?: ChatCompletionTool[];
  reasoningEffort?: "low" | "medium" | "high"; // For reasoning models like Grok
}

export interface ToolCall {
  id: ToolCallId;
  name: ToolName;
  arguments: string;
}

export interface ChatCompletionResponse {
  usage: unknown;
  content: string | null;
  toolCalls?: ToolCall[];
  finishReason: string | null;
  reasoning?: string;
}

export interface IOpenAIClient {
  readonly chatCompletion: (
    request: ChatCompletionRequest
  ) => Effect.Effect<ChatCompletionResponse, AgentError | ModelResponseError>;
}

export class OpenAIClient extends Context.Tag("OpenAIClient")<OpenAIClient, IOpenAIClient>() {}

export const OpenAIClientLive = Layer.effect(
  OpenAIClient,
  Effect.gen(function* () {
    const config = yield* ConfigService;
    const apiKey = yield* config.getOpenRouterApiKey();
    const model = yield* config.getOpenRouterModel();

    // Initialize OpenAI client with OpenRouter configuration
    const client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer": "https://map-planner.dev", // Optional: your site URL
        "X-Title": "Map Planner AI", // Optional: your app name
      },
    });

    return {
      chatCompletion: (request: ChatCompletionRequest) =>
        Effect.gen(function* () {
          const params: ChatCompletionCreateParamsNonStreaming & ReasoningParams = {
            model,
            messages: request.messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 2000,
          };

          // Only add tools if they are provided
          if (request.tools && request.tools.length > 0) {
            params.tools = request.tools;
            params.tool_choice = "auto";
          }

          // Add response format for JSON mode if requested
          if (request.responseFormat) {
            if (request.responseFormat.type === "json_schema") {
              params.response_format = {
                type: "json_schema",
                json_schema: request.responseFormat.json_schema,
              };
            } else {
              params.response_format = request.responseFormat;
            }
          }

          if (request.reasoningEffort) {
            params.reasoning_effort = request.reasoningEffort;
          }

          const completion = yield* Effect.tryPromise({
            try: () => client.chat.completions.create(params),
            catch: (error) => {
              if (error instanceof OpenAI.APIError) {
                // Log detailed error information for debugging
                const errorDetails = {
                  status: error.status,
                  message: error.message,
                  type: error.type,
                  code: error.code,
                  model,
                };
                return new AgentError(`OpenRouter API error (${error.status}): ${error.message}`, {
                  error,
                  details: errorDetails,
                });
              }
              return new AgentError("Failed to communicate with AI model", error);
            },
          });

          const choice = completion.choices[0];

          if (!choice) {
            return yield* Effect.fail(new ModelResponseError("No response choice returned from model"));
          }

          const message = choice.message as ReasoningMessage;

          // Extract tool calls if present with branded types
          const toolCalls = message.tool_calls
            ?.filter((call): call is Extract<typeof call, { type: "function" }> => call.type === "function")
            .map((call) => ({
              id: ToolCallId(call.id),
              name: ToolName(call.function.name),
              arguments: call.function.arguments,
            }));

          // Extract reasoning content if present (for reasoning models)
          const reasoning = message.reasoning_content;

          return {
            content: message.content,
            toolCalls,
            finishReason: choice.finish_reason,
            usage: completion.usage,
            reasoning,
          };
        }),
    };
  })
);
