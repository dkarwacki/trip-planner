import { z } from "zod";

export const GetPhotoOutputSchema = z.object({
  data: z.instanceof(Buffer),
  contentType: z.string(),
});

export type GetPhotoOutput = z.infer<typeof GetPhotoOutputSchema>;
