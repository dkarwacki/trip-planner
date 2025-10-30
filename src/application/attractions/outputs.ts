import { z } from "zod";
import type { AgentResponse, Suggestion } from "@/domain/models";
import { PlaceId, Latitude, Longitude } from "@/domain/models";

/**
 * Schema for validating and transforming suggestion data from AI responses.
 * Transforms raw JSON data (strings, numbers) into branded types (PlaceId, Latitude, Longitude).
 */
const SuggestionSchema = z
  .object({
    type: z.enum(["add_attraction", "add_restaurant", "general_tip"]),
    reasoning: z.string(),
    attractionName: z.string().optional(),
    priority: z.enum(["hidden gem", "highly recommended", "must-see"]).optional(),
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
  })
  .transform((data): Suggestion => {
    // Transform raw data to branded types
    if (data.attractionData) {
      return {
        ...data,
        attractionData: {
          ...data.attractionData,
          id: PlaceId(data.attractionData.id),
          location: {
            lat: Latitude(data.attractionData.location.lat),
            lng: Longitude(data.attractionData.location.lng),
          },
        },
      } as Suggestion;
    }
    return data as Suggestion;
  });

export const AgentResponseSchema = z
  .object({
    _thinking: z.array(z.string()).describe("Step-by-step reasoning before making suggestions"),
    suggestions: z.array(SuggestionSchema),
    summary: z.string(),
  })
  .transform((data): AgentResponse => data);

export type { AgentResponse, Suggestion } from "@/domain/models";
