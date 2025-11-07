import { z } from "zod";

// Reusable coordinate validation schemas
const LatitudeSchema = z
  .number({ required_error: "lat is required" })
  .refine((val) => val >= -90 && val <= 90, { message: "Latitude must be between -90 and 90" });

const LongitudeSchema = z
  .number({ required_error: "lng is required" })
  .refine((val) => val >= -180 && val <= 180, { message: "Longitude must be between -180 and 180" });

const CoordinatesSchema = z.object({
  lat: LatitudeSchema,
  lng: LongitudeSchema,
});

export const GetTopAttractionsInputSchema = z.object({
  lat: LatitudeSchema,
  lng: LongitudeSchema,
  radius: z.number().min(100).max(50000).default(2000),
  limit: z.number().min(1).max(50).default(10),
});

export type GetTopAttractionsInput = z.infer<typeof GetTopAttractionsInputSchema>;

export const GetTopRestaurantsInputSchema = z.object({
  lat: LatitudeSchema,
  lng: LongitudeSchema,
  radius: z.number().min(100).max(50000).default(2000),
  limit: z.number().min(1).max(50).default(10),
});

export type GetTopRestaurantsInput = z.infer<typeof GetTopRestaurantsInputSchema>;

// Schema for a single place in the plan
const PlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  plannedAttractions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      rating: z.number(),
      userRatingsTotal: z.number(),
      types: z.array(z.string()),
      vicinity: z.string(),
      priceLevel: z.number().optional(),
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
  place: PlaceSchema,
  mapCoordinates: CoordinatesSchema,
  conversationHistory: z.array(MessageSchema).default([]),
  userMessage: z.string().optional(),
});

export type SuggestNearbyAttractionsInput = z.infer<typeof SuggestNearbyAttractionsInputSchema>;
