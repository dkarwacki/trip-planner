import { Effect, Either, Option, Array } from "effect";
import {
  OpenAIClient,
  type ToolCall,
  type ChatCompletionResponse,
  type IOpenAIClient,
} from "@/infrastructure/common/openai";
import { getTopAttractions, getTopRestaurants } from "@/application/map/attractions";
import { TextSearchCache } from "@/infrastructure/map/cache";
import type { SuggestNearbyAttractionsCommand } from "@/domain/map/models";
import { Latitude, Longitude } from "@/domain/common/models";
import type { AgentResponseDTO } from "@/infrastructure/map/api";
import { AgentResponseSchema } from "@/infrastructure/map/api";
import { InvalidToolCallError, ModelResponseError } from "@/domain/common/errors";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { parseAndValidateJson } from "@/infrastructure/common/http/json-parsing";

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
export const suggestNearbyAttractions = (cmd: SuggestNearbyAttractionsCommand) =>
  Effect.gen(function* () {
    const openai = yield* OpenAIClient;

    const planContext = buildPlanContext(cmd);
    const messages = buildInitialMessages(cmd, planContext);

    // Store scored results from tool calls to preserve domain scores
    const scoredAttractions = new Map<string, { score: number; breakdown: { qualityScore: number; diversityScore?: number; confidenceScore: number } }>();

    // First call: use tools to gather data (no JSON mode yet - let model choose to call tools)
    let response = yield* openai.chatCompletion({
      messages,
      temperature: 0.7,
      maxTokens: 8192,
      tools: tools,
    });

    const maxToolCallIterations = 5;
    let iterations = 0;

    // Process tool calls until model is ready to provide final answer
    while (response.toolCalls && response.toolCalls.length > 0 && iterations < maxToolCallIterations) {
      iterations++;
      response = yield* handleToolCallIteration(messages, response, openai, cmd.mapCoordinates, scoredAttractions);
    }

    if (!response.content) {
      return yield* Effect.fail(new ModelResponseError("No content in final response"));
    }

    const validated = yield* parseAndValidateJson(response.content, AgentResponseSchema);
    const enrichedSuggestions = yield* enrichSuggestionsWithAttractionData(validated, scoredAttractions);

    return {
      ...validated,
      suggestions: enrichedSuggestions,
    };
  });

/**
 * Builds a JSON string representation of the plan context
 */
const buildPlanContext = (cmd: SuggestNearbyAttractionsCommand): string => {
  return JSON.stringify(
    {
      place: {
        id: cmd.place.id,
        name: cmd.place.name,
        plannedAttractions: cmd.place.plannedAttractions.map((a) => ({
          name: a.name,
          rating: a.rating,
          userRatingsTotal: a.userRatingsTotal,
          types: a.types,
        })),
        plannedRestaurants: cmd.place.plannedRestaurants.map((r) => ({
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
  cmd: SuggestNearbyAttractionsCommand,
  planContext: string
): ChatCompletionMessageParam[] => {
  const userMessage = cmd.userMessage || "Suggest new attractions and restaurants for this place.";

  return [
    { role: "system", content: SYSTEM_PROMPT },
    ...cmd.conversationHistory.map(
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
  mapCoordinates: { lat: Latitude; lng: Longitude },
  scoredAttractions: Map<string, { score: number; breakdown: { qualityScore: number; diversityScore?: number; confidenceScore: number } }>
) =>
  Effect.gen(function* () {
    if (!response.toolCalls || response.toolCalls.length === 0) {
      return response;
    }

    const toolResults = yield* Effect.all(
      response.toolCalls.map((toolCall) => executeToolCall(toolCall, mapCoordinates, scoredAttractions)),
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

    // Subsequent calls: continue allowing tool calls or final JSON response
    return yield* openai.chatCompletion({
      messages,
      temperature: 0.7,
      maxTokens: 8192,
      tools: tools,
    });
  });

const enrichSuggestionsWithAttractionData = (
  validated: AgentResponseDTO,
  scoredAttractions: Map<string, { score: number; breakdown: { qualityScore: number; diversityScore?: number; confidenceScore: number } }>
): Effect.Effect<AgentResponseDTO["suggestions"], never, TextSearchCache> =>
  Effect.gen(function* () {
    const textSearchCache = yield* TextSearchCache;

    const suggestionOptions = yield* Effect.all(
      validated.suggestions.map((suggestion) =>
        Effect.gen(function* () {
          if (suggestion.type === "general_tip") {
            return Option.some(suggestion);
          }

          if (suggestion.attractionName) {
            const attraction = yield* textSearchCache
              .get({
                query: suggestion.attractionName,
                includePhotos: true,
                requireRatings: true, // Attractions should have ratings
              })
              .pipe(Effect.either);

            return Either.match(attraction, {
              onLeft: () => Option.none(),
              onRight: (attractionData) => {
                // Get scored data for this attraction (matched by name)
                const scoreData = scoredAttractions.get(attractionData.name);

                return Option.some({
                  ...suggestion,
                  attractionData: {
                    ...attractionData,
                    score: scoreData?.score,
                    breakdown: scoreData?.breakdown,
                  },
                  photos: attractionData.photos,
                });
              },
            });
          }

          return Option.none();
        })
      ),
      { concurrency: 3 }
    );

    return Array.getSomes(suggestionOptions);
  });

const executeToolCall = (
  toolCall: ToolCall,
  mapCoordinates: { lat: Latitude; lng: Longitude },
  scoredAttractions: Map<string, { score: number; breakdown: { qualityScore: number; diversityScore?: number; confidenceScore: number } }>
) =>
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

          // Store scores for later enrichment
          result.forEach((item) => {
            scoredAttractions.set(item.attraction.name, {
              score: item.score,
              breakdown: item.breakdown,
            });
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

          // Store scores for later enrichment
          result.forEach((item) => {
            scoredAttractions.set(item.attraction.name, {
              score: item.score,
              breakdown: item.breakdown,
            });
          });

          return JSON.stringify({ restaurants: result });
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
