import type { PlaceId, Latitude, Longitude, PlacePhoto } from "@/domain/common/models";

export interface Attraction {
  id: PlaceId;
  name: string;
  rating?: number; // Optional for geographic locations (towns, cities)
  userRatingsTotal?: number; // Optional for geographic locations (towns, cities)
  types: string[];
  vicinity: string;
  priceLevel?: number;
  location: { lat: Latitude; lng: Longitude };
  photos?: PlacePhoto[];
}
