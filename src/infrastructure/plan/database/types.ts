/**
 * Plan Database DAOs (Data Access Objects)
 *
 * Purpose: Type-safe mapping between database rows (snake_case) and domain models (camelCase)
 *
 * This file provides:
 * - DAO interfaces that mirror database schema in camelCase for better TypeScript ergonomics
 * - Converters from domain models to database Insert types (for writes)
 * - Converters from database Row types to DAOs (snake_case → camelCase)
 * - Converters from DAOs to domain models (for reads)
 */

import type { Database, TablesInsert } from "@/infrastructure/common/database/types";
import type { SavedConversation, SavedTrip, PersonaType, ChatMessage, PlaceSuggestion } from "@/domain/plan/models";
import { ConversationId, ConversationTimestamp, TripId, TripTimestamp, MessageId } from "@/domain/plan/models";
import type { Place, PlacePhoto } from "@/domain/common/models";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";

// Extract database types for easier reference
type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
type TripRow = Database["public"]["Tables"]["trips"]["Row"];
type UserPersonasRow = Database["public"]["Tables"]["user_personas"]["Row"];

// ============================================================================
// Nested DAO Interfaces (for JSONB structures)
// ============================================================================

export interface PlaceSuggestionDAO {
  id?: string;
  name: string;
  description: string;
  reasoning: string;
  lat?: number;
  lng?: number;
  photos?: PlacePhotoDAO[];
  validationStatus?: "verified" | "not_found" | "partial";
  searchQuery?: string;
}

export interface PlacePhotoDAO {
  photoReference: string;
  width: number;
  height: number;
  attributions: string[];
}

export interface ChatMessageDAO {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  suggestedPlaces?: PlaceSuggestionDAO[];
  thinking?: string[];
}

export interface AttractionDAO {
  id: string;
  name: string;
  rating?: number;
  userRatingsTotal?: number;
  types: string[];
  vicinity: string;
  priceLevel?: number;
  location: {
    lat: number;
    lng: number;
  };
  photos?: PlacePhotoDAO[];
}

export interface PlaceDAO {
  id: string;
  name: string;
  lat: number;
  lng: number;
  plannedAttractions: AttractionDAO[];
  plannedRestaurants: AttractionDAO[];
  photos?: PlacePhotoDAO[];
}

// ============================================================================
// Top-level DAO Interfaces (camelCase for TypeScript ergonomics)
// ============================================================================

export interface ConversationDAO {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessageDAO[];
  personas: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TripDAO {
  id: string;
  userId: string;
  title: string;
  placesData: PlaceDAO[];
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPersonasDAO {
  userId: string;
  personaTypes: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Converters: DAO → Database Insert
// ============================================================================

export const toConversationInsert = (userId: string, dao: ConversationDAO): TablesInsert<"conversations"> => ({
  id: dao.id,
  user_id: userId,
  title: dao.title,
  messages: dao.messages as never,
  personas: dao.personas as never,
  created_at: dao.createdAt,
  updated_at: dao.updatedAt,
});

export const toTripInsert = (userId: string, dao: TripDAO): TablesInsert<"trips"> => ({
  id: dao.id,
  user_id: userId,
  title: dao.title,
  places_data: dao.placesData as never,
  conversation_id: dao.conversationId,
  created_at: dao.createdAt,
  updated_at: dao.updatedAt,
});

export const toUserPersonasInsert = (userId: string, personas: string[]): TablesInsert<"user_personas"> => ({
  user_id: userId,
  persona_types: personas as never,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// ============================================================================
// Converters: Database Row → DAO (snake_case → camelCase)
// ============================================================================

export const rowToConversationDAO = (row: ConversationRow): ConversationDAO => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  messages: row.messages as unknown as ChatMessageDAO[],
  personas: row.personas as unknown as string[],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const rowToTripDAO = (row: TripRow): TripDAO => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  placesData: row.places_data as unknown as PlaceDAO[],
  conversationId: row.conversation_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const rowToUserPersonasDAO = (row: UserPersonasRow): UserPersonasDAO => ({
  userId: row.user_id,
  personaTypes: row.persona_types as unknown as string[],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// ============================================================================
// Converters: DAO → Domain Models (nested structures)
// ============================================================================

const toPlacePhoto = (dao: PlacePhotoDAO): PlacePhoto => ({
  photoReference: dao.photoReference,
  width: dao.width,
  height: dao.height,
  attributions: dao.attributions,
});

const toPlaceSuggestion = (dao: PlaceSuggestionDAO): PlaceSuggestion => ({
  id: dao.id,
  name: dao.name,
  description: dao.description,
  reasoning: dao.reasoning,
  lat: dao.lat,
  lng: dao.lng,
  photos: dao.photos?.map(toPlacePhoto),
  validationStatus: dao.validationStatus,
  searchQuery: dao.searchQuery,
});

const toChatMessage = (dao: ChatMessageDAO): ChatMessage => ({
  id: MessageId(dao.id),
  role: dao.role,
  content: dao.content,
  timestamp: dao.timestamp,
  suggestedPlaces: dao.suggestedPlaces?.map(toPlaceSuggestion),
  thinking: dao.thinking,
});

const toAttraction = (dao: AttractionDAO): Place["plannedAttractions"][number] => ({
  id: PlaceId(dao.id),
  name: dao.name,
  rating: dao.rating,
  userRatingsTotal: dao.userRatingsTotal,
  types: dao.types,
  vicinity: dao.vicinity,
  priceLevel: dao.priceLevel,
  location: {
    lat: Latitude(dao.location.lat),
    lng: Longitude(dao.location.lng),
  },
  photos: dao.photos?.map(toPlacePhoto),
});

const toPlace = (dao: PlaceDAO): Place => ({
  id: PlaceId(dao.id),
  name: dao.name,
  lat: Latitude(dao.lat),
  lng: Longitude(dao.lng),
  plannedAttractions: dao.plannedAttractions.map(toAttraction),
  plannedRestaurants: dao.plannedRestaurants.map(toAttraction),
  photos: dao.photos?.map(toPlacePhoto),
});

// ============================================================================
// Converters: DAO → Domain Models (top-level)
// ============================================================================

export const toSavedConversation = (dao: ConversationDAO): SavedConversation => {
  return {
    id: ConversationId(dao.id),
    title: dao.title,
    messages: dao.messages.map(toChatMessage),
    personas: dao.personas,
    timestamp: ConversationTimestamp(new Date(dao.createdAt).getTime()),
    lastUpdated: ConversationTimestamp(new Date(dao.updatedAt).getTime()),
    messageCount: dao.messages.length,
  };
};

export const toSavedTrip = (dao: TripDAO): SavedTrip => {
  return {
    id: TripId(dao.id),
    title: dao.title,
    places: dao.placesData.map(toPlace),
    timestamp: TripTimestamp(new Date(dao.createdAt).getTime()),
    placeCount: dao.placesData.length,
    conversationId: dao.conversationId ? ConversationId(dao.conversationId) : undefined,
  };
};

export const toPersonaTypes = (dao: UserPersonasDAO): PersonaType[] => {
  // Cast string[] to PersonaType[] (branded types)
  return dao.personaTypes as PersonaType[];
};
