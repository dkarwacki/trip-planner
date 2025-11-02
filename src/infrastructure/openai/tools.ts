import type { ChatCompletionTool } from "openai/resources/chat/completions";

/**
 * Tool definitions for OpenAI function calling
 * These tools allow the AI agent to interact with our Google Maps services
 */

/**
 * Tools for /map view - searching attractions and restaurants near specific coordinates
 */
export const mapTools: ChatCompletionTool[] = [
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
                  description:
                    "Brief description of what makes this place a good exploration hub or starting point",
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

// Default export for backward compatibility with /map view
export const tools = mapTools;
