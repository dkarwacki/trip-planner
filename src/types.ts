import { Brand } from "effect";

// Branded types for type safety
export type PlaceId = string & Brand.Brand<"PlaceId">;
export type Latitude = number & Brand.Brand<"Latitude">;
export type Longitude = number & Brand.Brand<"Longitude">;

// Constructors for branded types (nominal - no validation)
export const PlaceId = Brand.nominal<PlaceId>();
export const Latitude = Brand.nominal<Latitude>();
export const Longitude = Brand.nominal<Longitude>();

export interface Place {
  id: string;
  name: string;
  lat: Latitude;
  lng: Longitude;
  placeId: PlaceId;
}

export interface Attraction {
  placeId: PlaceId;
  name: string;
  rating: number;
  userRatingsTotal: number;
  types: string[];
  vicinity: string;
  priceLevel?: number;
  openNow?: boolean;
  location: { lat: Latitude; lng: Longitude };
}

export interface AttractionScore {
  attraction: Attraction;
  score: number;
  breakdown: {
    qualityScore: number;
    diversityScore: number;
    localityScore: number;
  };
}
