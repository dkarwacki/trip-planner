import { z } from "zod";

export const SearchPlaceInputSchema = z.object({
  query: z.string({ required_error: "query is required" }).min(1, "query cannot be empty"),
});

export type SearchPlaceInput = z.infer<typeof SearchPlaceInputSchema>;
