import { Effect, Context, Layer } from "effect";
import type { Attraction, Place } from "@/domain/models";
import { PlaceId, Latitude, Longitude } from "@/domain/models";
import {
  NoAttractionsFoundError,
  AttractionsAPIError,
  PlaceNotFoundError,
  PlacesAPIError,
  NoResultsError,
  GeocodingError,
  MissingGoogleMapsAPIKeyError,
} from "@/domain/errors";
import { ConfigService } from "@/infrastructure/config";
import type { NearbySearchResponse, GeocodeResponse, PlaceDetailsResponse } from "./types";
import { BLOCKED_PLACE_TYPES } from "./constants";

export interface IGoogleMapsClient {
  readonly nearbySearch: (
    lat: number,
    lng: number,
    radius: number,
    types: readonly string[]
  ) => Effect.Effect<Attraction[], NoAttractionsFoundError | AttractionsAPIError | MissingGoogleMapsAPIKeyError>;

  readonly geocode: (
    query: string
  ) => Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError | MissingGoogleMapsAPIKeyError>;

  readonly reverseGeocode: (
    lat: number,
    lng: number
  ) => Effect.Effect<Place, NoResultsError | GeocodingError | MissingGoogleMapsAPIKeyError>;

  readonly placeDetails: (
    placeId: string
  ) => Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError | MissingGoogleMapsAPIKeyError>;
}

export class GoogleMapsClient extends Context.Tag("GoogleMapsClient")<GoogleMapsClient, IGoogleMapsClient>() {}

export const GoogleMapsClientLive = Layer.effect(
  GoogleMapsClient,
  Effect.gen(function* () {
    const config = yield* ConfigService;

    const nearbySearch = (
      lat: number,
      lng: number,
      radius: number,
      types: readonly string[]
    ): Effect.Effect<Attraction[], NoAttractionsFoundError | AttractionsAPIError | MissingGoogleMapsAPIKeyError> =>
      Effect.gen(function* () {
        const apiKey = yield* config.getGoogleMapsApiKey();

        if (radius < 100 || radius > 50000) {
          return yield* Effect.fail(new AttractionsAPIError("Radius must be between 100 and 50000 meters"));
        }

        const allResults: Attraction[] = [];
        const seenPlaceIds = new Set<string>();

        // Determine if we're searching for restaurants (don't apply blocking in that case)
        const isRestaurantSearch = types.some((t) =>
          ["restaurant", "cafe", "bar", "bakery", "meal_takeaway"].includes(t)
        );

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

              // Only apply blocking for non-restaurant searches
              if (!isRestaurantSearch && result.types && result.types.some((type) => BLOCKED_PLACE_TYPES.has(type))) {
                const blockedType = result.types.find((type) => BLOCKED_PLACE_TYPES.has(type));
                yield* Effect.logDebug("Filtered out place due to blocked type", {
                  place: result.name,
                  blockedType,
                });
                continue;
              }

              if (!result.rating || !result.user_ratings_total || result.user_ratings_total < 10) {
                yield* Effect.logDebug("Filtered out place due to low ratings", {
                  place: result.name,
                  rating: result.rating,
                  reviews: result.user_ratings_total,
                });
                continue;
              }

              if (!result.geometry?.location) {
                yield* Effect.logDebug("Filtered out place due to missing geometry", {
                  place: result.name,
                });
                continue;
              }

              seenPlaceIds.add(result.place_id);

              const attraction: Attraction = {
                id: PlaceId(result.place_id),
                name: result.name,
                rating: result.rating,
                userRatingsTotal: result.user_ratings_total,
                types: result.types || [],
                vicinity: result.vicinity || "",
                priceLevel: result.price_level,
                openNow: result.opening_hours?.open_now,
                location: {
                  lat: Latitude(result.geometry.location.lat),
                  lng: Longitude(result.geometry.location.lng),
                },
              };

              allResults.push(attraction);
            }
          }
        }

        if (allResults.length === 0) {
          const searchType = isRestaurantSearch ? "restaurants" : "attractions";
          return yield* Effect.fail(new NoAttractionsFoundError({ lat, lng }, searchType));
        }

        return allResults;
      });

    const geocode = (
      query: string
    ): Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError | MissingGoogleMapsAPIKeyError> =>
      Effect.gen(function* () {
        const apiKey = yield* config.getGoogleMapsApiKey();

        if (!query.trim()) {
          return yield* Effect.fail(new PlaceNotFoundError(query));
        }

        const encodedQuery = encodeURIComponent(query.trim());
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedQuery}&key=${apiKey}`;

        const response = yield* Effect.tryPromise({
          try: () => fetch(url),
          catch: (error) =>
            new PlacesAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
        });

        const data: GeocodeResponse = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: () => new PlacesAPIError("Failed to parse API response"),
        });

        if (data.status === "ZERO_RESULTS") {
          return yield* Effect.fail(new PlaceNotFoundError(query));
        }

        if (data.status !== "OK") {
          const errorMessage = data.error_message || `Geocoding API error: ${data.status}`;
          return yield* Effect.fail(new PlacesAPIError(errorMessage));
        }

        if (!data.results || data.results.length === 0) {
          return yield* Effect.fail(new PlaceNotFoundError(query));
        }

        const result = data.results[0];

        const place: Place = {
          id: PlaceId(result.place_id),
          name: result.formatted_address,
          lat: Latitude(result.geometry.location.lat),
          lng: Longitude(result.geometry.location.lng),
          plannedAttractions: [],
          plannedRestaurants: [],
        };

        return place;
      });

    const reverseGeocode = (
      lat: number,
      lng: number
    ): Effect.Effect<Place, NoResultsError | GeocodingError | MissingGoogleMapsAPIKeyError> =>
      Effect.gen(function* () {
        const apiKey = yield* config.getGoogleMapsApiKey();

        if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
          return yield* Effect.fail(new GeocodingError("Invalid coordinates"));
        }

        if (lat < -90 || lat > 90) {
          return yield* Effect.fail(new GeocodingError("Latitude must be between -90 and 90"));
        }

        if (lng < -180 || lng > 180) {
          return yield* Effect.fail(new GeocodingError("Longitude must be between -180 and 180"));
        }

        // Try to find nearby significant place first (nearby search logic from geocoding/index.ts)
        const nearbyPlace = yield* findNearbySignificantPlace(lat, lng, apiKey);
        if (nearbyPlace) {
          return nearbyPlace;
        }

        // Fall back to reverse geocoding
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

        const response = yield* Effect.tryPromise({
          try: () => fetch(url),
          catch: (error) =>
            new GeocodingError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
        });

        const data: GeocodeResponse = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: () => new GeocodingError("Failed to parse API response"),
        });

        if (data.status === "ZERO_RESULTS") {
          return yield* Effect.fail(new NoResultsError(lat, lng));
        }

        if (data.status !== "OK") {
          const errorMessage = data.error_message || `Geocoding API error: ${data.status}`;
          return yield* Effect.fail(new GeocodingError(errorMessage));
        }

        if (!data.results || data.results.length === 0) {
          return yield* Effect.fail(new NoResultsError(lat, lng));
        }

        const result = data.results[0];

        const place: Place = {
          id: PlaceId(result.place_id),
          name: result.formatted_address,
          lat: Latitude(lat),
          lng: Longitude(lng),
          plannedAttractions: [],
          plannedRestaurants: [],
        };

        return place;
      });

    const placeDetails = (
      placeId: string
    ): Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError | MissingGoogleMapsAPIKeyError> =>
      Effect.gen(function* () {
        const apiKey = yield* config.getGoogleMapsApiKey();

        if (!placeId.trim()) {
          return yield* Effect.fail(new PlaceNotFoundError(placeId));
        }

        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=place_id,name,formatted_address,geometry&key=${apiKey}`;

        const response = yield* Effect.tryPromise({
          try: () => fetch(url),
          catch: (error) =>
            new PlacesAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
        });

        const data: PlaceDetailsResponse = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: () => new PlacesAPIError("Failed to parse API response"),
        });

        if (data.status === "NOT_FOUND" || data.status === "ZERO_RESULTS") {
          return yield* Effect.fail(new PlaceNotFoundError(placeId));
        }

        if (data.status !== "OK") {
          const errorMessage = data.error_message || `Place Details API error: ${data.status}`;
          return yield* Effect.fail(new PlacesAPIError(errorMessage));
        }

        if (!data.result) {
          return yield* Effect.fail(new PlaceNotFoundError(placeId));
        }

        const result = data.result;

        const place: Place = {
          id: PlaceId(result.place_id),
          name: result.name || result.formatted_address,
          lat: Latitude(result.geometry.location.lat),
          lng: Longitude(result.geometry.location.lng),
          plannedAttractions: [],
          plannedRestaurants: [],
        };

        return place;
      });

    // Helper function from geocoding/index.ts
    const findNearbySignificantPlace = (
      lat: number,
      lng: number,
      apiKey: string
    ): Effect.Effect<Place | undefined, GeocodingError> =>
      Effect.gen(function* () {
        const radius = 150;
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&rankby=prominence&key=${apiKey}`;

        const response = yield* Effect.tryPromise({
          try: () => fetch(url),
          catch: (error) =>
            new GeocodingError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
        });

        const data: NearbySearchResponse = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: () => new GeocodingError("Failed to parse API response"),
        });

        if (data.status === "ZERO_RESULTS") {
          return undefined;
        }

        if (data.status !== "OK") {
          return undefined;
        }

        // Find best nearby place (scoring logic from geocoding/index.ts)
        interface BestPlaceResult {
          result: {
            geometry: { location: { lat: number; lng: number } };
            name: string;
            place_id: string;
            types?: string[];
            rating?: number;
            user_ratings_total?: number;
          };
          distance: number;
          score: number;
        }
        let bestPlace: BestPlaceResult | null = null;

        for (const result of data.results || []) {
          if (!result.geometry?.location || !result.name || !result.place_id) continue;

          const distance = calculateDistance(lat, lng, result.geometry.location.lat, result.geometry.location.lng);

          if (distance > radius) continue;

          const typePriority = getTypePriority(result.types || []);
          const ratingScore = (result.rating || 0) * 10;
          const reviewScore = Math.min((result.user_ratings_total || 0) / 10, 50);
          const distanceScore = Math.max(0, 100 - distance);

          const totalScore = typePriority + ratingScore + reviewScore + distanceScore;

          if (!bestPlace || totalScore > bestPlace.score) {
            bestPlace = {
              result: {
                geometry: result.geometry,
                name: result.name,
                place_id: result.place_id,
                types: result.types,
                rating: result.rating,
                user_ratings_total: result.user_ratings_total,
              },
              distance,
              score: totalScore,
            };
          }
        }

        if (bestPlace) {
          const place: Place = {
            id: PlaceId(bestPlace.result.place_id),
            name: bestPlace.result.name,
            lat: Latitude(bestPlace.result.geometry.location.lat),
            lng: Longitude(bestPlace.result.geometry.location.lng),
            plannedAttractions: [],
            plannedRestaurants: [],
          };
          return place;
        }

        return undefined;
      });

    return {
      nearbySearch,
      geocode,
      reverseGeocode,
      placeDetails,
    };
  })
);

// Helper functions from geocoding/index.ts
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

function getTypePriority(types: string[]): number {
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

  const highPriority = new Set(["park", "national_park", "zoo", "aquarium", "amusement_park", "stadium", "casino"]);

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

  for (const type of types) {
    if (highestPriority.has(type)) return 100;
  }
  for (const type of types) {
    if (highPriority.has(type)) return 75;
  }
  for (const type of types) {
    if (mediumPriority.has(type)) return 50;
  }

  return 25;
}
