import { Effect, Cache, Duration } from "effect";
import type { Attraction, AttractionScore } from "@/types";
import { scoreAttractions, scoreRestaurants } from "./scoring";

// Tagged errors for better error handling
export class NoAttractionsFoundError {
  readonly _tag = "NoAttractionsFoundError";
  constructor(readonly location: { lat: number; lng: number }) {}
}

export class AttractionsAPIError {
  readonly _tag = "AttractionsAPIError";
  constructor(readonly message: string) {}
}

// Cache for attractions (5 minutes TTL)
const attractionsCache = Cache.make({
  capacity: 100,
  timeToLive: Duration.minutes(5),
  lookup: (key: { lat: number; lng: number; radius: number; apiKey: string }) =>
    fetchNearbyAttractionsUncached(key.lat, key.lng, key.radius, key.apiKey),
});

// Cache for restaurants (5 minutes TTL)
const restaurantsCache = Cache.make({
  capacity: 100,
  timeToLive: Duration.minutes(5),
  lookup: (key: { lat: number; lng: number; radius: number; apiKey: string }) =>
    fetchNearbyRestaurantsUncached(key.lat, key.lng, key.radius, key.apiKey),
});

// Google Places Nearby Search API response types
interface PlaceResult {
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
}

interface NearbySearchResponse {
  status: string;
  results: PlaceResult[];
  error_message?: string;
}

/**
 * Fetch nearby attractions using Google Places Nearby Search API (uncached)
 * Queries multiple types for better diversity
 */
const fetchNearbyAttractionsUncached = (
  lat: number,
  lng: number,
  radius: number,
  apiKey: string
): Effect.Effect<Attraction[], NoAttractionsFoundError | AttractionsAPIError> =>
  Effect.gen(function* () {
    // Validate inputs
    if (!apiKey) {
      return yield* Effect.fail(new AttractionsAPIError("API key is required"));
    }

    if (radius < 100 || radius > 50000) {
      return yield* Effect.fail(new AttractionsAPIError("Radius must be between 100 and 50000 meters"));
    }

    // Query specific sightseeing types (excluding broad point_of_interest to avoid shops/mechanics)
    const types = [
      "tourist_attraction",
      "museum",
      "art_gallery",
      "park",
      "national_park",
      "historical_landmark",
      "zoo",
      "aquarium",
      "amusement_park",
      "cultural_center",
      "performing_arts_theater",
    ];

    // Blocklist of commercial/service types to exclude from attractions
    const blockedTypes = new Set([
      // Automotive
      "car_repair",
      "car_dealer",
      "car_wash",
      "car_rental",
      "gas_station",
      // Shopping
      "store",
      "shopping_mall",
      "convenience_store",
      "supermarket",
      "department_store",
      "clothing_store",
      "shoe_store",
      "electronics_store",
      "furniture_store",
      "hardware_store",
      "home_goods_store",
      "jewelry_store",
      "pet_store",
      // Services
      "electrician",
      "plumber",
      "locksmith",
      "painter",
      "roofing_contractor",
      "lawyer",
      "real_estate_agency",
      "insurance_agency",
      "accounting",
      // Financial
      "atm",
      "bank",
      // Healthcare
      "dentist",
      "doctor",
      "hospital",
      "pharmacy",
      "veterinary_care",
      // Personal Care
      "hair_care",
      "beauty_salon",
      "spa",
      "gym",
      // Other Services
      "laundry",
      "post_office",
      "storage",
      // Lodging/Hotels
      "lodging",
      "hotel",
      "motel",
      "hostel",
      "resort_hotel",
      "bed_and_breakfast",
      "guest_house",
      "campground",
      "rv_park",
      // Food & Dining
      "restaurant",
      "cafe",
      "bar",
      "bakery",
      "meal_delivery",
      "meal_takeaway",
      "food",
      "night_club",
    ]);

    // Fetch results for each type
    const allAttractions: Attraction[] = [];
    const seenPlaceIds = new Set<string>();

    for (const type of types) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;

      const response = yield* Effect.tryPromise({
        try: () => fetch(url),
        catch: (error) =>
          new AttractionsAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
      });

      const data: NearbySearchResponse = yield* Effect.tryPromise({
        try: () => response.json(),
        catch: () => new AttractionsAPIError("Failed to parse API response"),
      });

      // Handle API status codes
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        const errorMessage = data.error_message || `Places API error: ${data.status}`;
        return yield* Effect.fail(new AttractionsAPIError(errorMessage));
      }

      // Process results
      if (data.results && data.results.length > 0) {
        for (const result of data.results) {
          // Skip if we've already seen this place
          if (seenPlaceIds.has(result.place_id)) continue;

          // Skip places with commercial/service types
          if (result.types && result.types.some((type) => blockedTypes.has(type))) {
            continue;
          }

          // Only include places with rating and reviews
          if (!result.rating || !result.user_ratings_total || result.user_ratings_total < 10) {
            continue;
          }

          seenPlaceIds.add(result.place_id);

          const attraction: Attraction = {
            placeId: result.place_id,
            name: result.name,
            rating: result.rating,
            userRatingsTotal: result.user_ratings_total,
            types: result.types || [],
            vicinity: result.vicinity || "",
            priceLevel: result.price_level,
            openNow: result.opening_hours?.open_now,
          };

          allAttractions.push(attraction);
        }
      }
    }

    // Check if we found any attractions
    if (allAttractions.length === 0) {
      return yield* Effect.fail(new NoAttractionsFoundError({ lat, lng }));
    }

    return allAttractions;
  });

/**
 * Fetch nearby restaurants using Google Places Nearby Search API (uncached)
 * Queries restaurant and cafe types
 */
const fetchNearbyRestaurantsUncached = (
  lat: number,
  lng: number,
  radius: number,
  apiKey: string
): Effect.Effect<Attraction[], NoAttractionsFoundError | AttractionsAPIError> =>
  Effect.gen(function* () {
    // Validate inputs
    if (!apiKey) {
      return yield* Effect.fail(new AttractionsAPIError("API key is required"));
    }

    if (radius < 100 || radius > 50000) {
      return yield* Effect.fail(new AttractionsAPIError("Radius must be between 100 and 50000 meters"));
    }

    // Query restaurant types
    const types = ["restaurant", "cafe", "bar", "bakery", "meal_takeaway"];

    // Fetch results for each type
    const allRestaurants: Attraction[] = [];
    const seenPlaceIds = new Set<string>();

    for (const type of types) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;

      const response = yield* Effect.tryPromise({
        try: () => fetch(url),
        catch: (error) =>
          new AttractionsAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
      });

      const data: NearbySearchResponse = yield* Effect.tryPromise({
        try: () => response.json(),
        catch: () => new AttractionsAPIError("Failed to parse API response"),
      });

      // Handle API status codes
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        const errorMessage = data.error_message || `Places API error: ${data.status}`;
        return yield* Effect.fail(new AttractionsAPIError(errorMessage));
      }

      // Process results
      if (data.results && data.results.length > 0) {
        for (const result of data.results) {
          // Skip if we've already seen this place
          if (seenPlaceIds.has(result.place_id)) continue;

          // Only include places with rating and reviews
          if (!result.rating || !result.user_ratings_total || result.user_ratings_total < 10) {
            continue;
          }

          seenPlaceIds.add(result.place_id);

          const restaurant: Attraction = {
            placeId: result.place_id,
            name: result.name,
            rating: result.rating,
            userRatingsTotal: result.user_ratings_total,
            types: result.types || [],
            vicinity: result.vicinity || "",
            priceLevel: result.price_level,
            openNow: result.opening_hours?.open_now,
          };

          allRestaurants.push(restaurant);
        }
      }
    }

    // Check if we found any restaurants
    if (allRestaurants.length === 0) {
      return yield* Effect.fail(new NoAttractionsFoundError({ lat, lng }));
    }

    return allRestaurants;
  });

/**
 * Fetch nearby attractions with caching (5-minute TTL)
 */
const fetchNearbyAttractions = (
  lat: number,
  lng: number,
  radius: number,
  apiKey: string
): Effect.Effect<Attraction[], NoAttractionsFoundError | AttractionsAPIError> =>
  Effect.gen(function* () {
    const cache = yield* attractionsCache;
    return yield* cache.get({ lat, lng, radius, apiKey });
  });

/**
 * Fetch nearby restaurants with caching (5-minute TTL)
 */
const fetchNearbyRestaurants = (
  lat: number,
  lng: number,
  radius: number,
  apiKey: string
): Effect.Effect<Attraction[], NoAttractionsFoundError | AttractionsAPIError> =>
  Effect.gen(function* () {
    const cache = yield* restaurantsCache;
    return yield* cache.get({ lat, lng, radius, apiKey });
  });

/**
 * Get top N scored attractions for a location
 * Server-side method that fetches, scores, and limits results
 */
export const getTopAttractions = (
  lat: number,
  lng: number,
  apiKey: string,
  limit = 10
): Effect.Effect<AttractionScore[], NoAttractionsFoundError | AttractionsAPIError> =>
  Effect.gen(function* () {
    const attractions = yield* fetchNearbyAttractions(lat, lng, 1500, apiKey);

    const scored = scoreAttractions(attractions);
    return scored.slice(0, limit);
  });

/**
 * Get top N scored restaurants for a location
 * Server-side method that fetches, scores, and limits results
 */
export const getTopRestaurants = (
  lat: number,
  lng: number,
  apiKey: string,
  limit = 10
): Effect.Effect<AttractionScore[], NoAttractionsFoundError | AttractionsAPIError> =>
  Effect.gen(function* () {
    const restaurants = yield* fetchNearbyRestaurants(lat, lng, 1500, apiKey);

    const scored = scoreRestaurants(restaurants);
    return scored.slice(0, limit);
  });
