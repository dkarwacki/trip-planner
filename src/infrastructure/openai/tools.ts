import type { ChatCompletionTool } from "openai/resources/chat/completions";

/**
 * Tool definitions for OpenAI function calling
 * These tools allow the AI agent to interact with our Google Maps services
 */
export const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "searchAttractions",
      description:
        "Search for tourist attractions near a specific location. Returns top-rated attractions with scores based on ratings, reviews, and popularity. Use this to discover a wide variety of options before making recommendations.",
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
            description:
              "Search radius in meters. Adjust based on user's needs: 2000m for nearby/walking, 10000m for 15-20 min drive, 30000m for 30-40 min drive, 50000m for 1 hour drive. Default: 10000, min: 100, max: 50000",
            default: 10000,
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return (default: 20, min: 1, max: 50)",
            default: 20,
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
        "Search for restaurants near a specific location. Returns top-rated restaurants with scores based on ratings, reviews, price level, and availability. Use this to discover diverse dining options including local favorites and various cuisines.",
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
            description:
              "Search radius in meters. Adjust based on user's needs: 2000m for nearby/walking, 10000m for 15-20 min drive, 30000m for 30-40 min drive, 50000m for 1 hour drive. Default: 10000, min: 100, max: 50000",
            default: 10000,
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return (default: 20, min: 1, max: 50)",
            default: 20,
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
