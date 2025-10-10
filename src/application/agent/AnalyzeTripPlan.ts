import { Effect } from "effect";
import { z } from "zod";
import { OpenAIClient, type ToolCall } from "@/infrastructure/openai";
import { getTopAttractions, getTopRestaurants } from "@/application/attractions";
import { getPlaceDetails } from "@/application/places";
import { GoogleMapsClient } from "@/infrastructure/google-maps";
import type { AnalyzeTripPlanInput } from "./inputs";
import { InvalidToolCallError, ModelResponseError } from "@/domain/errors";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const SuggestionSchema = z.object({
  type: z.enum(["add_attraction", "add_restaurant", "general_tip"]),
  reasoning: z.string(),
  attractionName: z.string().optional(),
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
    .optional(),
});

export const AgentResponseSchema = z.object({
  _thinking: z.array(z.string()).describe("Step-by-step reasoning before making suggestions"),
  suggestions: z.array(SuggestionSchema),
  summary: z.string(),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

const SYSTEM_PROMPT = `You are an expert trip planning assistant. Your role is to analyze locations and provide personalized attraction and restaurant recommendations by searching for real places and organizing them in a structured, helpful way.

## Your Task

You must use the searchAttractions and searchRestaurants tools to discover real places near the given location, then provide structured recommendations that help different types of travelers make informed decisions.

## Instructions

1. **Research Phase**: Use the searchAttractions and searchRestaurants tools to find real, highly-rated places near the location.

2. **Analysis Phase**: Before providing recommendations, conduct your comprehensive planning inside "_thinking" array. In your planning, work through:
   - **Tool Results Summary**: Document the key attractions and restaurants you found, noting names, ratings, and key features for each
   - **Traveler Archetype Analysis**: Consider specific traveler types (history buffs, adventure seekers, nature lovers, first-time visitors) and what each group would most value from your findings
   - **Tiered Recommendation Strategy**: Categorize options as must-sees, highly recommended if you have time, and hidden gems for longer stays
   - **Selection Criteria**: Apply decision frameworks considering what to prioritize with limited time, practical tradeoffs (popular vs authentic, time investment vs payoff, cost considerations), and logistics (time needed, best times to visit, geographic connections, price ranges)
   - **Final Selection Rationale**: Explain which 3-5 places you'll recommend and why they create a well-rounded set of options

It's OK for this section to be quite long.

3. **Recommendation Phase**: Select 3-5 of the best attractions or restaurants from your tool results that complement different traveler needs and preferences.

## Critical Requirements

- You MUST use the searchAttractions and searchRestaurants tools before making any suggestions
- You MUST only suggest places that appear in your tool results
- For attraction and restaurant suggestions, you MUST include the exact name from the tool results in the "attractionName" field
- You MUST respond with ONLY valid JSON after your analysis - no additional text before or after
- Consider variety, ratings, and proximity when selecting suggestions

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
        content: `Here is my current trip plan:\n\n${tripContext}\n\n${userMessage}.`,
      },
    ];

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

      const toolResults = yield* Effect.all(
        response.toolCalls.map((toolCall) => executeToolCall(toolCall)),
        { concurrency: 3 }
      );

      // Extract branded type values for OpenAI API
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

      response = yield* openai.chatCompletion({
        messages,
        temperature: 0.7,
        maxTokens: 8192,
      });
    }

    // Parse final response
    if (!response.content) {
      return yield* Effect.fail(new ModelResponseError("No content in final response"));
    }

    try {
      // Claude sometimes includes extra text, extract JSON boundaries
      let jsonContent = response.content.trim();

      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonContent);
      const validationResult = AgentResponseSchema.safeParse(parsed);

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

      const validated = validationResult.data;

      const googleMaps = yield* GoogleMapsClient;

      const lookupResults = yield* Effect.all(
        validated.suggestions.map((suggestion) =>
          Effect.gen(function* () {
            if (
              (suggestion.type === "add_attraction" || suggestion.type === "add_restaurant") &&
              suggestion.attractionName
            ) {
              const attraction = yield* Effect.either(googleMaps.textSearch(suggestion.attractionName));

              if (attraction._tag === "Right" && attraction.right !== undefined) {
                return {
                  suggestion,
                  attraction: attraction.right,
                  success: true as const,
                };
              }

              return {
                suggestion,
                attraction: undefined,
                success: false as const,
              };
            }

            return {
              suggestion,
              attraction: undefined,
              success: true as const,
            };
          })
        ),
        { concurrency: 3 }
      );

      const finalSuggestions = lookupResults
        .filter((result) => result.success)
        .map((result) => {
          if (result.attraction) {
            return {
              ...result.suggestion,
              attractionData: {
                id: result.attraction.id,
                name: result.attraction.name,
                rating: result.attraction.rating,
                userRatingsTotal: result.attraction.userRatingsTotal,
                types: result.attraction.types,
                vicinity: result.attraction.vicinity,
                priceLevel: result.attraction.priceLevel,
                openNow: result.attraction.openNow,
                location: {
                  lat: result.attraction.location.lat,
                  lng: result.attraction.location.lng,
                },
              },
            };
          }
          return result.suggestion;
        });

      return {
        ...validated,
        suggestions: finalSuggestions,
      };
    } catch (error) {
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
      // Branded types are compatible with their underlying types
      const toolName = toolCall.name;

      switch (toolName) {
        case "searchAttractions": {
          const result = yield* getTopAttractions({
            lat: args.lat,
            lng: args.lng,
            radius: args.radius ?? 10000,
            limit: args.limit ?? 10,
          });
          return JSON.stringify({ attractions: result });
        }

        case "searchRestaurants": {
          const result = yield* getTopRestaurants({
            lat: args.lat,
            lng: args.lng,
            radius: args.radius ?? 10000,
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
