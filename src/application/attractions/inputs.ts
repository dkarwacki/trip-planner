import { z } from "zod";

export const GetTopAttractionsInputSchema = z.object({
  lat: z
    .number({ required_error: "lat is required" })
    .refine((val) => val >= -90 && val <= 90, { message: "Latitude must be between -90 and 90" }),
  lng: z
    .number({ required_error: "lng is required" })
    .refine((val) => val >= -180 && val <= 180, { message: "Longitude must be between -180 and 180" }),
  radius: z.number().min(100).max(50000).default(1500),
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
  radius: z.number().min(100).max(50000).default(1500),
  limit: z.number().min(1).max(50).default(10),
});

export type GetTopRestaurantsInput = z.infer<typeof GetTopRestaurantsInputSchema>;
