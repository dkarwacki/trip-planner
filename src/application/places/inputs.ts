import { z } from "zod";

export const SearchPlaceInputSchema = z.object({
  query: z.string({ required_error: "query is required" }).min(1, "query cannot be empty"),
});

export type SearchPlaceInput = z.infer<typeof SearchPlaceInputSchema>;

export const GetPlaceDetailsInputSchema = z.object({
  placeId: z.string({ required_error: "placeId is required" }).min(1, "placeId cannot be empty"),
});

export type GetPlaceDetailsInput = z.infer<typeof GetPlaceDetailsInputSchema>;
