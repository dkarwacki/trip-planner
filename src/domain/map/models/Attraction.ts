import type { PlaceId, Latitude, Longitude, PlacePhoto } from "@/domain/common/models";

export interface Attraction {
  id: PlaceId;
  name: string;
  rating: number;
  userRatingsTotal: number;
  types: string[];
  vicinity: string;
  priceLevel?: number;
  openNow?: boolean;
  location: { lat: Latitude; lng: Longitude };
  photos?: PlacePhoto[];
}
