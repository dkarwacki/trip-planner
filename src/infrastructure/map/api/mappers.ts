/**
 * Map API Mappers
 *
 * Purpose: Map infrastructure DTOs to domain types
 *
 * These mappers transform validated DTOs (from schemas) into domain types
 * that the application layer understands. This keeps the application layer
 * pure and independent of infrastructure concerns.
 *
 * Pattern: DTO → Domain transformation
 * - DTOs are infrastructure types (from Zod schemas)
 * - Domain types are pure business types
 * - Mappers bridge the gap between layers
 */

import type {
  ReverseGeocodeCommandDTO,
  AttractionsQueryParamsDTO,
  RestaurantsQueryParamsDTO,
  SuggestNearbyAttractionsCommandDTO,
  SearchPlaceCommandDTO,
  GetPhotoCommandDTO,
} from "./types";
import type {
  ReverseGeocodeCommand,
  GetAttractionsQuery,
  GetRestaurantsQuery,
  SuggestNearbyAttractionsCommand,
  SearchPlaceQuery,
  GetPhotoQuery,
} from "@/domain/map/models";
import { Latitude, Longitude } from "@/domain/common/models";
import { PersonaType } from "@/domain/plan/models";

/**
 * Map infrastructure DTOs to domain commands/queries
 */
export const toDomain = {
  /**
   * Map ReverseGeocodeCommandDTO to ReverseGeocodeCommand
   */
  reverseGeocode: (dto: ReverseGeocodeCommandDTO): ReverseGeocodeCommand => ({
    lat: Latitude(dto.lat),
    lng: Longitude(dto.lng),
  }),

  /**
   * Map AttractionsQueryParamsDTO to GetAttractionsQuery
   */
  getAttractions: (dto: AttractionsQueryParamsDTO): GetAttractionsQuery => ({
    lat: Latitude(dto.lat),
    lng: Longitude(dto.lng),
    radius: dto.radius,
    limit: dto.limit,
  }),

  /**
   * Map RestaurantsQueryParamsDTO to GetRestaurantsQuery
   */
  getRestaurants: (dto: RestaurantsQueryParamsDTO): GetRestaurantsQuery => ({
    lat: Latitude(dto.lat),
    lng: Longitude(dto.lng),
    radius: dto.radius,
    limit: dto.limit,
  }),

  /**
   * Map SuggestNearbyAttractionsCommandDTO to SuggestNearbyAttractionsCommand
   */
  suggestNearbyAttractions: (dto: SuggestNearbyAttractionsCommandDTO): SuggestNearbyAttractionsCommand => ({
    place: {
      id: dto.place.id,
      name: dto.place.name,
      plannedAttractions: dto.place.plannedAttractions.map((a) => ({
        id: a.id,
        name: a.name,
        rating: a.rating,
        userRatingsTotal: a.userRatingsTotal,
        types: a.types,
        vicinity: a.vicinity,
        priceLevel: a.priceLevel,
        location: {
          lat: a.location.lat,
          lng: a.location.lng,
        },
      })),
      plannedRestaurants: dto.place.plannedRestaurants.map((r) => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        userRatingsTotal: r.userRatingsTotal,
        types: r.types,
        vicinity: r.vicinity,
        priceLevel: r.priceLevel,
        location: {
          lat: r.location.lat,
          lng: r.location.lng,
        },
      })),
    },
    mapCoordinates: {
      lat: Latitude(dto.mapCoordinates.lat),
      lng: Longitude(dto.mapCoordinates.lng),
    },
    conversationHistory: dto.conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    userMessage: dto.userMessage,
    personas: dto.personas.map((p) => PersonaType(p)),
  }),

  /**
   * Map SearchPlaceCommandDTO to SearchPlaceQuery
   */
  searchPlace: (dto: SearchPlaceCommandDTO): SearchPlaceQuery => ({
    query: dto.query,
  }),

  /**
   * Map GetPhotoCommandDTO to GetPhotoQuery
   */
  getPhoto: (dto: GetPhotoCommandDTO): GetPhotoQuery => ({
    photoReference: dto.photoReference,
    maxWidth: dto.maxWidth,
    lat: Latitude(dto.lat),
    lng: Longitude(dto.lng),
    placeName: dto.placeName,
  }),
};
