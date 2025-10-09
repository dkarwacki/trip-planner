import { Effect } from "effect";
import { z } from "zod";
import { OpenAIClient, type ToolCall } from "@/infrastructure/openai";
import { getTopAttractions, getTopRestaurants } from "@/application/attractions";
import { getPlaceDetails } from "@/application/places";
import type { AnalyzeTripPlanInput } from "./inputs";
import { InvalidToolCallError, ModelResponseError } from "@/domain/errors";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Response schema with chain-of-thought reasoning
const SuggestionSchema = z.object({
  type: z.enum(["add_attraction", "add_restaurant", "general_tip"]),
  reasoning: z.string(),
  attractionData: z
    .object({
      id: z.string(),
      name: z.string(),
      rating: z.number(),
      userRatingsTotal: z.number(),
      types: z.array(z.string()),
      vicinity: z.string(),
      priceLevel: z.number().optional(),
      openNow: z.boolean().optional(),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
    })
    .passthrough() // Allow extra fields that Claude might add
    .optional(),
});

export const AgentResponseSchema = z.object({
  _thinking: z.array(z.string()).describe("Step-by-step reasoning before making suggestions"),
  suggestions: z.array(SuggestionSchema),
  summary: z.string(),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

const SYSTEM_PROMPT = `You are an expert trip planning assistant. Your role is to analyze user's trip plans and suggest attractions and restaurants for specific places.

CRITICAL RULES:
1. You MUST use the searchAttractions and searchRestaurants tools to find REAL places. NEVER make up fake place IDs or data.
2. You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON.
3. When suggesting add_attraction or add_restaurant, you MUST include the attractionData field with complete data from tool responses.
4. ONLY suggest attractions/restaurants that are returned by the tool calls.
5. For general_tip suggestions (travel advice, timing tips, etc.), you don't need attractionData.

Response Format (YOU MUST FOLLOW THIS EXACTLY):
{
  "_thinking": ["step 1", "step 2", ...],
  "suggestions": [
    {
      "type": "add_attraction",
      "reasoning": "why this attraction is a good fit",
      "attractionData": {
        "id": "place_id_from_tool",
        "name": "Place Name",
        "rating": 4.5,
        "userRatingsTotal": 1000,
        "types": ["tourist_attraction"],
        "vicinity": "address",
        "priceLevel": 2,
        "openNow": true,
        "location": { "lat": 0.0, "lng": 0.0 }
      }
    },
    {
      "type": "general_tip",
      "reasoning": "useful travel advice without specific place recommendation"
    }
  ],
  "summary": "brief summary"
}

Analysis Guidelines:
1. In "_thinking": analyze the trip, identify what types of places would enhance the experience
2. Call searchAttractions and searchRestaurants tools to find top-rated places near the location
3. Select 3-5 best attractions or restaurants that complement what's already planned
4. For each place suggestion, use type "add_attraction" for tourist attractions or "add_restaurant" for restaurants
5. ALWAYS include the complete attractionData object from the tool response for add suggestions
6. Use "general_tip" for travel advice, timing recommendations, or general tips (no attractionData needed)
7. Provide clear reasoning for each suggestion
8. Consider variety, ratings, and proximity when making suggestions`;

/**
 * Main agent use case - analyzes trip plan and returns suggestions
 */
export const analyzeTripPlan = (input: AnalyzeTripPlanInput) =>
  Effect.gen(function* () {
    const openai = yield* OpenAIClient;

    // Build the initial message with trip context
    const tripContext = JSON.stringify(
      {
        places: input.places.map((p) => ({
          id: p.id,
          name: p.name,
          location: { lat: p.lat, lng: p.lng },
          plannedAttractions: p.plannedAttractions.map((a) => ({
            name: a.name,
            rating: a.rating,
            userRatingsTotal: a.userRatingsTotal,
            types: a.types,
          })),
          plannedRestaurants: p.plannedRestaurants.map((r) => ({
            name: r.name,
            rating: r.rating,
            userRatingsTotal: r.userRatingsTotal,
            types: r.types,
            priceLevel: r.priceLevel,
          })),
        })),
      },
      null,
      2
    );

    const userMessage = input.userMessage || "Suggest new attractions and restaurants for this place.";

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...input.conversationHistory.map(
        (msg) =>
          ({
            role: msg.role,
            content: msg.content,
          }) as ChatCompletionMessageParam
      ),
      {
        role: "user",
        content: `Here is my current trip plan:\n\n${tripContext}\n\n${userMessage}`,
      },
    ];

    yield* Effect.logInfo("Starting trip analysis", {
      placesCount: input.places.length,
      historyLength: input.conversationHistory.length,
    });

    // Initial AI call
    // Note: Don't use responseFormat for Claude models - they need explicit prompting instead
    let response = yield* openai.chatCompletion({
      messages,
      temperature: 0.7,
      maxTokens: 3000,
    });

    // Handle tool calls in a loop
    const maxToolCallIterations = 5;
    let iterations = 0;

    while (response.toolCalls && response.toolCalls.length > 0 && iterations < maxToolCallIterations) {
      iterations++;

      yield* Effect.logDebug("Processing tool calls", {
        count: response.toolCalls.length,
        iteration: iterations,
      });

      // Execute all tool calls
      const toolResults = yield* Effect.all(
        response.toolCalls.map((toolCall) => executeToolCall(toolCall)),
        { concurrency: 3 }
      );

      // Add assistant message with tool calls
      // Note: We need to extract the underlying string values from branded types for OpenAI API
      messages.push({
        role: "assistant",
        content: response.content,
        tool_calls: response.toolCalls.map((tc) => ({
          id: tc.id as string, // Cast branded type to string for OpenAI API
          type: "function" as const,
          function: {
            name: tc.name as string, // Cast branded type to string for OpenAI API
            arguments: tc.arguments,
          },
        })),
      });

      // Add tool results as messages
      toolResults.forEach((result, index) => {
        messages.push({
          role: "tool",
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          tool_call_id: response.toolCalls![index].id as string, // Cast branded type to string for OpenAI API
          content: result,
        });
      });

      // Continue conversation with tool results
      // Note: Don't use responseFormat for Claude models - they need explicit prompting instead
      response = yield* openai.chatCompletion({
        messages,
        temperature: 0.7,
        maxTokens: 3000,
      });
    }

    // Parse final response
    if (!response.content) {
      return yield* Effect.fail(new ModelResponseError("No content in final response"));
    }

    yield* Effect.logDebug("Received response from AI", {
      contentLength: response.content.length,
      finishReason: response.finishReason,
    });

    try {
      // Try to extract JSON from response (Claude sometimes includes extra text)
      let jsonContent = response.content.trim();

      // Try to find JSON object boundaries
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonContent);

      // Try validation with detailed error reporting
      const validationResult = AgentResponseSchema.safeParse(parsed);

      if (!validationResult.success) {
        yield* Effect.logError("Schema validation failed", {
          errors: validationResult.error.errors,
          parsedData: JSON.stringify(parsed).substring(0, 1000),
        });
        return yield* Effect.fail(
          new ModelResponseError(
            `Schema validation failed: ${validationResult.error.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", ")}`,
            validationResult.error
          )
        );
      }

      const validated = validationResult.data;

      yield* Effect.logInfo("Trip analysis completed", {
        suggestionsCount: validated.suggestions.length,
        thinkingSteps: validated._thinking.length,
      });

      return validated;
    } catch (error) {
      yield* Effect.logError("Failed to parse agent response", {
        error: error instanceof Error ? error.message : String(error),
        responseContent: response.content.substring(0, 1000), // Log first 1000 chars
        parseError: error,
      });
      return yield* Effect.fail(new ModelResponseError("Invalid response format from AI", error));
    }
  });

/**
 * Execute a tool call by routing to the appropriate Effect service
 */
const executeToolCall = (toolCall: ToolCall) =>
  Effect.gen(function* () {
    try {
      const args = JSON.parse(toolCall.arguments);
      // Extract the underlying string from the branded type for switch statement
      const toolName = toolCall.name as string;

      switch (toolName) {
        case "searchAttractions": {
          const result = yield* getTopAttractions({
            lat: args.lat,
            lng: args.lng,
            radius: args.radius ?? 1500,
            limit: args.limit ?? 10,
          });
          return JSON.stringify({ attractions: result });
        }

        case "searchRestaurants": {
          const result = yield* getTopRestaurants({
            lat: args.lat,
            lng: args.lng,
            radius: args.radius ?? 1500,
            limit: args.limit ?? 10,
          });
          return JSON.stringify({ restaurants: result });
        }

        case "getPlaceDetails": {
          const result = yield* getPlaceDetails({ placeId: args.placeId });
          return JSON.stringify({ place: result });
        }

        default:
          return yield* Effect.fail(new InvalidToolCallError(`Unknown tool: ${toolName}`, toolCall.name));
      }
    } catch (error) {
      yield* Effect.logError("Tool call execution failed", {
        tool: toolCall.name,
        error,
      });
      return yield* Effect.fail(
        new InvalidToolCallError(`Failed to execute tool: ${toolCall.name}`, toolCall.name, error)
      );
    }
  });
