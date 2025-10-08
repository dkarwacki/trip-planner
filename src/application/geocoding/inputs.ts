import { z } from "zod";

export const ReverseGeocodeInputSchema = z.object({
  lat: z
    .number({ required_error: "lat is required" })
    .refine((val) => val >= -90 && val <= 90, { message: "Latitude must be between -90 and 90" }),
  lng: z
    .number({ required_error: "lng is required" })
    .refine((val) => val >= -180 && val <= 180, { message: "Longitude must be between -180 and 180" }),
});

export type ReverseGeocodeInput = z.infer<typeof ReverseGeocodeInputSchema>;
