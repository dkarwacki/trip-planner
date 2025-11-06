import { z } from "zod";

export const GetPhotoInputSchema = z.object({
  photoReference: z.string().min(1, "Photo reference is required"),
  maxWidth: z.number().int().positive().max(1600).default(800),
});

export type GetPhotoInput = z.infer<typeof GetPhotoInputSchema>;
