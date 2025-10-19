import { Effect, Context, Layer } from "effect";
import { ZodError } from "zod";
import type { Attraction, Place } from "@/domain/models";
import { PlaceId, Latitude, Longitude } from "@/domain/models";
import {
  NoAttractionsFoundError,
  AttractionsAPIError,
  AttractionNotFoundError,
  PlaceNotFoundError,
  PlacesAPIError,
  NoResultsError,
  GeocodingError,
  MissingGoogleMapsAPIKeyError,
} from "@/domain/errors";
import { ConfigService } from "@/infrastructure/config";
import {
  NearbySearchResponseSchema,
  GeocodeResponseSchema,
  PlaceDetailsResponseSchema,
  TextSearchResponseSchema,
  validateSearchRadius,
  validateNonEmptyString,
  validateCoordinates,
} from "./validation";
import {
  calculateDistance,
  isRestaurantSearch,
  calculatePlaceScore,
  NEARBY_PLACE_SEARCH_RADIUS,
  MIN_RATING_COUNT,
} from "./helpers";
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

  readonly textSearch: (
    query: string
  ) => Effect.Effect<Attraction, AttractionNotFoundError | AttractionsAPIError | MissingGoogleMapsAPIKeyError>;
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

        const validatedRadius = yield* Effect.try({
          try: () => validateSearchRadius(radius),
          catch: (error) =>
            new AttractionsAPIError(error instanceof ZodError ? error.errors[0].message : "Invalid radius"),
        });

        yield* Effect.try({
          try: () => validateCoordinates(lat, lng),
          catch: (error) =>
            new AttractionsAPIError(error instanceof ZodError ? error.errors[0].message : "Invalid coordinates"),
        });

        const allResults: Attraction[] = [];
        const seenPlaceIds = new Set<string>();
        const isRestaurants = isRestaurantSearch(types);

        for (const type of types) {
          const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${validatedRadius}&type=${type}&key=${apiKey}`;

          const response = yield* Effect.tryPromise({
            try: () => fetch(url),
            catch: (error) =>
              new AttractionsAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
          });

          const json = yield* Effect.tryPromise({
            try: () => response.json(),
            catch: () => new AttractionsAPIError("Failed to parse API response"),
          });

          const data = yield* Effect.try({
            try: () => NearbySearchResponseSchema.parse(json),
            catch: (error) =>
              new AttractionsAPIError(
                error instanceof ZodError ? `Invalid API response: ${error.errors[0].message}` : "Invalid API response"
              ),
          });

          if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
            const errorMessage = data.error_message || `Places API error: ${data.status}`;
            return yield* Effect.fail(new AttractionsAPIError(errorMessage));
          }

          if (data.results.length > 0) {
            for (const result of data.results) {
              if (seenPlaceIds.has(result.place_id)) continue;

              // Only apply blocking for non-restaurant searches
              if (!isRestaurants && result.types && result.types.some((type) => BLOCKED_PLACE_TYPES.has(type))) {
                continue;
              }

              if (!result.rating || !result.user_ratings_total || result.user_ratings_total < MIN_RATING_COUNT) {
                continue;
              }

              if (!result.geometry?.location) {
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
          const searchType = isRestaurants ? "restaurants" : "attractions";
          return yield* Effect.fail(new NoAttractionsFoundError({ lat, lng }, searchType));
        }

        return allResults;
      });

    const geocode = (
      query: string
    ): Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError | MissingGoogleMapsAPIKeyError> =>
      Effect.gen(function* () {
        const apiKey = yield* config.getGoogleMapsApiKey();

        const validatedQuery = yield* Effect.try({
          try: () => validateNonEmptyString(query),
          catch: (error) => new PlaceNotFoundError(error instanceof ZodError ? error.errors[0].message : query),
        });

        const encodedQuery = encodeURIComponent(validatedQuery);
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedQuery}&key=${apiKey}`;

        const response = yield* Effect.tryPromise({
          try: () => fetch(url),
          catch: (error) =>
            new PlacesAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
        });

        const json = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: () => new PlacesAPIError("Failed to parse API response"),
        });

        const data = yield* Effect.try({
          try: () => GeocodeResponseSchema.parse(json),
          catch: (error) =>
            new PlacesAPIError(
              error instanceof ZodError ? `Invalid API response: ${error.errors[0].message}` : "Invalid API response"
            ),
        });

        if (data.status === "ZERO_RESULTS") {
          return yield* Effect.fail(new PlaceNotFoundError(query));
        }

        if (data.status !== "OK") {
          const errorMessage = data.error_message || `Geocoding API error: ${data.status}`;
          return yield* Effect.fail(new PlacesAPIError(errorMessage));
        }

        if (data.results.length === 0) {
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

        yield* Effect.try({
          try: () => validateCoordinates(lat, lng),
          catch: (error) =>
            new GeocodingError(error instanceof ZodError ? error.errors[0].message : "Invalid coordinates"),
        });

        // Try to find nearby significant place first
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

        const json = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: () => new GeocodingError("Failed to parse API response"),
        });

        const data = yield* Effect.try({
          try: () => GeocodeResponseSchema.parse(json),
          catch: (error) =>
            new GeocodingError(
              error instanceof ZodError ? `Invalid API response: ${error.errors[0].message}` : "Invalid API response"
            ),
        });

        if (data.status === "ZERO_RESULTS") {
          return yield* Effect.fail(new NoResultsError(lat, lng));
        }

        if (data.status !== "OK") {
          const errorMessage = data.error_message || `Geocoding API error: ${data.status}`;
          return yield* Effect.fail(new GeocodingError(errorMessage));
        }

        if (data.results.length === 0) {
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

        const validatedPlaceId = yield* Effect.try({
          try: () => validateNonEmptyString(placeId),
          catch: (error) => new PlaceNotFoundError(error instanceof ZodError ? error.errors[0].message : placeId),
        });

        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(validatedPlaceId)}&fields=place_id,name,formatted_address,geometry&key=${apiKey}`;

        const response = yield* Effect.tryPromise({
          try: () => fetch(url),
          catch: (error) =>
            new PlacesAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
        });

        const json = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: () => new PlacesAPIError("Failed to parse API response"),
        });

        const data = yield* Effect.try({
          try: () => PlaceDetailsResponseSchema.parse(json),
          catch: (error) =>
            new PlacesAPIError(
              error instanceof ZodError ? `Invalid API response: ${error.errors[0].message}` : "Invalid API response"
            ),
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

    const findNearbySignificantPlace = (
      lat: number,
      lng: number,
      apiKey: string
    ): Effect.Effect<Place | undefined, GeocodingError> =>
      Effect.gen(function* () {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${NEARBY_PLACE_SEARCH_RADIUS}&rankby=prominence&key=${apiKey}`;

        const response = yield* Effect.tryPromise({
          try: () => fetch(url),
          catch: (error) =>
            new GeocodingError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
        });

        const json = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: () => new GeocodingError("Failed to parse API response"),
        });

        const data = yield* Effect.try({
          try: () => NearbySearchResponseSchema.parse(json),
          catch: (error) =>
            new GeocodingError(
              error instanceof ZodError ? `Invalid API response: ${error.errors[0].message}` : "Invalid API response"
            ),
        });

        if (data.status === "ZERO_RESULTS" || data.status !== "OK") {
          return undefined;
        }
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

        for (const result of data.results) {
          if (!result.geometry?.location || !result.name || !result.place_id) continue;

          const distance = calculateDistance(lat, lng, result.geometry.location.lat, result.geometry.location.lng);

          if (distance > NEARBY_PLACE_SEARCH_RADIUS) continue;

          const totalScore = calculatePlaceScore(
            distance,
            result.types || [],
            result.rating,
            result.user_ratings_total
          );

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

    const textSearch = (
      query: string
    ): Effect.Effect<Attraction, AttractionNotFoundError | AttractionsAPIError | MissingGoogleMapsAPIKeyError> =>
      Effect.gen(function* () {
        const apiKey = yield* config.getGoogleMapsApiKey();

        const validatedQuery = yield* Effect.try({
          try: () => validateNonEmptyString(query),
          catch: (error) =>
            new AttractionsAPIError(error instanceof ZodError ? error.errors[0].message : "Invalid query"),
        });

        const encodedQuery = encodeURIComponent(validatedQuery);
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${apiKey}`;

        const response = yield* Effect.tryPromise({
          try: () => fetch(url),
          catch: (error) =>
            new AttractionsAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
        });

        const json = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: () => new AttractionsAPIError("Failed to parse API response"),
        });

        const data = yield* Effect.try({
          try: () => TextSearchResponseSchema.parse(json),
          catch: (error) =>
            new AttractionsAPIError(
              error instanceof ZodError ? `Invalid API response: ${error.errors[0].message}` : "Invalid API response"
            ),
        });

        if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
          const errorMessage = data.error_message || `Text Search API error: ${data.status}`;
          return yield* Effect.fail(new AttractionsAPIError(errorMessage));
        }

        if (data.results.length === 0) {
          return yield* Effect.fail(new AttractionNotFoundError(query));
        }

        const result = data.results[0];

        if (!result.geometry?.location || !result.rating || !result.user_ratings_total) {
          return yield* Effect.fail(new AttractionNotFoundError(query));
        }

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

        return attraction;
      });

    return {
      nearbySearch,
      geocode,
      reverseGeocode,
      placeDetails,
      textSearch,
    };
  })
);
