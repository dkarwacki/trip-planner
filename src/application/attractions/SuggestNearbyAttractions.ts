import { Effect, Either, Option, Array } from "effect";
import { OpenAIClient, type ToolCall, type ChatCompletionResponse, type IOpenAIClient } from "@/infrastructure/openai";
import { getTopAttractions, getTopRestaurants } from "@/application/attractions";
import { getPlaceDetails } from "@/application/places";
import { GoogleMapsClient } from "@/infrastructure/google-maps";
import type { SuggestNearbyAttractionsInput } from "./inputs";
import { AgentResponseSchema, type AgentResponse, type Suggestion } from "./outputs";
import { InvalidToolCallError, ModelResponseError } from "@/domain/errors";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { parseAndValidateJson } from "@/infrastructure/http/json-parsing";

/**
 * Tool definitions for searching attractions and restaurants near specific coordinates
 */
const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "searchAttractions",
      description:
        "Search for tourist attractions near a specific location. Returns top-rated attractions with scores based on ratings, reviews, and popularity.",
      parameters: {
        type: "object",
        properties: {
          lat: {
            type: "number",
            description: "Latitude of the search center point",
          },
          lng: {
            type: "number",
            description: "Longitude of the search center point",
          },
          radius: {
            type: "number",
            description: "Search radius in meters (default: 2000, min: 100, max: 50000)",
            default: 2000,
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return (default: 10, min: 1, max: 50)",
            default: 10,
          },
        },
        required: ["lat", "lng"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchRestaurants",
      description:
        "Search for restaurants near a specific location. Returns top-rated restaurants with scores based on ratings, reviews, price level, and availability.",
      parameters: {
        type: "object",
        properties: {
          lat: {
            type: "number",
            description: "Latitude of the search center point",
          },
          lng: {
            type: "number",
            description: "Longitude of the search center point",
          },
          radius: {
            type: "number",
            description: "Search radius in meters (default: 2000, min: 100, max: 50000)",
            default: 2000,
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return (default: 10, min: 1, max: 50)",
            default: 10,
          },
        },
        required: ["lat", "lng"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getPlaceDetails",
      description:
        "Get detailed information about a specific place using its Google Place ID. Returns comprehensive place data including name, address, location, ratings, and types.",
      parameters: {
        type: "object",
        properties: {
          placeId: {
            type: "string",
            description: "Google Place ID of the location",
          },
        },
        required: ["placeId"],
        additionalProperties: false,
      },
    },
  },
];

const SYSTEM_PROMPT = `You are an expert local attractions assistant. Your role is to suggest attractions and restaurants near specific locations based on user preferences.

## Your Task

You must use the searchAttractions and searchRestaurants tools to discover real places near the given location, then provide structured recommendations that help different types of travelers make informed decisions.

## Instructions

1. **Research Phase**: Use the searchAttractions and searchRestaurants tools to find real, highly-rated places near the location.

2. **Analysis Phase**: Before providing recommendations, conduct your comprehensive planning inside "_thinking" array. In your planning, work through:
   - **Tool Results Summary**: Document the key attractions and restaurants you found, noting names, ratings, and key features for each
   - **Tiered Recommendation Strategy**: Categorize options into three priority levels:
     * **must-see**: Essential attractions/restaurants that are iconic, highly-rated, or central to the destination's identity
     * **highly recommended**: Excellent options worth visiting if you have time, offering great value or unique experiences
     * **hidden gem**: Lesser-known but exceptional places perfect for longer stays or travelers seeking authentic local experiences

3. **Recommendation Phase**: Select 5 of the best attractions with at least 1 hidden gem and 2 of the best restaurants from your tool results.

## Critical Requirements

- You MUST use the searchAttractions and searchRestaurants tools before making any suggestions
- You MUST only suggest places that appear in your tool results
- For attraction and restaurant suggestions, you MUST include the exact name from the tool results in the "attractionName" field
- For attraction and restaurant suggestions, you MUST include a "priority" field with one of: "must-see", "highly recommended", or "hidden gem"
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
      "attractionName": "Exact Place Name from tool results",
      "priority": "must-see"
    },
    {
      "type": "add_restaurant", 
      "reasoning": "why this restaurant is recommended and for which travelers",
      "attractionName": "Exact Restaurant Name from tool results",
      "priority": "highly recommended"
    },
    {
      "type": "general_tip",
      "reasoning": "practical travel advice, timing tips, or decision frameworks (no attractionName needed)"
    }
  ],
  "summary": "brief overview of recommendations and key insights"
}

**Suggestion Types:**
- "add_attraction": For tourist attractions, landmarks, activities (requires exact attractionName from tools and priority field)
- "add_restaurant": For restaurants, cafes, food venues (requires exact attractionName from tools and priority field) 
- "general_tip": For travel advice, timing recommendations, logistical tips (no attractionName or priority needed)

**Priority Levels:**
- "must-see": Essential attractions/restaurants that are iconic, highly-rated, or central to the destination's identity
- "highly recommended": Excellent options worth visiting if you have time, offering great value or unique experiences
- "hidden gem": Lesser-known but exceptional places perfect for longer stays or travelers seeking authentic local experiences`;

/**
 * Main agent use case - suggests nearby attractions and restaurants based on user preferences
 */
export const suggestNearbyAttractions = (input: SuggestNearbyAttractionsInput) =>
  Effect.gen(function* () {
    const openai = yield* OpenAIClient;

    const planContext = buildPlanContext(input);
    const messages = buildInitialMessages(input, planContext);

    // Note: Don't use responseFormat for Claude models - they need explicit prompting instead
    let response = yield* openai.chatCompletion({
      messages,
      temperature: 0.7,
      maxTokens: 8192,
      tools: tools,
    });

    const maxToolCallIterations = 5;
    let iterations = 0;

    while (response.toolCalls && response.toolCalls.length > 0 && iterations < maxToolCallIterations) {
      iterations++;
      response = yield* handleToolCallIteration(messages, response, openai, input.mapCoordinates);
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
 * Builds a JSON string representation of the plan context
 */
const buildPlanContext = (input: SuggestNearbyAttractionsInput): string => {
  return JSON.stringify(
    {
      place: {
        id: input.place.id,
        name: input.place.name,
        plannedAttractions: input.place.plannedAttractions.map((a) => ({
          name: a.name,
          rating: a.rating,
          userRatingsTotal: a.userRatingsTotal,
          types: a.types,
        })),
        plannedRestaurants: input.place.plannedRestaurants.map((r) => ({
          name: r.name,
          rating: r.rating,
          userRatingsTotal: r.userRatingsTotal,
          types: r.types,
          priceLevel: r.priceLevel,
        })),
      },
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
  planContext: string
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
      content: `Here is my current travel plan:\n\n${planContext}\n\n${userMessage}.`,
    },
  ];
};

/**
 * Handles a single iteration of tool calls: executes tools, appends results to messages, and gets new response
 */
const handleToolCallIteration = (
  messages: ChatCompletionMessageParam[],
  response: ChatCompletionResponse,
  openai: IOpenAIClient,
  mapCoordinates: { lat: number; lng: number }
) =>
  Effect.gen(function* () {
    if (!response.toolCalls || response.toolCalls.length === 0) {
      return response;
    }

    const toolResults = yield* Effect.all(
      response.toolCalls.map((toolCall) => executeToolCall(toolCall, mapCoordinates)),
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
      tools: tools,
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

const executeToolCall = (toolCall: ToolCall, mapCoordinates: { lat: number; lng: number }) =>
  Effect.gen(function* () {
    try {
      const args = JSON.parse(toolCall.arguments);
      // Branded types are compatible with their underlying types
      const toolName = toolCall.name;

      switch (toolName) {
        case "searchAttractions": {
          // Override coordinates with mapCoordinates - AI thinks it's choosing, but we use map center
          const result = yield* getTopAttractions({
            lat: mapCoordinates.lat,
            lng: mapCoordinates.lng,
            radius: args.radius ?? 2000,
            limit: args.limit ?? 15,
          });
          return JSON.stringify({ attractions: result });
        }

        case "searchRestaurants": {
          // Override coordinates with mapCoordinates - AI thinks it's choosing, but we use map center
          const result = yield* getTopRestaurants({
            lat: mapCoordinates.lat,
            lng: mapCoordinates.lng,
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
