import { Effect } from "effect";
import { OpenAIClient } from "@/infrastructure/common/openai";
import { GoogleMapsClient } from "@/infrastructure/common/google-maps";
import type { ChatRequestInput } from "./inputs";
import type { PlaceSuggestion } from "@/domain/plan/models";
import type { Place } from "@/domain/common/models";
import { PERSONA_METADATA } from "@/domain/plan/models";

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

const buildNarrativePrompt = (personas: string[]): string => {
  const personaDescriptions = personas
    .map((p) => {
      const metadata = PERSONA_METADATA[p];
      return metadata ? `- ${metadata.label}: ${metadata.description}` : null;
    })
    .filter(Boolean)
    .join("\n");

  return `You are a travel planning assistant that creates engaging narrative descriptions of destination recommendations.

Selected traveler personas:
${personaDescriptions}

Your role:
- Write a flowing narrative that describes each selected place
- For each place, write 1-2 natural sentences that explain why it's a great match for the user
- Wrap ONLY the place names with double asterisks (**Place Name**) wherever they naturally appear in your sentences
- Write naturally - place names can appear at the start, middle, or end of sentences
- Use a warm, conversational tone
- Keep each description concise but engaging
- Write all place descriptions as one continuous narrative paragraph

CRITICAL: Wrap place names with **double asterisks** so they become clickable links. Return ONLY the narrative text, not JSON.

Example output:
Start your adventure in **Piotrkowska Street**, one of the longest commercial streets in Europe, where you'll find a vibrant mix of historical architecture and bustling cafes. Just a short walk away, **Manufaktura** offers a fantastic blend of shopping, dining, and cultural attractions in a beautifully revitalized 19th-century factory complex.`;
};

const formatPlacesForNarrative = (places: PlaceSuggestion[]): string => {
  return places.map((place, idx) => `${idx + 1}. ${place.name}: ${place.reasoning}`).join("\n");
};

const generateNarrative = (userMessage: string, personas: string[], places: PlaceSuggestion[], thinking: string[]) =>
  Effect.gen(function* () {
    const openai = yield* OpenAIClient;

    // Build narrative-focused system prompt
    const narrativePrompt = buildNarrativePrompt(personas);

    // Prepare place descriptions for narrative generation
    const placeContext = formatPlacesForNarrative(places);

    // Include thinking steps in the context
    const thinkingContext =
      thinking.length > 0 ? `\n\nReasoning process:\n${thinking.map((t, i) => `${i + 1}. ${t}`).join("\n")}` : "";

    // Make OpenAI call for plain text narrative
    const response = yield* openai.chatCompletion({
      messages: [
        { role: "system" as const, content: narrativePrompt },
        {
          role: "user" as const,
          content: `User asked: "${userMessage}"${thinkingContext}\n\nPlaces selected:\n${placeContext}`,
        },
      ],
      temperature: 0.8, // Slightly higher for more creative narrative
      maxTokens: 10000,
    });

    // Log finish reason to check if response was cut off
    yield* Effect.logDebug("Narrative generation response", {
      finishReason: response.finishReason,
      hasContent: !!response.content,
      contentLength: response.content?.length,
    });

    // Return the narrative directly
    if (response.content && response.content.trim()) {
      return response.content.trim();
    }

    yield* Effect.logWarning("No content in narrative response");
    return "Here are some great places to explore based on your interests:";
  });

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
      maxTokens: 15000,
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
    let assistantMessage =
      "I'm having trouble finding specific places for your request. Could you provide more details?";

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

    // Generate narrative response ONLY if we have suggested places
    if (suggestedPlaces.length > 0) {
      try {
        const narrative = yield* generateNarrative(input.message, input.personas, suggestedPlaces, thinking);
        assistantMessage = narrative;
      } catch (error) {
        yield* Effect.logWarning("Failed to generate narrative, using fallback message", { error });
        // Fallback to a simple message if narrative generation fails
        assistantMessage = "Here are some great places to explore based on your interests:";
      }
    }

    // Fetch photos for each suggested place
    if (suggestedPlaces.length > 0) {
      const placesWithPhotos = yield* Effect.forEach(
        suggestedPlaces,
        (place) =>
          Effect.gen(function* () {
            // First, use search to find the place and get its ID
            const searchResult = yield* googleMaps.searchPlace(place.name).pipe(
              Effect.catchAll((error) =>
                Effect.gen(function* () {
                  // If we can't find the place, log warning and return null
                  yield* Effect.logWarning(`Failed to find place "${place.name}"`, { error });
                  return null as Place | null;
                })
              )
            );

            if (!searchResult) {
              return place;
            }

            // Then fetch detailed place info with photos
            const placeDetails = yield* googleMaps.placeDetails(searchResult.id, true).pipe(
              Effect.catchAll((error) =>
                Effect.gen(function* () {
                  // If we can't get place details, log warning and return null
                  yield* Effect.logWarning(`Failed to get details for "${place.name}"`, { error });
                  return null as Place | null;
                })
              )
            );

            if (!placeDetails) {
              return place;
            }

            // Add photos and coordinates to the suggestion
            return {
              ...place,
              id: placeDetails.id,
              lat: placeDetails.lat,
              lng: placeDetails.lng,
              photos: placeDetails.photos,
            } satisfies PlaceSuggestion;
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
