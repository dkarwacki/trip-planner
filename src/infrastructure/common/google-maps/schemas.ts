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

// Places API schemas
const DisplayNameSchema = z.object({
  text: z.string(),
  languageCode: z.string().optional(),
});

const PlaceLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

const PlacePhotoSchema = z.object({
  name: z.string(), // Format: places/{place_id}/photos/{photo_reference}
  widthPx: z.number(),
  heightPx: z.number(),
  authorAttributions: z
    .array(
      z.object({
        displayName: z.string().optional(),
        uri: z.string().optional(),
        photoUri: z.string().optional(),
      })
    )
    .optional(),
});

export const PlaceSchema = z.object({
  id: z.string(),
  displayName: DisplayNameSchema.optional(),
  types: z.array(z.string()).optional(),
  location: PlaceLocationSchema.optional(),
  rating: z.number().optional(),
  userRatingCount: z.number().int().optional(),
  priceLevel: z.string().optional(), // "PRICE_LEVEL_FREE", "PRICE_LEVEL_INEXPENSIVE", etc.
  photos: z.array(PlacePhotoSchema).optional(),
});

// Shared response schema for Places API (New) endpoints
const PlacesResponseSchema = z.object({
  places: z.array(PlaceSchema).default([]),
});

export const NearbySearchResponseSchema = PlacesResponseSchema;
export const TextSearchResponseSchema = PlacesResponseSchema;

// Place Details API response schema
export const PlaceDetailsResponseSchema = z.object({
  id: z.string(),
  displayName: DisplayNameSchema.optional(),
  formattedAddress: z.string().optional(),
  location: PlaceLocationSchema.optional(),
  photos: z.array(PlacePhotoSchema).optional(),
});

// Note: Type definitions have been moved to types.ts
// Types are derived there using z.infer<typeof Schema>

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
