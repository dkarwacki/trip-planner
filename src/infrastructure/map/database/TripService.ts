/**
 * Trip Service for Map
 *
 * Purpose: High-level service for trip management operations used by map
 * - Auto-create trips for map sessions
 * - Load existing trips
 * - Handle trip switching
 * - Provide convenient trip operations
 */

import { Effect, Context, Layer } from "effect";
import { TripRepository, type TripDAO } from "@/infrastructure/plan/database";
import type { PlaceDAO } from "@/infrastructure/plan/database/types";

// ============================================================================
// Service Interface
// ============================================================================

export interface ITripService {
  /**
   * Get current trip or create a new one if none exists
   * Returns the most recently updated trip, or creates a new one
   */
  getCurrentOrCreate: (userId: string) => Effect.Effect<TripDAO, never>;

  /**
   * Get recent trips for trip selector (limit 10, ordered by updated_at DESC)
   */
  getRecentTrips: (userId: string) => Effect.Effect<TripDAO[], never>;

  /**
   * Load a specific trip by ID
   */
  loadTrip: (userId: string, tripId: string) => Effect.Effect<TripDAO | null, never>;

  /**
   * Load trip by conversation ID
   */
  loadTripByConversation: (userId: string, conversationId: string) => Effect.Effect<TripDAO | null, never>;

  /**
   * Create a new trip
   */
  createTrip: (userId: string, title?: string, conversationId?: string) => Effect.Effect<TripDAO, never>;

  /**
   * Update trip places (for auto-save)
   * Optionally update title as well
   */
  updateTripPlaces: (userId: string, tripId: string, places: PlaceDAO[], title?: string) => Effect.Effect<void, never>;

  /**
   * Delete a trip
   */
  deleteTrip: (userId: string, tripId: string) => Effect.Effect<void, never>;
}

export class TripService extends Context.Tag("TripService")<TripService, ITripService>() {}

// ============================================================================
// Service Implementation
// ============================================================================

export const TripServiceLive = Layer.effect(
  TripService,
  Effect.gen(function* () {
    const tripRepo = yield* TripRepository;

    const getCurrentOrCreate = (userId: string): Effect.Effect<TripDAO, never> =>
      Effect.gen(function* () {
        // Get all trips and return the most recently updated one
        const trips = yield* tripRepo.findAll(userId).pipe(Effect.catchAll(() => Effect.succeed([])));

        if (trips.length > 0) {
          // Return most recent trip (already sorted by created_at DESC)
          // But we want by updated_at, so let's sort
          const sorted = [...trips].sort((a, b) => {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
          return sorted[0];
        }

        // No trips exist, create a new one
        const now = new Date().toISOString();
        const newTrip: TripDAO = {
          id: crypto.randomUUID(),
          userId,
          title: "Trip to ...",
          placesData: [],
          conversationId: null,
          createdAt: now,
          updatedAt: now,
        };

        yield* tripRepo.create(userId, newTrip).pipe(
          Effect.catchAll((error) => {
            console.error("Failed to create trip:", error);
            return Effect.succeed(undefined);
          })
        );

        return newTrip;
      });

    const getRecentTrips = (userId: string): Effect.Effect<TripDAO[], never> =>
      Effect.gen(function* () {
        const trips = yield* tripRepo.findAll(userId).pipe(Effect.catchAll(() => Effect.succeed([])));

        // Sort by updated_at DESC and limit to 10
        const sorted = [...trips].sort((a, b) => {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        return sorted.slice(0, 10);
      });

    const loadTrip = (userId: string, tripId: string): Effect.Effect<TripDAO | null, never> =>
      Effect.gen(function* () {
        const trip = yield* tripRepo.findById(userId, tripId).pipe(Effect.catchAll(() => Effect.succeed(null)));
        return trip;
      });

    const loadTripByConversation = (userId: string, conversationId: string): Effect.Effect<TripDAO | null, never> =>
      Effect.gen(function* () {
        const trip = yield* tripRepo
          .findByConversationId(userId, conversationId)
          .pipe(Effect.catchAll(() => Effect.succeed(null)));
        return trip;
      });

    const createTrip = (userId: string, title?: string, conversationId?: string): Effect.Effect<TripDAO, never> =>
      Effect.gen(function* () {
        const now = new Date().toISOString();
        const defaultTitle = title || "Trip to ...";

        const newTrip: TripDAO = {
          id: crypto.randomUUID(),
          userId,
          title: defaultTitle,
          placesData: [],
          conversationId: conversationId || null,
          createdAt: now,
          updatedAt: now,
        };

        yield* tripRepo.create(userId, newTrip).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        return newTrip;
      });

    const updateTripPlaces = (
      userId: string,
      tripId: string,
      places: PlaceDAO[],
      title?: string
    ): Effect.Effect<void, never> =>
      Effect.gen(function* () {
        // Update places
        yield* tripRepo.updatePlaces(userId, tripId, places).pipe(Effect.catchAll(() => Effect.succeed(undefined)));

        // Update title if provided
        if (title !== undefined) {
          yield* tripRepo.updateTitle(userId, tripId, title).pipe(Effect.catchAll(() => Effect.succeed(undefined)));
        }
      });

    const deleteTrip = (userId: string, tripId: string): Effect.Effect<void, never> =>
      Effect.gen(function* () {
        yield* tripRepo.delete(userId, tripId).pipe(Effect.catchAll(() => Effect.succeed(undefined)));
      });

    return {
      getCurrentOrCreate,
      getRecentTrips,
      loadTrip,
      loadTripByConversation,
      createTrip,
      updateTripPlaces,
      deleteTrip,
    };
  })
);
