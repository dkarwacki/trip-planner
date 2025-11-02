import { Effect } from "effect";
import { OpenAIClient } from "@/infrastructure/openai";
import { chatTools } from "@/infrastructure/openai/tools";
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

Always use the suggestPlaces function to provide your recommendations. Keep your responses concise and actionable.`;
};

export const TravelPlanningChat = (input: ChatRequestInput) =>
  Effect.gen(function* () {
    const openai = yield* OpenAIClient;

    // Build system prompt based on personas
    const systemPrompt = buildSystemPrompt(input.personas);

    // Prepare messages
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...input.conversationHistory,
      { role: "user" as const, content: input.message },
    ];

    // Call OpenAI with chat tools
    const response = yield* openai.chatCompletion({
      messages,
      temperature: 0.7,
      maxTokens: 2000,
      tools: chatTools,
    });

    // Extract suggested places from tool calls
    let suggestedPlaces: PlaceSuggestion[] = [];
    let thinking: string[] = [];
    let assistantMessage = response.content || "I'm having trouble processing your request. Please try again.";

    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const toolCall of response.toolCalls) {
        if (toolCall.name === "suggestPlaces") {
          try {
            const args = JSON.parse(toolCall.arguments);
            if (args.places && Array.isArray(args.places)) {
              suggestedPlaces = args.places;
            }
            if (args.thinking && Array.isArray(args.thinking)) {
              thinking = args.thinking;
            }

            // Generate a natural message based on the suggestions
            assistantMessage = `Here are some great places to explore based on your interests:`;
          } catch (error) {
            yield* Effect.logWarning("Failed to parse tool call arguments", { error, toolCall });
          }
        }
      }
    }

    return {
      message: assistantMessage,
      suggestedPlaces,
      thinking,
    } satisfies ChatResponse;
  });
