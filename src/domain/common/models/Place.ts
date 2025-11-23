import type { Attraction } from "@/domain/map/models/Attraction";
import { Brand } from "effect";

// Branded types for type safety
export type PlaceId = string & Brand.Brand<"PlaceId">;
export type Latitude = number & Brand.Brand<"Latitude">;
export type Longitude = number & Brand.Brand<"Longitude">;

// Constructors for branded types (nominal - no validation)
export const PlaceId = Brand.nominal<PlaceId>();
export const Latitude = Brand.nominal<Latitude>();
export const Longitude = Brand.nominal<Longitude>();

export interface PlacePhoto {
  lng: number;
  placeName: string;
  photoReference: string;
  width: number;
  height: number;
  attributions: string[];
}

export interface Place {
  id: PlaceId;
  name: string;
  lat: Latitude;
  lng: Longitude;
  plannedAttractions: Attraction[];
  plannedRestaurants: Attraction[];
  photos?: PlacePhoto[];
}
