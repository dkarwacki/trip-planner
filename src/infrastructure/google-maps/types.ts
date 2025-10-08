export interface PlaceResult {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  vicinity?: string;
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
  };
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface NearbySearchResponse {
  status: string;
  results: PlaceResult[];
  error_message?: string;
}

export interface GeocodeResult {
  formatted_address: string;
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface GeocodeResponse {
  status: string;
  results: GeocodeResult[];
  error_message?: string;
}

export interface PlaceDetailsResult {
  place_id: string;
  formatted_address: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface PlaceDetailsResponse {
  status: string;
  result?: PlaceDetailsResult;
  error_message?: string;
}
