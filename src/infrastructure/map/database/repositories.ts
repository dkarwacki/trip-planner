/**
 * Map Database Repositories
 *
 * Purpose: Persistent cache layer for Google Maps API data
 *
 * Key Patterns:
 * - All methods return Effect.Effect<Result, Error>
 * - No user scoping (global cache shared across users)
 * - Staleness tracking via last_updated_at timestamp
 * - Batch operations optimized for trip loading
 * - 7-day cache refresh policy
 */

import { Effect, Context, Layer } from "effect";
import type { PostgrestError } from "@supabase/supabase-js";
import { SupabaseClient } from "@/infrastructure/common/database";
import type { PlaceDAO, AttractionDAO, PlaceInsertDAO, AttractionInsertDAO } from "./types";
import { rowToPlaceDAO, rowToAttractionDAO, toPlaceInsert, toAttractionInsert } from "./types";

// ============================================================================
// Error Types
// ============================================================================

export class PlaceNotFoundError {
  readonly _tag = "PlaceNotFoundError";
  constructor(readonly googlePlaceId: string) {}
}

export class AttractionNotFoundError {
  readonly _tag = "AttractionNotFoundError";
  constructor(
    readonly googlePlaceId: string,
    readonly type?: "attraction" | "restaurant"
  ) {}
}

export class DatabaseError {
  readonly _tag = "DatabaseError";
  constructor(
    readonly operation: string,
    readonly message: string,
    readonly cause?: PostgrestError | unknown
  ) {}
}

// ============================================================================
// PlaceRepository
// ============================================================================

export interface IPlaceRepository {
  findByGooglePlaceId: (googlePlaceId: string) => Effect.Effect<PlaceDAO, PlaceNotFoundError | DatabaseError>;
  upsert: (placeData: PlaceInsertDAO) => Effect.Effect<PlaceDAO, DatabaseError>;
  findByIds: (ids: string[]) => Effect.Effect<PlaceDAO[], DatabaseError>;
  findStale: (days: number) => Effect.Effect<PlaceDAO[], DatabaseError>;
}

export class PlaceRepository extends Context.Tag("PlaceRepository")<PlaceRepository, IPlaceRepository>() {}

export const PlaceRepositoryLive = Layer.effect(
  PlaceRepository,
  Effect.gen(function* () {
    const supabase = yield* SupabaseClient;

    const findByGooglePlaceId = (googlePlaceId: string): Effect.Effect<PlaceDAO, PlaceNotFoundError | DatabaseError> =>
      Effect.gen(function* () {
        const { data, error } = yield* Effect.promise(() =>
          supabase.client.from("places").select("*").eq("google_place_id", googlePlaceId).maybeSingle()
        );

        if (error) {
          return yield* Effect.fail(new DatabaseError("findByGooglePlaceId", error.message, error));
        }

        if (!data) {
          return yield* Effect.fail(new PlaceNotFoundError(googlePlaceId));
        }

        return rowToPlaceDAO(data);
      });

    const upsert = (placeData: PlaceInsertDAO): Effect.Effect<PlaceDAO, DatabaseError> =>
      Effect.gen(function* () {
        const insert = toPlaceInsert(placeData);

        const { data, error } = yield* Effect.promise(() =>
          supabase.client
            .from("places")
            .upsert(insert, {
              onConflict: "google_place_id",
            })
            .select()
            .single()
        );

        if (error) {
          return yield* Effect.fail(new DatabaseError("upsert", error.message, error));
        }

        return rowToPlaceDAO(data);
      });

    const findByIds = (ids: string[]): Effect.Effect<PlaceDAO[], DatabaseError> =>
      Effect.gen(function* () {
        if (ids.length === 0) {
          return [];
        }

        const { data, error } = yield* Effect.promise(() => supabase.client.from("places").select("*").in("id", ids));

        if (error) {
          return yield* Effect.fail(new DatabaseError("findByIds", error.message, error));
        }

        return (data ?? []).map(rowToPlaceDAO);
      });

    const findStale = (days: number): Effect.Effect<PlaceDAO[], DatabaseError> =>
      Effect.gen(function* () {
        const staleDate = new Date();
        staleDate.setDate(staleDate.getDate() - days);

        const { data, error } = yield* Effect.promise(() =>
          supabase.client.from("places").select("*").lt("last_updated_at", staleDate.toISOString())
        );

        if (error) {
          return yield* Effect.fail(new DatabaseError("findStale", error.message, error));
        }

        return (data ?? []).map(rowToPlaceDAO);
      });

    return {
      findByGooglePlaceId,
      upsert,
      findByIds,
      findStale,
    };
  })
);

// ============================================================================
// AttractionRepository
// ============================================================================

export interface IAttractionRepository {
  findByGooglePlaceId: (
    googlePlaceId: string,
    type?: "attraction" | "restaurant"
  ) => Effect.Effect<AttractionDAO, AttractionNotFoundError | DatabaseError>;
  upsert: (attractionData: AttractionInsertDAO) => Effect.Effect<AttractionDAO, DatabaseError>;
  findByIds: (ids: string[]) => Effect.Effect<AttractionDAO[], DatabaseError>;
  findStale: (days: number, type?: "attraction" | "restaurant") => Effect.Effect<AttractionDAO[], DatabaseError>;
}

export class AttractionRepository extends Context.Tag("AttractionRepository")<
  AttractionRepository,
  IAttractionRepository
>() {}

export const AttractionRepositoryLive = Layer.effect(
  AttractionRepository,
  Effect.gen(function* () {
    const supabase = yield* SupabaseClient;

    const findByGooglePlaceId = (
      googlePlaceId: string,
      type?: "attraction" | "restaurant"
    ): Effect.Effect<AttractionDAO, AttractionNotFoundError | DatabaseError> =>
      Effect.gen(function* () {
        let query = supabase.client.from("attractions").select("*").eq("google_place_id", googlePlaceId);

        if (type) {
          query = query.eq("type", type);
        }

        const { data, error } = yield* Effect.promise(() => query.maybeSingle());

        if (error) {
          return yield* Effect.fail(new DatabaseError("findByGooglePlaceId", error.message, error));
        }

        if (!data) {
          return yield* Effect.fail(new AttractionNotFoundError(googlePlaceId, type));
        }

        return rowToAttractionDAO(data);
      });

    const upsert = (attractionData: AttractionInsertDAO): Effect.Effect<AttractionDAO, DatabaseError> =>
      Effect.gen(function* () {
        const insert = toAttractionInsert(attractionData);

        const { data, error } = yield* Effect.promise(() =>
          supabase.client
            .from("attractions")
            .upsert(insert, {
              onConflict: "google_place_id",
            })
            .select()
            .single()
        );

        if (error) {
          return yield* Effect.fail(new DatabaseError("upsert", error.message, error));
        }

        return rowToAttractionDAO(data);
      });

    const findByIds = (ids: string[]): Effect.Effect<AttractionDAO[], DatabaseError> =>
      Effect.gen(function* () {
        if (ids.length === 0) {
          return [];
        }

        const { data, error } = yield* Effect.promise(() =>
          supabase.client.from("attractions").select("*").in("id", ids)
        );

        if (error) {
          return yield* Effect.fail(new DatabaseError("findByIds", error.message, error));
        }

        return (data ?? []).map(rowToAttractionDAO);
      });

    const findStale = (
      days: number,
      type?: "attraction" | "restaurant"
    ): Effect.Effect<AttractionDAO[], DatabaseError> =>
      Effect.gen(function* () {
        const staleDate = new Date();
        staleDate.setDate(staleDate.getDate() - days);

        let query = supabase.client.from("attractions").select("*").lt("last_updated_at", staleDate.toISOString());

        if (type) {
          query = query.eq("type", type);
        }

        const { data, error } = yield* Effect.promise(() => query);

        if (error) {
          return yield* Effect.fail(new DatabaseError("findStale", error.message, error));
        }

        return (data ?? []).map(rowToAttractionDAO);
      });

    return {
      findByGooglePlaceId,
      upsert,
      findByIds,
      findStale,
    };
  })
);
