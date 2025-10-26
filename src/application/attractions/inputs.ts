import { z } from "zod";

export const GetTopAttractionsInputSchema = z.object({
  lat: z
    .number({ required_error: "lat is required" })
    .refine((val) => val >= -90 && val <= 90, { message: "Latitude must be between -90 and 90" }),
  lng: z
    .number({ required_error: "lng is required" })
    .refine((val) => val >= -180 && val <= 180, { message: "Longitude must be between -180 and 180" }),
  radius: z.number().min(100).max(50000).default(2000),
  limit: z.number().min(1).max(50).default(10),
});

export type GetTopAttractionsInput = z.infer<typeof GetTopAttractionsInputSchema>;

export const GetTopRestaurantsInputSchema = z.object({
  lat: z
    .number({ required_error: "lat is required" })
    .refine((val) => val >= -90 && val <= 90, { message: "Latitude must be between -90 and 90" }),
  lng: z
    .number({ required_error: "lng is required" })
    .refine((val) => val >= -180 && val <= 180, { message: "Longitude must be between -180 and 180" }),
  radius: z.number().min(100).max(50000).default(2000),
  limit: z.number().min(1).max(50).default(10),
});

export type GetTopRestaurantsInput = z.infer<typeof GetTopRestaurantsInputSchema>;

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

export const SuggestNearbyAttractionsInputSchema = z.object({
  places: z.array(PlaceSchema).min(1, "At least one place is required"),
  conversationHistory: z.array(MessageSchema).default([]),
  userMessage: z.string().optional(),
});

export type SuggestNearbyAttractionsInput = z.infer<typeof SuggestNearbyAttractionsInputSchema>;
