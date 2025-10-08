import { Brand } from "effect";
import type { Attraction } from "./Attraction";

// Branded types for type safety
export type PlaceId = string & Brand.Brand<"PlaceId">;
export type Latitude = number & Brand.Brand<"Latitude">;
export type Longitude = number & Brand.Brand<"Longitude">;

// Constructors for branded types (nominal - no validation)
export const PlaceId = Brand.nominal<PlaceId>();
export const Latitude = Brand.nominal<Latitude>();
export const Longitude = Brand.nominal<Longitude>();

export interface Place {
  id: PlaceId;
  name: string;
  lat: Latitude;
  lng: Longitude;
  plannedAttractions: Attraction[];
  plannedRestaurants: Attraction[];
}
