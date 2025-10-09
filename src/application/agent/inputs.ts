import { z } from "zod";

// Schema for a single place in the trip
const PlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  plannedAttractions: z.array(
    z.object({
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
  ),
  plannedRestaurants: z.array(
    z.object({
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
  ),
});

// Conversation history message
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

export const AnalyzeTripPlanInputSchema = z.object({
  places: z.array(PlaceSchema).min(1, "At least one place is required"),
  conversationHistory: z.array(MessageSchema).default([]),
  userMessage: z.string().optional(),
});

export type AnalyzeTripPlanInput = z.infer<typeof AnalyzeTripPlanInputSchema>;

