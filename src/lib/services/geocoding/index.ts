import { Effect } from "effect";
import type { Place } from "@/types";

export class NoResultsError {
  readonly _tag = "NoResultsError";
  constructor(
    readonly lat: number,
    readonly lng: number
  ) {}
}

export class GeocodingError {
  readonly _tag = "GeocodingError";
  constructor(readonly message: string) {}
}

interface GeocodeResult {
  formatted_address: string;
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface GeocodeResponse {
  status: string;
  results: GeocodeResult[];
  error_message?: string;
}

// Google Places Nearby Search API response types
interface NearbySearchResult {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  vicinity?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface NearbySearchResponse {
  status: string;
  results: NearbySearchResult[];
  error_message?: string;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lng1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lng2 - Longitude of point 2
 * @returns Distance in meters
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get priority score for a place type
 * Higher scores indicate more significant/interesting places
 */
function getTypePriority(types: string[]): number {
  // Highest priority: major landmarks and attractions
  const highestPriority = new Set([
    "tourist_attraction",
    "museum",
    "art_gallery",
    "monument",
    "church",
    "synagogue",
    "mosque",
    "temple",
    "historical_landmark",
    "cultural_center",
    "performing_arts_theater",
  ]);

  // High priority: nature and entertainment
  const highPriority = new Set(["park", "national_park", "zoo", "aquarium", "amusement_park", "stadium", "casino"]);

  // Medium priority: commercial but still significant
  const mediumPriority = new Set([
    "shopping_mall",
    "department_store",
    "hotel",
    "lodging",
    "restaurant",
    "cafe",
    "bar",
    "night_club",
  ]);

  // Check types in priority order
  for (const type of types) {
    if (highestPriority.has(type)) return 100;
  }
  for (const type of types) {
    if (highPriority.has(type)) return 75;
  }
  for (const type of types) {
    if (mediumPriority.has(type)) return 50;
  }

  // Default for point_of_interest or other types
  return 25;
}

/**
 * Find a significant place near the clicked coordinates
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @param apiKey - Google Maps API key
 * @returns Effect that resolves to a Place if found, or undefined if no significant place nearby
 */
const findNearbySignificantPlace = (
  lat: number,
  lng: number,
  apiKey: string
): Effect.Effect<Place | undefined, GeocodingError> =>
  Effect.gen(function* () {
    const radius = 150; // Search within 150 meters

    // Build nearby search URL - search for significant place types
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&rankby=prominence&key=${apiKey}`;

    // Fetch from Google Places Nearby Search API
    const response = yield* Effect.tryPromise({
      try: () => fetch(url),
      catch: (error) =>
        new GeocodingError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
    });

    // Parse JSON response
    const data: NearbySearchResponse = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new GeocodingError("Failed to parse API response"),
    });

    // Handle API status codes
    if (data.status === "ZERO_RESULTS") {
      return undefined;
    }

    if (data.status !== "OK") {
      // Don't fail on nearby search errors, just fall back to reverse geocoding
      return undefined;
    }

    // Find the best nearby place
    let bestPlace: { result: NearbySearchResult; distance: number; score: number } | null = null;

    for (const result of data.results || []) {
      // Skip if missing required data
      if (!result.geometry?.location || !result.name || !result.place_id) continue;

      // Calculate distance from clicked point
      const distance = calculateDistance(lat, lng, result.geometry.location.lat, result.geometry.location.lng);

      // Only consider places within the search radius
      if (distance > radius) continue;

      // Calculate a score based on type priority, rating, reviews, and distance
      const typePriority = getTypePriority(result.types || []);
      const ratingScore = (result.rating || 0) * 10;
      const reviewScore = Math.min((result.user_ratings_total || 0) / 10, 50);
      const distanceScore = Math.max(0, 100 - distance); // Closer is better

      const totalScore = typePriority + ratingScore + reviewScore + distanceScore;

      // Update best place if this one has a higher score
      if (!bestPlace || totalScore > bestPlace.score) {
        bestPlace = { result, distance, score: totalScore };
      }
    }

    // If we found a significant place, return it
    if (bestPlace && bestPlace.result.geometry) {
      const place: Place = {
        id: crypto.randomUUID(),
        name: bestPlace.result.name,
        lat: bestPlace.result.geometry.location.lat,
        lng: bestPlace.result.geometry.location.lng,
        placeId: bestPlace.result.place_id,
      };
      return place;
    }

    return undefined;
  });

/**
 * Reverse geocode coordinates to get place details using Google Geocoding API (server-side only)
 * First checks for nearby significant places, then falls back to address-based geocoding
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @param apiKey - Google Maps API key (server-side)
 * @returns Effect that resolves to a Place or fails with NoResultsError or GeocodingError
 */
export const reverseGeocode = (
  lat: number,
  lng: number,
  apiKey: string
): Effect.Effect<Place, NoResultsError | GeocodingError> =>
  Effect.gen(function* () {
    // Validate inputs
    if (!apiKey) {
      return yield* Effect.fail(new GeocodingError("API key is required"));
    }

    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
      return yield* Effect.fail(new GeocodingError("Invalid coordinates"));
    }

    if (lat < -90 || lat > 90) {
      return yield* Effect.fail(new GeocodingError("Latitude must be between -90 and 90"));
    }

    if (lng < -180 || lng > 180) {
      return yield* Effect.fail(new GeocodingError("Longitude must be between -180 and 180"));
    }

    // First, try to find a nearby significant place (like "Villa Emanuale")
    const nearbyPlace = yield* findNearbySignificantPlace(lat, lng, apiKey);

    // If we found a significant place nearby, return it
    if (nearbyPlace) {
      return nearbyPlace;
    }

    // Otherwise, fall back to reverse geocoding for address
    // Build API URL
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    // Fetch from Google Geocoding API
    const response = yield* Effect.tryPromise({
      try: () => fetch(url),
      catch: (error) =>
        new GeocodingError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
    });

    // Parse JSON response
    const data: GeocodeResponse = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () => new GeocodingError("Failed to parse API response"),
    });

    // Handle API status codes
    if (data.status === "ZERO_RESULTS") {
      return yield* Effect.fail(new NoResultsError(lat, lng));
    }

    if (data.status !== "OK") {
      const errorMessage = data.error_message || `Geocoding API error: ${data.status}`;
      return yield* Effect.fail(new GeocodingError(errorMessage));
    }

    // Validate results
    if (!data.results || data.results.length === 0) {
      return yield* Effect.fail(new NoResultsError(lat, lng));
    }

    // Extract first result
    const result = data.results[0];

    // Create Place object with unique ID
    const place: Place = {
      id: crypto.randomUUID(),
      name: result.formatted_address,
      lat: lat,
      lng: lng,
      placeId: result.place_id,
    };

    return place;
  });
