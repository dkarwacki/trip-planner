import type { SavedTrip, ConversationId } from "@/domain/plan/models";
import { TripId, TripTimestamp, ConversationId as ConversationIdBrand } from "@/domain/plan/models";
import type { Place } from "@/domain/common/models";
import { PlaceId, Latitude, Longitude } from "@/domain/common/models";

// API response types (matching server responses)
interface TripListResponse {
  trips: {
    id: string;
    user_id: string;
    conversation_id: string | null;
    title: string;
    place_count: number;
    created_at: string;
    updated_at: string;
  }[];
}

interface TripDetailResponse {
  id: string;
  user_id: string;
  conversation_id: string | null;
  title: string;
  places: {
    place: {
      id: string;
      google_place_id: string;
      name: string;
      latitude: number;
      longitude: number;
      photos: {
        photoReference: string;
        width: number;
        height: number;
        attributions: string[];
      }[];
      validation_status: "verified" | "not_found" | "partial";
    };
    display_order: number;
    attractions: {
      id: string;
      google_place_id: string;
      type: "attraction";
      name: string;
      rating: number | null;
      user_ratings_total: number | null;
      types: string[];
      vicinity: string;
      latitude: number;
      longitude: number;
      photos?: {
        photoReference: string;
        width: number;
        height: number;
        attributions: string[];
      }[];
      quality_score: number | null;
      persona_score: number | null;
      diversity_score: number | null;
      confidence_score: number | null;
    }[];
    restaurants: {
      id: string;
      google_place_id: string;
      type: "restaurant";
      name: string;
      rating: number | null;
      user_ratings_total: number | null;
      types: string[];
      vicinity: string;
      price_level: number | null;
      latitude: number;
      longitude: number;
      photos?: {
        photoReference: string;
        width: number;
        height: number;
        attributions: string[];
      }[];
      quality_score: number | null;
      persona_score: number | null;
      diversity_score: number | null;
      confidence_score: number | null;
    }[];
  }[];
  created_at: string;
  updated_at: string;
}

interface ErrorResponse {
  error: string;
}

/**
 * Convert TripDetailResponse to domain SavedTrip
 */
function tripDetailToSavedTrip(detail: TripDetailResponse): SavedTrip {
  const places: Place[] = detail.places.map((tripPlace) => ({
    id: PlaceId(tripPlace.place.id),
    name: tripPlace.place.name,
    lat: Latitude(tripPlace.place.latitude),
    lng: Longitude(tripPlace.place.longitude),
    plannedAttractions: tripPlace.attractions.map((attr) => ({
      id: PlaceId(attr.id),
      name: attr.name,
      rating: attr.rating ?? undefined,
      userRatingsTotal: attr.user_ratings_total ?? undefined,
      types: attr.types,
      vicinity: attr.vicinity,
      priceLevel: undefined, // Attractions don't have price level
      location: {
        lat: Latitude(attr.latitude),
        lng: Longitude(attr.longitude),
      },
      photos: attr.photos,
    })),
    plannedRestaurants: tripPlace.restaurants.map((rest) => ({
      id: PlaceId(rest.id),
      name: rest.name,
      rating: rest.rating ?? undefined,
      userRatingsTotal: rest.user_ratings_total ?? undefined,
      types: rest.types,
      vicinity: rest.vicinity,
      priceLevel: rest.price_level ?? undefined,
      location: {
        lat: Latitude(rest.latitude),
        lng: Longitude(rest.longitude),
      },
      photos: rest.photos,
    })),
    photos: tripPlace.place.photos,
  }));

  return {
    id: TripId(detail.id),
    title: detail.title,
    places,
    timestamp: TripTimestamp(new Date(detail.created_at).getTime()),
    placeCount: places.length,
    conversationId: detail.conversation_id ? ConversationIdBrand(detail.conversation_id) : undefined,
  };
}

/**
 * Get all user trips (newest first)
 */
export const getAllTrips = async (): Promise<SavedTrip[]> => {
  const response = await fetch("/api/trips");

  if (!response.ok) {
    throw new Error(`Failed to load trips: ${response.statusText}`);
  }

  const data: TripListResponse | ErrorResponse = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }

  // Convert to SavedTrip format (simplified without full place data)
  return data.trips.map((trip) => ({
    id: TripId(trip.id),
    title: trip.title,
    places: [], // List view doesn't include full places
    timestamp: TripTimestamp(new Date(trip.created_at).getTime()),
    placeCount: trip.place_count,
    conversationId: trip.conversation_id ? ConversationIdBrand(trip.conversation_id) : undefined,
  }));
};

/**
 * Get single trip with full place data
 */
export const getTrip = async (tripId: string): Promise<SavedTrip> => {
  const response = await fetch(`/api/trips/${tripId}`);

  if (!response.ok) {
    throw new Error(`Failed to load trip: ${response.statusText}`);
  }

  const data: TripDetailResponse | ErrorResponse = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }

  return tripDetailToSavedTrip(data);
};

/**
 * Create new trip from Place[] data
 * Returns the created trip ID
 */
export const createTrip = async (places: Place[], conversationId?: ConversationId): Promise<string> => {
  const title = places.length > 0 ? `Trip to ${places[0].name}` : "Untitled Trip";

  const response = await fetch("/api/trips", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      places,
      conversation_id: conversationId || null,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create trip: ${response.statusText}`);
  }

  const data: TripDetailResponse | ErrorResponse = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }

  return data.id;
};

/**
 * Update trip places (auto-save from map)
 */
export const updateTrip = async (tripId: string, places: Place[]): Promise<void> => {
  const response = await fetch(`/api/trips/${tripId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ places }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update trip: ${response.statusText}`);
  }

  const data = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }
};

/**
 * Delete trip
 */
export const deleteTrip = async (tripId: string): Promise<void> => {
  const response = await fetch(`/api/trips/${tripId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete trip: ${response.statusText}`);
  }

  const data = await response.json();

  if ("error" in data) {
    throw new Error(data.error);
  }
};

/**
 * Get trip for conversation (one-to-one)
 * Returns null if no trip found
 */
export const getTripForConversation = async (conversationId: ConversationId): Promise<SavedTrip | null> => {
  const response = await fetch(`/api/trips/by-conversation/${conversationId}`);

  if (!response.ok) {
    throw new Error(`Failed to load trip for conversation: ${response.statusText}`);
  }

  const data: TripDetailResponse | null | ErrorResponse = await response.json();

  if (data === null) {
    return null;
  }

  if ("error" in data) {
    throw new Error(data.error);
  }

  return tripDetailToSavedTrip(data);
};
