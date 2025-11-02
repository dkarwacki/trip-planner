import type { ChatCompletionTool } from "openai/resources/chat/completions";

/**
 * Tools for /chat view - suggesting places and destinations (not attractions or restaurants)
 */
export const chatTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "suggestPlaces",
      description:
        "Suggest places and destinations that serve as starting points or exploration hubs for discovering nearby attractions. These should be specific, geocodable locations like cities, neighborhoods, districts, landmarks, beaches, trails, or viewpoints. DO NOT suggest individual attractions or restaurants - those will be discovered later on the map. Focus on places chosen for their potential to have interesting things around them. Always suggest 5-8 diverse places to give users multiple options.",
      parameters: {
        type: "object",
        properties: {
          thinking: {
            type: "array",
            description: "Array of thinking steps showing your reasoning process for selecting these places",
            items: {
              type: "string",
            },
          },
          places: {
            type: "array",
            description: "Array of place suggestions (typically 5-8 places to provide diverse options)",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description:
                    "Specific, searchable place name (e.g., 'Golden Gate Park, San Francisco' not just 'parks in SF')",
                },
                description: {
                  type: "string",
                  description: "Brief description of what makes this place a good exploration hub or starting point",
                },
                reasoning: {
                  type: "string",
                  description:
                    "Why this place matches the user's personas and interests, emphasizing its potential for nearby discoveries",
                },
              },
              required: ["name", "description", "reasoning"],
            },
          },
        },
        required: ["places"],
        additionalProperties: false,
      },
    },
  },
];
