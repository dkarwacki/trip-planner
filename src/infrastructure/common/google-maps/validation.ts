import { z } from "zod";
import { Brand } from "effect";

export type SearchRadius = number & Brand.Brand<"SearchRadius">;
export const SearchRadius = Brand.nominal<SearchRadius>();

export type NonEmptyString = string & Brand.Brand<"NonEmptyString">;
export const NonEmptyString = Brand.nominal<NonEmptyString>();

const SearchRadiusSchema = z
  .number()
  .int()
  .min(100, "Radius must be at least 100 meters")
  .max(50000, "Radius must be at most 50000 meters");

const NonEmptyStringSchema = z.string().trim().min(1, "String cannot be empty");

const LatitudeSchema = z
  .number()
  .min(-90, "Latitude must be between -90 and 90")
  .max(90, "Latitude must be between -90 and 90");

const LongitudeSchema = z
  .number()
  .min(-180, "Longitude must be between -180 and 180")
  .max(180, "Longitude must be between -180 and 180");

export const CoordinatesSchema = z.object({
  lat: LatitudeSchema,
  lng: LongitudeSchema,
});

const LocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const GeometrySchema = z.object({
  location: LocationSchema,
});

const OpeningHoursSchema = z
  .object({
    open_now: z.boolean().optional(),
  })
  .optional();

const PhotoSchema = z.object({
  photo_reference: z.string(),
  width: z.number(),
  height: z.number(),
  html_attributions: z.array(z.string()).default([]),
});

export const PlaceResultSchema = z.object({
  place_id: z.string(),
  name: z.string(),
  rating: z.number().optional(),
  user_ratings_total: z.number().int().optional(),
  types: z.array(z.string()).optional(),
  vicinity: z.string().optional(),
  price_level: z.number().int().min(0).max(4).optional(),
  opening_hours: OpeningHoursSchema,
  geometry: GeometrySchema.optional(),
  photos: z.array(PhotoSchema).optional(),
});

export const NearbySearchResponseSchema = z.object({
  status: z.string(),
  results: z.array(PlaceResultSchema).default([]),
  error_message: z.string().optional(),
});

const GeocodeResultSchema = z.object({
  formatted_address: z.string(),
  place_id: z.string(),
  geometry: GeometrySchema,
});

export const GeocodeResponseSchema = z.object({
  status: z.string(),
  results: z.array(GeocodeResultSchema).default([]),
  error_message: z.string().optional(),
});

const PlaceDetailsResultSchema = z.object({
  place_id: z.string(),
  formatted_address: z.string(),
  name: z.string().optional(),
  geometry: GeometrySchema,
  photos: z.array(PhotoSchema).optional(),
});

export const PlaceDetailsResponseSchema = z.object({
  status: z.string(),
  result: PlaceDetailsResultSchema.optional(),
  error_message: z.string().optional(),
});

export const TextSearchResponseSchema = NearbySearchResponseSchema;

export type PlaceResult = z.infer<typeof PlaceResultSchema>;
export type NearbySearchResponse = z.infer<typeof NearbySearchResponseSchema>;
export type GeocodeResponse = z.infer<typeof GeocodeResponseSchema>;
export type PlaceDetailsResponse = z.infer<typeof PlaceDetailsResponseSchema>;
export type TextSearchResponse = z.infer<typeof TextSearchResponseSchema>;

export const validateSearchRadius = (radius: number): SearchRadius => {
  const validated = SearchRadiusSchema.parse(radius);
  return SearchRadius(validated);
};

export const validateNonEmptyString = (str: string): NonEmptyString => {
  const validated = NonEmptyStringSchema.parse(str);
  return NonEmptyString(validated);
};

export const validateCoordinates = (lat: number, lng: number): { lat: number; lng: number } => {
  return CoordinatesSchema.parse({ lat, lng });
};
