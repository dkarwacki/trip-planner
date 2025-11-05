import { Effect, Context, Layer } from "effect";
import { ZodError } from "zod";
import type { Attraction } from "@/domain/map/models";
import type { Place, PlacePhoto } from "@/domain/common/models";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";
import {
  NoAttractionsFoundError,
  AttractionsAPIError,
  AttractionNotFoundError,
  PlaceNotFoundError,
  PlacesAPIError,
  NoResultsError,
  GeocodingError,
} from "@/domain/map/errors";
import { MissingGoogleMapsAPIKeyError } from "@/domain/common/errors";
import { ConfigService } from "@/infrastructure/common/config";
import {
  NearbySearchResponseSchema,
  GeocodeResponseSchema,
  PlaceDetailsResponseSchema,
  TextSearchResponseSchema,
  validateSearchRadius,
  validateNonEmptyString,
  validateCoordinates,
  type Place as PlaceResponse,
} from "./validation";
import { isRestaurantSearch, MIN_RATING_COUNT } from "./helpers";
import { BLOCKED_PLACE_TYPES } from "./constants";

// Dev stats counter (in-memory, resets on server restart)
const apiCallStats = {
  nearbySearch: 0,
  geocode: 0,
  reverseGeocode: 0,
  placeDetails: 0,
  textSearch: 0,
  searchPlace: 0,
};

export const getApiCallStats = () => ({ ...apiCallStats });
export const resetApiCallStats = () => {
  Object.keys(apiCallStats).forEach((key) => {
    apiCallStats[key as keyof typeof apiCallStats] = 0;
  });
};

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
    placeId: string,
    includePhotos?: boolean
  ) => Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError | MissingGoogleMapsAPIKeyError>;

  readonly textSearch: (
    query: string,
    includePhotos?: boolean,
    requireRatings?: boolean
  ) => Effect.Effect<Attraction, AttractionNotFoundError | AttractionsAPIError | MissingGoogleMapsAPIKeyError>;

  readonly searchPlace: (
    query: string
  ) => Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError | MissingGoogleMapsAPIKeyError>;
}

export class GoogleMapsClient extends Context.Tag("GoogleMapsClient")<GoogleMapsClient, IGoogleMapsClient>() {}

export const GoogleMapsClientLive = Layer.effect(
  GoogleMapsClient,
  Effect.gen(function* () {
    const config = yield* ConfigService;

    // Helper to process a single place result from Places API
    const processPlaceResult = (
      place: PlaceResponse,
      seenPlaceIds: Set<string>,
      allResults: Attraction[],
      isRestaurants: boolean
    ): void => {
      if (seenPlaceIds.has(place.id)) return;

      // Only apply blocking for non-restaurant searches
      if (!isRestaurants && place.types && place.types.some((type) => BLOCKED_PLACE_TYPES.has(type))) {
        return;
      }

      if (!place.rating || !place.userRatingCount || place.userRatingCount < MIN_RATING_COUNT) {
        return;
      }

      if (!place.location) {
        return;
      }

      seenPlaceIds.add(place.id);

      // Convert price level string to number (legacy format compatibility)
      let priceLevel: number | undefined;
      if (place.priceLevel) {
        const priceLevelMap: Record<string, number> = {
          PRICE_LEVEL_FREE: 0,
          PRICE_LEVEL_INEXPENSIVE: 1,
          PRICE_LEVEL_MODERATE: 2,
          PRICE_LEVEL_EXPENSIVE: 3,
          PRICE_LEVEL_VERY_EXPENSIVE: 4,
        };
        priceLevel = priceLevelMap[place.priceLevel];
      }

      const attraction: Attraction = {
        id: PlaceId(place.id),
        name: place.displayName?.text || "Unknown",
        rating: place.rating,
        userRatingsTotal: place.userRatingCount,
        types: place.types || [],
        vicinity: "", // Not available in new API response
        priceLevel,
        openNow: place.currentOpeningHours?.openNow,
        location: {
          lat: Latitude(place.location.latitude),
          lng: Longitude(place.location.longitude),
        },
      };

      // Add photos if available (max 1 photo for list view)
      if (place.photos && place.photos.length > 0) {
        attraction.photos = place.photos.slice(0, 1).map(
          (photo): PlacePhoto => ({
            // Extract photo reference from name: "places/{place_id}/photos/{photo_reference}"
            photoReference: photo.name.split("/").pop() || photo.name,
            width: photo.widthPx,
            height: photo.heightPx,
            attributions: photo.authorAttributions?.map((attr) => attr.displayName || attr.uri || "") || [],
          })
        );
      }

      allResults.push(attraction);
    };

    const nearbySearch = (
      lat: number,
      lng: number,
      radius: number,
      types: readonly string[]
    ): Effect.Effect<Attraction[], NoAttractionsFoundError | AttractionsAPIError | MissingGoogleMapsAPIKeyError> =>
      Effect.gen(function* () {
        apiCallStats.nearbySearch++;
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

        const isRestaurants = isRestaurantSearch(types);
        const allResults: Attraction[] = [];
        const seenPlaceIds = new Set<string>();

        // Use Nearby Search API with includedTypes parameter
        const url = `https://places.googleapis.com/v1/places:searchNearby`;

        const requestBody = {
          includedTypes: Array.from(types),
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: {
                latitude: lat,
                longitude: lng,
              },
              radius: validatedRadius,
            },
          },
        };

        const response = yield* Effect.tryPromise({
          try: () =>
            fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask":
                  "places.id,places.displayName,places.types,places.location,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.photos",
              },
              body: JSON.stringify(requestBody),
            }),
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

        // Process results from Places API
        for (const place of data.places) {
          processPlaceResult(place, seenPlaceIds, allResults, isRestaurants);
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
        apiCallStats.geocode++;
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
        apiCallStats.reverseGeocode++;
        const apiKey = yield* config.getGoogleMapsApiKey();

        yield* Effect.try({
          try: () => validateCoordinates(lat, lng),
          catch: (error) =>
            new GeocodingError(error instanceof ZodError ? error.errors[0].message : "Invalid coordinates"),
        });

        // Use reverse geocoding
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
      placeId: string,
      includePhotos = false
    ): Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError | MissingGoogleMapsAPIKeyError> =>
      Effect.gen(function* () {
        apiCallStats.placeDetails++;
        const apiKey = yield* config.getGoogleMapsApiKey();

        const validatedPlaceId = yield* Effect.try({
          try: () => validateNonEmptyString(placeId),
          catch: (error) => new PlaceNotFoundError(error instanceof ZodError ? error.errors[0].message : placeId),
        });

        // Use Place Details API
        const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(validatedPlaceId)}`;

        const fieldMask = includePhotos
          ? "id,displayName,formattedAddress,location,photos"
          : "id,displayName,formattedAddress,location";

        const response = yield* Effect.tryPromise({
          try: () =>
            fetch(url, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": fieldMask,
              },
            }),
          catch: (error) =>
            new PlacesAPIError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`),
        });

        if (!response.ok) {
          if (response.status === 404) {
            return yield* Effect.fail(new PlaceNotFoundError(placeId));
          }
          return yield* Effect.fail(new PlacesAPIError(`API error: ${response.status} ${response.statusText}`));
        }

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

        if (!data.location) {
          return yield* Effect.fail(new PlaceNotFoundError(placeId));
        }

        const place: Place = {
          id: PlaceId(data.id),
          name: data.displayName?.text || data.formattedAddress || "Unknown",
          lat: Latitude(data.location.latitude),
          lng: Longitude(data.location.longitude),
          plannedAttractions: [],
          plannedRestaurants: [],
        };

        // Add photos if requested and available
        if (includePhotos && data.photos && data.photos.length > 0) {
          // Store photo references (max 2 photos)
          place.photos = data.photos.slice(0, 2).map(
            (photo): PlacePhoto => ({
              // Extract photo reference from name: "places/{place_id}/photos/{photo_reference}"
              photoReference: photo.name.split("/").pop() || photo.name,
              width: photo.widthPx,
              height: photo.heightPx,
              attributions: photo.authorAttributions?.map((attr) => attr.displayName || attr.uri || "") || [],
            })
          );
        }

        return place;
      });

    const textSearch = (
      query: string,
      includePhotos = false,
      requireRatings = true
    ): Effect.Effect<Attraction, AttractionNotFoundError | AttractionsAPIError | MissingGoogleMapsAPIKeyError> =>
      Effect.gen(function* () {
        apiCallStats.textSearch++;
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

        // Validate location is present
        if (!result.geometry?.location) {
          return yield* Effect.fail(new AttractionNotFoundError(query));
        }

        // Validate ratings if required (for attractions/restaurants) but not for geographic locations (towns/cities)
        if (requireRatings && (!result.rating || !result.user_ratings_total)) {
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

        if (includePhotos && result.photos && result.photos.length > 0) {
          attraction.photos = result.photos.slice(0, 2).map(
            (photo): PlacePhoto => ({
              photoReference: photo.photo_reference,
              width: photo.width,
              height: photo.height,
              attributions: photo.html_attributions || [],
            })
          );
        }

        return attraction;
      });

    const searchPlace = (
      query: string
    ): Effect.Effect<Place, PlaceNotFoundError | PlacesAPIError | MissingGoogleMapsAPIKeyError> =>
      Effect.gen(function* () {
        apiCallStats.searchPlace++;
        const apiKey = yield* config.getGoogleMapsApiKey();

        const validatedQuery = yield* Effect.try({
          try: () => validateNonEmptyString(query),
          catch: (error) => new PlaceNotFoundError(error instanceof ZodError ? error.errors[0].message : query),
        });

        const encodedQuery = encodeURIComponent(validatedQuery);
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${apiKey}`;

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
          try: () => TextSearchResponseSchema.parse(json),
          catch: (error) =>
            new PlacesAPIError(
              error instanceof ZodError ? `Invalid API response: ${error.errors[0].message}` : "Invalid API response"
            ),
        });

        if (data.status === "ZERO_RESULTS") {
          return yield* Effect.fail(new PlaceNotFoundError(query));
        }

        if (data.status !== "OK") {
          const errorMessage = data.error_message || `Text Search API error: ${data.status}`;
          return yield* Effect.fail(new PlacesAPIError(errorMessage));
        }

        if (data.results.length === 0) {
          return yield* Effect.fail(new PlaceNotFoundError(query));
        }

        const result = data.results[0];

        if (!result.geometry?.location) {
          return yield* Effect.fail(new PlaceNotFoundError(query));
        }

        const place: Place = {
          id: PlaceId(result.place_id),
          name: result.name,
          lat: Latitude(result.geometry.location.lat),
          lng: Longitude(result.geometry.location.lng),
          plannedAttractions: [],
          plannedRestaurants: [],
        };

        return place;
      });

    return {
      nearbySearch,
      geocode,
      reverseGeocode,
      placeDetails,
      textSearch,
      searchPlace,
    };
  })
);
