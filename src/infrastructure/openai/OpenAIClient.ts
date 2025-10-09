import { Effect, Context, Layer } from "effect";
import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions";
import { ConfigService } from "@/infrastructure/config";
import { AgentError, ModelResponseError } from "@/domain/errors";
import { ToolName, ToolCallId } from "@/domain/models";
import { tools } from "./tools";

export interface ChatCompletionRequest {
  messages: ChatCompletionMessageParam[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: {
    type: "json_object";
  };
}

export interface ToolCall {
  id: ToolCallId;
  name: ToolName;
  arguments: string;
}

export interface ChatCompletionResponse {
  content: string | null;
  toolCalls?: ToolCall[];
  finishReason: string | null;
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
        "HTTP-Referer": "https://trip-planner.dev", // Optional: your site URL
        "X-Title": "Trip Planner AI", // Optional: your app name
      },
    });

    return {
      chatCompletion: (request: ChatCompletionRequest) =>
        Effect.gen(function* () {
          const params: ChatCompletionCreateParamsNonStreaming = {
            model,
            messages: request.messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 2000,
            tools,
            tool_choice: "auto",
          };

          // Add response format for JSON mode if requested
          if (request.responseFormat) {
            params.response_format = request.responseFormat;
          }

          yield* Effect.logDebug("Calling OpenRouter API", {
            model,
            messageCount: request.messages.length,
          });

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

          const message = choice.message;

          // Extract tool calls if present with branded types
          const toolCalls = message.tool_calls
            ?.filter((call): call is Extract<typeof call, { type: "function" }> => call.type === "function")
            .map((call) => ({
              id: ToolCallId(call.id),
              name: ToolName(call.function.name),
              arguments: call.function.arguments,
            }));

          yield* Effect.logDebug("OpenRouter response received", {
            hasContent: !!message.content,
            toolCallsCount: toolCalls?.length ?? 0,
            finishReason: choice.finish_reason,
          });

          return {
            content: message.content,
            toolCalls,
            finishReason: choice.finish_reason,
          };
        }),
    };
  })
);
