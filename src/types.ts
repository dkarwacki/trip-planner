export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  placeId: string;
}

export interface Attraction {
  placeId: string;
  name: string;
  rating: number;
  userRatingsTotal: number;
  types: string[];
  vicinity: string;
  priceLevel?: number;
  openNow?: boolean;
  location: { lat: number; lng: number };
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
