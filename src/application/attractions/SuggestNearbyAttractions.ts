import { Effect, Either, Option, Array } from "effect";
import { OpenAIClient, type ToolCall, type ChatCompletionResponse, type IOpenAIClient } from "@/infrastructure/openai";
import { getTopAttractions, getTopRestaurants } from "@/application/attractions";
import { getPlaceDetails } from "@/application/places";
import { GoogleMapsClient } from "@/infrastructure/google-maps";
import type { SuggestNearbyAttractionsInput } from "./inputs";
import { AgentResponseSchema, type AgentResponse, type Suggestion } from "./outputs";
import { InvalidToolCallError, ModelResponseError } from "@/domain/errors";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { parseAndValidateJson } from "@/infrastructure/http/json-parsing";

const SYSTEM_PROMPT = `You are an expert local attractions assistant. Your role is to suggest attractions and restaurants near specific locations based on user preferences.

## Your Task

You must use the searchAttractions and searchRestaurants tools to discover real places near the given location, then provide structured recommendations that help different types of travelers make informed decisions.

## Instructions

1. **Research Phase**: Use the searchAttractions and searchRestaurants tools to find real, highly-rated places near the location.

2. **Analysis Phase**: Before providing recommendations, conduct your comprehensive planning inside "_thinking" array. In your planning, work through:
   - **Tool Results Summary**: Document the key attractions and restaurants you found, noting names, ratings, and key features for each
   - **Tiered Recommendation Strategy**: Categorize options as must-sees, highly recommended if you have time, and hidden gems for longer stays

3. **Recommendation Phase**: Select 5 of the best attractions with at least 1 hidden gem and 2 of the best restaurants from your tool results.

## Critical Requirements

- You MUST use the searchAttractions and searchRestaurants tools before making any suggestions
- You MUST only suggest places that appear in your tool results
- For attraction and restaurant suggestions, you MUST include the exact name from the tool results in the "attractionName" field
- You MUST include at least 1 hidden gem in your suggestions
- You MUST include at most 2 restaurants in your suggestions
- You MUST respond with ONLY valid JSON after your analysis - no additional text before or after
- Consider variety and ratings when selecting suggestions

## Output Format

After your analysis, provide your response as valid JSON in exactly this structure:

{
  "_thinking": ["step 1 of your reasoning", "step 2 of your reasoning", "etc."],
  "suggestions": [
    {
      "type": "add_attraction",
      "reasoning": "why this attraction fits specific traveler types and what makes it valuable",
      "attractionName": "Exact Place Name from tool results"
    },
    {
      "type": "add_restaurant", 
      "reasoning": "why this restaurant is recommended and for which travelers",
      "attractionName": "Exact Restaurant Name from tool results"
    },
    {
      "type": "general_tip",
      "reasoning": "practical travel advice, timing tips, or decision frameworks (no attractionName needed)"
    }
  ],
  "summary": "brief overview of recommendations and key insights"
}

**Suggestion Types:**
- "add_attraction": For tourist attractions, landmarks, activities (requires exact attractionName from tools)
- "add_restaurant": For restaurants, cafes, food venues (requires exact attractionName from tools) 
- "general_tip": For travel advice, timing recommendations, logistical tips (no attractionName needed)`;

/**
 * Main agent use case - suggests nearby attractions and restaurants based on user preferences
 */
export const suggestNearbyAttractions = (input: SuggestNearbyAttractionsInput) =>
  Effect.gen(function* () {
    const openai = yield* OpenAIClient;

    const tripContext = buildTripContext(input);
    const messages = buildInitialMessages(input, tripContext);

    // Note: Don't use responseFormat for Claude models - they need explicit prompting instead
    let response = yield* openai.chatCompletion({
      messages,
      temperature: 0.7,
      maxTokens: 8192,
    });

    const maxToolCallIterations = 5;
    let iterations = 0;

    while (response.toolCalls && response.toolCalls.length > 0 && iterations < maxToolCallIterations) {
      iterations++;
      response = yield* handleToolCallIteration(messages, response, openai);
    }

    if (!response.content) {
      return yield* Effect.fail(new ModelResponseError("No content in final response"));
    }

    const validated = yield* parseAndValidateJson(response.content, AgentResponseSchema);
    const enrichedSuggestions = yield* enrichSuggestionsWithAttractionData(validated);

    return {
      ...validated,
      suggestions: enrichedSuggestions,
    };
  });

/**
 * Builds a JSON string representation of the trip context
 */
const buildTripContext = (input: SuggestNearbyAttractionsInput): string => {
  return JSON.stringify(
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
};

/**
 * Constructs the initial messages array with system prompt, conversation history, and user request
 */
const buildInitialMessages = (
  input: SuggestNearbyAttractionsInput,
  tripContext: string
): ChatCompletionMessageParam[] => {
  const userMessage = input.userMessage || "Suggest new attractions and restaurants for this place.";

  return [
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
      content: `Here is my current trip plan:\n\n${tripContext}\n\n${userMessage}.`,
    },
  ];
};

/**
 * Handles a single iteration of tool calls: executes tools, appends results to messages, and gets new response
 */
const handleToolCallIteration = (
  messages: ChatCompletionMessageParam[],
  response: ChatCompletionResponse,
  openai: IOpenAIClient
) =>
  Effect.gen(function* () {
    if (!response.toolCalls || response.toolCalls.length === 0) {
      return response;
    }

    const toolResults = yield* Effect.all(
      response.toolCalls.map((toolCall) => executeToolCall(toolCall)),
      { concurrency: 3 }
    );

    messages.push({
      role: "assistant",
      content: response.content,
      tool_calls: response.toolCalls.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: {
          name: tc.name,
          arguments: tc.arguments,
        },
      })),
    });

    toolResults.forEach((result, index) => {
      const toolCall = response.toolCalls?.[index];
      if (toolCall) {
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }
    });

    return yield* openai.chatCompletion({
      messages,
      temperature: 0.7,
      maxTokens: 8192,
    });
  });

/**
 * Enriches suggestions with full attraction data from Google Maps
 */
const enrichSuggestionsWithAttractionData = (
  validated: AgentResponse
): Effect.Effect<Suggestion[], never, GoogleMapsClient> =>
  Effect.gen(function* () {
    const googleMaps = yield* GoogleMapsClient;

    const suggestionOptions = yield* Effect.all(
      validated.suggestions.map((suggestion) =>
        Effect.gen(function* () {
          // General tips don't need attraction data
          if (suggestion.type === "general_tip") {
            return Option.some(suggestion);
          }

          if (suggestion.attractionName) {
            const attraction = yield* Effect.either(googleMaps.textSearch(suggestion.attractionName));

            return Either.match(attraction, {
              onLeft: () => Option.none(), // Filter out failed lookups
              onRight: (attractionData) => Option.some({ ...suggestion, attractionData }),
            });
          }

          // Filter out attractions/restaurants without names
          return Option.none();
        })
      ),
      { concurrency: 3 }
    );

    return Array.getSomes(suggestionOptions);
  });

const executeToolCall = (toolCall: ToolCall) =>
  Effect.gen(function* () {
    try {
      const args = JSON.parse(toolCall.arguments);
      // Branded types are compatible with their underlying types
      const toolName = toolCall.name;

      switch (toolName) {
        case "searchAttractions": {
          const result = yield* getTopAttractions({
            lat: args.lat,
            lng: args.lng,
            radius: args.radius ?? 2000,
            limit: args.limit ?? 10,
          });
          return JSON.stringify({ attractions: result });
        }

        case "searchRestaurants": {
          const result = yield* getTopRestaurants({
            lat: args.lat,
            lng: args.lng,
            radius: args.radius ?? 2000,
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
      return yield* Effect.fail(
        new InvalidToolCallError(`Failed to execute tool: ${toolCall.name}`, toolCall.name, error)
      );
    }
  });
