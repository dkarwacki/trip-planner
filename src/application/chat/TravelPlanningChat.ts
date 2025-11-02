import { Effect } from "effect";
import { OpenAIClient } from "@/infrastructure/openai";
import { GoogleMapsClient } from "@/infrastructure/google-maps";
import type { ChatRequestInput } from "./inputs";
import type { PlaceSuggestion } from "@/domain/models";
import { PERSONA_METADATA } from "@/domain/models";

interface ChatResponse {
  message: string;
  suggestedPlaces: PlaceSuggestion[];
  thinking?: string[];
}

const buildSystemPrompt = (personas: string[]): string => {
  const personaDescriptions = personas
    .map((p) => {
      const metadata = PERSONA_METADATA[p];
      return metadata ? `- ${metadata.label}: ${metadata.description}` : null;
    })
    .filter(Boolean)
    .join("\n");

  return `You are a travel planning assistant helping users discover places and destinations for their trips.

Selected traveler personas:
${personaDescriptions}

Your role:
- Suggest SPECIFIC PLACES that serve as central points for exploration (cities, neighborhoods, districts, village centers, visitor centers, trailheads, beaches, viewpoints)
- For broad areas (large parks, regions, or destinations), suggest SPECIFIC LOCATIONS WITHIN them that serve as good starting points for exploration
- Choose places that can serve as a central point where users can discover nearby attractions and restaurants on the map
- Provide searchable place names with enough specificity to get a clear map location
- DO NOT suggest individual small attractions (museums, monuments) or specific restaurants - users will discover those on the map interface
- Consider the user's selected personas when making suggestions
- When suggesting places, provide 5-8 diverse options to give users multiple exploration hubs to choose from

## Thinking Process
Before providing your suggestions, think through your reasoning:
- Analyze the user's query and selected personas
- For broad requests, identify specific areas or central points within those regions worth exploring
- Consider which locations would serve as good central points with interesting things nearby
- Select diverse options that appeal to different aspects of the user's interests
- Ensure place names are specific enough to be found on Google Maps

Respond with your recommendations in the specified JSON format.`;
};

export const TravelPlanningChat = (input: ChatRequestInput) =>
  Effect.gen(function* () {
    const openai = yield* OpenAIClient;
    const googleMaps = yield* GoogleMapsClient;

    // Build system prompt based on personas
    const systemPrompt = buildSystemPrompt(input.personas);

    // Prepare messages
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...input.conversationHistory,
      { role: "user" as const, content: input.message },
    ];

    // Call OpenAI with structured outputs
    const response = yield* openai.chatCompletion({
      messages,
      temperature: 0.7,
      maxTokens: 2000,
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "place_suggestions",
          strict: true,
          schema: {
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
                      description: "Specific, searchable place name",
                    },
                    description: {
                      type: "string",
                      description: "Brief description of what makes this place a good exploration hub",
                    },
                    reasoning: {
                      type: "string",
                      description: "Why this place matches the user's personas and interests",
                    },
                  },
                  required: ["name", "description", "reasoning"],
                  additionalProperties: false,
                },
              },
            },
            required: ["places"],
            additionalProperties: false,
          },
        },
      },
    });

    // Parse the structured JSON response
    let suggestedPlaces: PlaceSuggestion[] = [];
    let thinking: string[] = [];
    let assistantMessage = "Here are some great places to explore based on your interests:";

    if (response.content) {
      try {
        const parsed = JSON.parse(response.content);
        if (parsed.places && Array.isArray(parsed.places)) {
          suggestedPlaces = parsed.places;
        }
        if (parsed.thinking && Array.isArray(parsed.thinking)) {
          thinking = parsed.thinking;
        }
      } catch (error) {
        yield* Effect.logWarning("Failed to parse structured output", { error, content: response.content });
        assistantMessage = "I'm having trouble processing your request. Please try again.";
      }
    }

    // Fetch photos for each suggested place
    if (suggestedPlaces.length > 0) {
      const placesWithPhotos = yield* Effect.forEach(
        suggestedPlaces,
        (place) =>
          Effect.gen(function* () {
            try {
              // First, use text search to find the place and get its ID
              const searchResult = yield* googleMaps.textSearch(place.name);
              
              // Then fetch detailed place info with photos
              const placeDetails = yield* googleMaps.placeDetails(searchResult.id, true);
              
              // Add photos and coordinates to the suggestion
              return {
                ...place,
                lat: placeDetails.lat,
                lng: placeDetails.lng,
                photos: placeDetails.photos,
              } satisfies PlaceSuggestion;
            } catch (error) {
              // If we can't find the place or get photos, return the suggestion without them
              yield* Effect.logWarning(`Failed to fetch photos for ${place.name}`, { error });
              return place;
            }
          }),
        { concurrency: 3 } // Fetch photos for up to 3 places at a time
      );
      
      suggestedPlaces = placesWithPhotos;
    }

    return {
      message: assistantMessage,
      suggestedPlaces,
      thinking,
    } satisfies ChatResponse;
  });
