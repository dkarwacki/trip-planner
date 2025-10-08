import type { PlaceId, Latitude, Longitude } from "./Place";

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
}
