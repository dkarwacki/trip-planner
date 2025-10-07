import { Effect, Cache, Duration, Data } from "effect";
import type { Attraction, AttractionScore } from "@/types";
import { scoreAttractions, scoreRestaurants } from "./scoring";

export class NoAttractionsFoundError {
  readonly _tag = "NoAttractionsFoundError";
  constructor(readonly location: { lat: number; lng: number }) {}
}

export class AttractionsAPIError {
  readonly _tag = "AttractionsAPIError";
  constructor(readonly message: string) {}
}

interface ServerCacheKey {
  lat: number;
  lng: number;
  radius: number;
  apiKey: string;
}

const attractionsCacheSingleton = Effect.runSync(
  Cache.make({
    capacity: 100,
    timeToLive: Duration.minutes(5),
    lookup: (key: ServerCacheKey) => fetchNearbyAttractionsUncached(key.lat, key.lng, key.radius, key.apiKey),
  })
);

const restaurantsCacheSingleton = Effect.runSync(
  Cache.make({
    capacity: 100,
    timeToLive: Duration.minutes(5),
    lookup: (key: ServerCacheKey) => fetchNearbyRestaurantsUncached(key.lat, key.lng, key.radius, key.apiKey),
  })
);

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
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface NearbySearchResponse {
  status: string;
  results: PlaceResult[];
  error_message?: string;
}

const fetchNearbyAttractionsUncached = (
  lat: number,
  lng: number,
  radius: number,
  apiKey: string
): Effect.Effect<Attraction[], NoAttractionsFoundError | AttractionsAPIError> =>
  Effect.gen(function* () {
    if (!apiKey) {
      return yield* Effect.fail(new AttractionsAPIError("API key is required"));
    }

    if (radius < 100 || radius > 50000) {
      return yield* Effect.fail(new AttractionsAPIError("Radius must be between 100 and 50000 meters"));
    }

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

    const blockedTypes = new Set([
      "car_repair",
      "car_dealer",
      "car_wash",
      "car_rental",
      "gas_station",
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
      "electrician",
      "plumber",
      "locksmith",
      "painter",
      "roofing_contractor",
      "lawyer",
      "real_estate_agency",
      "insurance_agency",
      "accounting",
      "atm",
      "bank",
      "dentist",
      "doctor",
      "hospital",
      "pharmacy",
      "veterinary_care",
      "hair_care",
      "beauty_salon",
      "spa",
      "gym",
      "laundry",
      "post_office",
      "storage",
      "lodging",
      "hotel",
      "motel",
      "hostel",
      "resort_hotel",
      "bed_and_breakfast",
      "guest_house",
      "campground",
      "rv_park",
      "restaurant",
      "cafe",
      "bar",
      "bakery",
      "meal_delivery",
      "meal_takeaway",
      "food",
      "night_club",
    ]);

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

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        const errorMessage = data.error_message || `Places API error: ${data.status}`;
        return yield* Effect.fail(new AttractionsAPIError(errorMessage));
      }

      if (data.results && data.results.length > 0) {
        for (const result of data.results) {
          if (seenPlaceIds.has(result.place_id)) continue;

          if (result.types && result.types.some((type) => blockedTypes.has(type))) {
            continue;
          }

          if (!result.rating || !result.user_ratings_total || result.user_ratings_total < 10) {
            continue;
          }

          if (!result.geometry?.location) {
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
            location: {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
            },
          };

          allAttractions.push(attraction);
        }
      }
    }

    if (allAttractions.length === 0) {
      return yield* Effect.fail(new NoAttractionsFoundError({ lat, lng }));
    }

    return allAttractions;
  });

const fetchNearbyRestaurantsUncached = (
  lat: number,
  lng: number,
  radius: number,
  apiKey: string
): Effect.Effect<Attraction[], NoAttractionsFoundError | AttractionsAPIError> =>
  Effect.gen(function* () {
    if (!apiKey) {
      return yield* Effect.fail(new AttractionsAPIError("API key is required"));
    }

    if (radius < 100 || radius > 50000) {
      return yield* Effect.fail(new AttractionsAPIError("Radius must be between 100 and 50000 meters"));
    }

    const types = ["restaurant", "cafe", "bar", "bakery", "meal_takeaway"];

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

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        const errorMessage = data.error_message || `Places API error: ${data.status}`;
        return yield* Effect.fail(new AttractionsAPIError(errorMessage));
      }

      if (data.results && data.results.length > 0) {
        for (const result of data.results) {
          if (seenPlaceIds.has(result.place_id)) continue;

          if (!result.rating || !result.user_ratings_total || result.user_ratings_total < 10) {
            continue;
          }

          if (!result.geometry?.location) {
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
            location: {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
            },
          };

          allRestaurants.push(restaurant);
        }
      }
    }

    if (allRestaurants.length === 0) {
      return yield* Effect.fail(new NoAttractionsFoundError({ lat, lng }));
    }

    return allRestaurants;
  });

export const getTopAttractions = (
  lat: number,
  lng: number,
  apiKey: string,
  limit = 10
): Effect.Effect<AttractionScore[], NoAttractionsFoundError | AttractionsAPIError> =>
  Effect.gen(function* () {
    const cacheKey = Data.struct({ lat, lng, radius: 1500, apiKey });
    const attractions = yield* attractionsCacheSingleton.get(cacheKey);

    const scored = scoreAttractions(attractions);
    return scored.slice(0, limit);
  });

export const getTopRestaurants = (
  lat: number,
  lng: number,
  apiKey: string,
  limit = 10
): Effect.Effect<AttractionScore[], NoAttractionsFoundError | AttractionsAPIError> =>
  Effect.gen(function* () {
    const cacheKey = Data.struct({ lat, lng, radius: 1500, apiKey });
    const restaurants = yield* restaurantsCacheSingleton.get(cacheKey);

    const scored = scoreRestaurants(restaurants);
    return scored.slice(0, limit);
  });
