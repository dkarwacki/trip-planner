import { Effect } from "effect";
import { OpenAIClient } from "@/infrastructure/common/openai";
import { TextSearchCache } from "@/infrastructure/map/cache";
import type { ChatRequestCommand } from "@/domain/plan/models";
import type { PlaceSuggestion } from "@/domain/plan/models";
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
- Provide clean, searchable place names that work well with Google Maps (e.g., "Fisherman's Wharf", "Golden Gate Park", "The Mission District")
- AVOID adding parenthetical clarifications or extra context to place names - keep them simple and direct
- DO NOT suggest individual small attractions (museums, monuments) or specific restaurants - users will discover those on the map interface
- Consider the user's selected personas when making suggestions
- When suggesting places:
  * For the FIRST assistant response (when there's no conversation history): provide 5-8 diverse options to give users multiple exploration hubs to choose from
  * For SUBSEQUENT responses (when there's already conversation history): provide a maximum of 5 new places that haven't been discussed yet

## Thinking Process
Before providing your suggestions, think through your reasoning:
- Analyze the user's query and selected personas
- For broad requests, identify specific areas or central points within those regions worth exploring
- Consider which locations would serve as good central points with interesting things nearby
- Select diverse options that appeal to different aspects of the user's interests
- Ensure place names are specific enough to be found on Google Maps

## Response Format
You MUST respond with a valid JSON object following this exact structure:
{
  "thinking": ["step 1", "step 2", ...],  // Array of thinking steps (optional)
  "message": "Your natural conversational response to the user",  // Natural response that references conversation history when appropriate
  "places": [
    {
      "name": "Fisherman's Wharf",  // Clean name without parentheses or extra context
      "description": "Brief description of what makes this place a good exploration hub",
      "reasoning": "Why this place matches the user's personas and interests"
    }
  ]
}

The "message" field should be a natural, conversational response that:
- Acknowledges the user's query and any conversation history
- Introduces or discusses the suggested places naturally
- Wrap ONLY the place names with double asterisks (**Place Name**) wherever they naturally appear in your sentences
- Maintains a warm, helpful tone
- References previous conversation context when relevant

You MUST respond ONLY with valid JSON, no additional text.`;
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

    // Return the narrative directly
    if (response.content && response.content.trim()) {
      return response.content.trim();
    }

    yield* Effect.logWarning("No content in narrative response");
    return "Here are some great places to explore based on your interests:";
  });

export const TravelPlanningChat = (cmd: ChatRequestCommand) =>
  Effect.gen(function* () {
    const openai = yield* OpenAIClient;
    const textSearchCache = yield* TextSearchCache;

    // Build system prompt based on personas
    const systemPrompt = buildSystemPrompt(cmd.personas);

    // Prepare messages
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...cmd.conversationHistory,
      { role: "user" as const, content: cmd.message },
    ];

    const response = yield* openai.chatCompletion({
      messages,
      temperature: 0.7,
      maxTokens: 10000,
      responseFormat: {
        type: "json_object",
      },
      reasoningEffort: "high",
    });

    // Log reasoning if provided by the model
    if (response.reasoning) {
      yield* Effect.logInfo("Model reasoning", { reasoning: response.reasoning });
    }

    // Parse the structured JSON response
    let suggestedPlaces: PlaceSuggestion[] = [];
    let thinking: string[] = [];
    let originalAssistantMessage = "";
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
        if (parsed.message && typeof parsed.message === "string") {
          originalAssistantMessage = parsed.message;
        }
      } catch (error) {
        yield* Effect.logWarning("Failed to parse structured output", { error, content: response.content });
        assistantMessage = "I'm having trouble processing your request. Please try again.";
      }
    }

    // Generate narrative response ONLY for the first message
    const isFirstMessage = cmd.conversationHistory.length === 0;

    if (suggestedPlaces.length > 0 && isFirstMessage) {
      // First message: generate engaging narrative
      try {
        const narrative = yield* generateNarrative(cmd.message, cmd.personas, suggestedPlaces, thinking);
        assistantMessage = narrative;
      } catch (error) {
        yield* Effect.logWarning("Failed to generate narrative, using fallback message", { error });
        // Fallback to a simple message if narrative generation fails
        assistantMessage = "Here are some great places to explore based on your interests:";
      }
    } else {
      assistantMessage = originalAssistantMessage;
    }

    // Validate each suggested place against Google Maps
    if (suggestedPlaces.length > 0) {
      const validationResults = yield* Effect.forEach(
        suggestedPlaces,
        (place) =>
          Effect.gen(function* () {
            // Try primary search with full name
            const searchParams = {
              query: place.name,
              includePhotos: true,
              requireRatings: false, // Allow geographic locations (towns, cities) without ratings
            };

            const searchResult = yield* textSearchCache.get(searchParams).pipe(
              Effect.map((attraction) => ({ attraction, searchQuery: place.name })),
              Effect.catchAll((error) =>
                Effect.gen(function* () {
                  yield* Effect.logWarning("Text search failed", {
                    placeName: place.name,
                    errorTag: error._tag,
                    errorMessage: error instanceof Error ? error.message : String(error),
                    errorDetails: error,
                  });
                  return null;
                })
              )
            );

            if (searchResult) {
              const result = {
                ...place,
                id: searchResult.attraction.id,
                lat: searchResult.attraction.location.lat,
                lng: searchResult.attraction.location.lng,
                photos: searchResult.attraction.photos,
                validationStatus: "verified" as const,
                searchQuery: searchResult.searchQuery,
              } satisfies PlaceSuggestion;

              return result;
            }

            // If all searches fail, mark as not found
            yield* Effect.logWarning("Failed to validate place", {
              placeName: place.name,
              validationStatus: "not_found",
            });

            return {
              ...place,
              validationStatus: "not_found" as const,
              searchQuery: place.name,
            } satisfies PlaceSuggestion;
          }),
        { concurrency: 3 } // Validate up to 3 places at a time
      );

      // Filter out unvalidated places (Option A)
      const validatedPlaces = validationResults.filter((p) => p.validationStatus === "verified");
      const rejectedCount = validationResults.length - validatedPlaces.length;

      if (rejectedCount > 0) {
        const rejectedNames = validationResults
          .filter((p) => p.validationStatus !== "verified")
          .map((p) => p.name)
          .join(", ");

        yield* Effect.logWarning(`Filtered out ${rejectedCount} unvalidated place(s): ${rejectedNames}`, {
          rejectedPlaces: validationResults
            .filter((p) => p.validationStatus !== "verified")
            .map((p) => ({
              name: p.name,
              validationStatus: p.validationStatus,
              searchQuery: p.searchQuery,
            })),
        });

        // Add user feedback about filtered places
        if (validatedPlaces.length > 0) {
          // Some places were validated
          assistantMessage += `\n\n*Note: ${rejectedCount} suggested place${rejectedCount > 1 ? "s" : ""} could not be verified on Google Maps and ${rejectedCount > 1 ? "were" : "was"} filtered out.*`;
        } else {
          // No places were validated - show more helpful message
          assistantMessage = `I couldn't find any of the suggested places on Google Maps. This might be because:
- The places don't exist or have different names
- The area you're asking about needs more specific details
- Try asking about a specific city or region

Could you provide more details about where you'd like to explore?`;
        }
      }

      suggestedPlaces = validatedPlaces;
    }

    return {
      message: assistantMessage,
      suggestedPlaces,
      thinking,
    } satisfies ChatResponse;
  });
