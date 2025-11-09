/**
 * Plan Database Repositories
 *
 * Purpose: Effect-based data access layer for user-facing data (conversations, trips, personas)
 *
 * Key Patterns:
 * - All methods return Effect.Effect<Result, Error>
 * - All queries scoped by userId for security
 * - Use Effect.gen for composition
 * - Tagged errors for type-safe error handling
 * - No user scoping for cache data (shared across users)
 */

import { Effect, Context, Layer } from "effect";
import type { PostgrestError } from "@supabase/supabase-js";
import { SupabaseClient } from "@/infrastructure/common/database";
import type { ConversationDAO, TripDAO, UserPersonasDAO, ChatMessageDAO, PlaceDAO } from "./types";
import {
  rowToConversationDAO,
  rowToTripDAO,
  rowToUserPersonasDAO,
  toConversationInsert,
  toTripInsert,
  toUserPersonasInsert,
} from "./types";

// ============================================================================
// Error Types
// ============================================================================

export class ConversationNotFoundError {
  readonly _tag = "ConversationNotFoundError";
  constructor(
    readonly userId: string,
    readonly conversationId: string
  ) {}
}

export class TripNotFoundError {
  readonly _tag = "TripNotFoundError";
  constructor(
    readonly userId: string,
    readonly tripId: string
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
// ConversationRepository
// ============================================================================

export interface IConversationRepository {
  findById: (
    userId: string,
    conversationId: string
  ) => Effect.Effect<ConversationDAO, ConversationNotFoundError | DatabaseError>;
  findAll: (userId: string) => Effect.Effect<ConversationDAO[], DatabaseError>;
  create: (userId: string, conversation: ConversationDAO) => Effect.Effect<void, DatabaseError>;
  updateMessages: (
    userId: string,
    conversationId: string,
    messages: ChatMessageDAO[]
  ) => Effect.Effect<void, ConversationNotFoundError | DatabaseError>;
  delete: (userId: string, conversationId: string) => Effect.Effect<void, DatabaseError>;
}

export class ConversationRepository extends Context.Tag("ConversationRepository")<
  ConversationRepository,
  IConversationRepository
>() {}

export const ConversationRepositoryLive = Layer.effect(
  ConversationRepository,
  Effect.gen(function* () {
    const supabase = yield* SupabaseClient;

    const findById = (
      userId: string,
      conversationId: string
    ): Effect.Effect<ConversationDAO, ConversationNotFoundError | DatabaseError> =>
      Effect.gen(function* () {
        const { data, error } = yield* Effect.promise(() =>
          supabase.client.from("conversations").select("*").eq("user_id", userId).eq("id", conversationId).single()
        );

        if (error) {
          if (error.code === "PGRST116") {
            // No rows returned
            return yield* Effect.fail(new ConversationNotFoundError(userId, conversationId));
          }
          return yield* Effect.fail(new DatabaseError("findById", error.message, error));
        }

        return rowToConversationDAO(data);
      });

    const findAll = (userId: string): Effect.Effect<ConversationDAO[], DatabaseError> =>
      Effect.gen(function* () {
        const { data, error } = yield* Effect.promise(() =>
          supabase.client
            .from("conversations")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
        );

        if (error) {
          return yield* Effect.fail(new DatabaseError("findAll", error.message, error));
        }

        return (data ?? []).map(rowToConversationDAO);
      });

    const create = (userId: string, conversation: ConversationDAO): Effect.Effect<void, DatabaseError> =>
      Effect.gen(function* () {
        const insert = toConversationInsert(userId, conversation);

        const { error } = yield* Effect.promise(() => supabase.client.from("conversations").insert(insert));

        if (error) {
          return yield* Effect.fail(new DatabaseError("create", error.message, error));
        }
      });

    const updateMessages = (
      userId: string,
      conversationId: string,
      messages: ChatMessageDAO[]
    ): Effect.Effect<void, ConversationNotFoundError | DatabaseError> =>
      Effect.gen(function* () {
        const { error, count } = yield* Effect.promise(() =>
          supabase.client
            .from("conversations")
            .update({
              messages: messages as never,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("id", conversationId)
        );

        if (error) {
          return yield* Effect.fail(new DatabaseError("updateMessages", error.message, error));
        }

        if (count === 0) {
          return yield* Effect.fail(new ConversationNotFoundError(userId, conversationId));
        }
      });

    const deleteConversation = (userId: string, conversationId: string): Effect.Effect<void, DatabaseError> =>
      Effect.gen(function* () {
        const { error } = yield* Effect.promise(() =>
          supabase.client.from("conversations").delete().eq("user_id", userId).eq("id", conversationId)
        );

        if (error) {
          return yield* Effect.fail(new DatabaseError("delete", error.message, error));
        }
      });

    return {
      findById,
      findAll,
      create,
      updateMessages,
      delete: deleteConversation,
    };
  })
);

// ============================================================================
// TripRepository
// ============================================================================

export interface ITripRepository {
  findById: (userId: string, tripId: string) => Effect.Effect<TripDAO, TripNotFoundError | DatabaseError>;
  findAll: (userId: string) => Effect.Effect<TripDAO[], DatabaseError>;
  findByConversationId: (userId: string, conversationId: string) => Effect.Effect<TripDAO | null, DatabaseError>;
  create: (userId: string, trip: TripDAO) => Effect.Effect<void, DatabaseError>;
  updatePlaces: (
    userId: string,
    tripId: string,
    places: PlaceDAO[]
  ) => Effect.Effect<void, TripNotFoundError | DatabaseError>;
  delete: (userId: string, tripId: string) => Effect.Effect<void, DatabaseError>;
}

export class TripRepository extends Context.Tag("TripRepository")<TripRepository, ITripRepository>() {}

export const TripRepositoryLive = Layer.effect(
  TripRepository,
  Effect.gen(function* () {
    const supabase = yield* SupabaseClient;

    const findById = (userId: string, tripId: string): Effect.Effect<TripDAO, TripNotFoundError | DatabaseError> =>
      Effect.gen(function* () {
        const { data, error } = yield* Effect.promise(() =>
          supabase.client.from("trips").select("*").eq("user_id", userId).eq("id", tripId).single()
        );

        if (error) {
          if (error.code === "PGRST116") {
            return yield* Effect.fail(new TripNotFoundError(userId, tripId));
          }
          return yield* Effect.fail(new DatabaseError("findById", error.message, error));
        }

        return rowToTripDAO(data);
      });

    const findAll = (userId: string): Effect.Effect<TripDAO[], DatabaseError> =>
      Effect.gen(function* () {
        const { data, error } = yield* Effect.promise(() =>
          supabase.client.from("trips").select("*").eq("user_id", userId).order("created_at", { ascending: false })
        );

        if (error) {
          return yield* Effect.fail(new DatabaseError("findAll", error.message, error));
        }

        return (data ?? []).map(rowToTripDAO);
      });

    const findByConversationId = (
      userId: string,
      conversationId: string
    ): Effect.Effect<TripDAO | null, DatabaseError> =>
      Effect.gen(function* () {
        const { data, error } = yield* Effect.promise(() =>
          supabase.client
            .from("trips")
            .select("*")
            .eq("user_id", userId)
            .eq("conversation_id", conversationId)
            .maybeSingle()
        );

        if (error) {
          return yield* Effect.fail(new DatabaseError("findByConversationId", error.message, error));
        }

        if (!data) {
          return null;
        }

        return rowToTripDAO(data);
      });

    const create = (userId: string, trip: TripDAO): Effect.Effect<void, DatabaseError> =>
      Effect.gen(function* () {
        const insert = toTripInsert(userId, trip);

        const { error } = yield* Effect.promise(() => supabase.client.from("trips").insert(insert));

        if (error) {
          return yield* Effect.fail(new DatabaseError("create", error.message, error));
        }
      });

    const updatePlaces = (
      userId: string,
      tripId: string,
      places: PlaceDAO[]
    ): Effect.Effect<void, TripNotFoundError | DatabaseError> =>
      Effect.gen(function* () {
        const { error, count } = yield* Effect.promise(() =>
          supabase.client
            .from("trips")
            .update({
              places_data: places as never,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("id", tripId)
        );

        if (error) {
          return yield* Effect.fail(new DatabaseError("updatePlaces", error.message, error));
        }

        if (count === 0) {
          return yield* Effect.fail(new TripNotFoundError(userId, tripId));
        }
      });

    const deleteTrip = (userId: string, tripId: string): Effect.Effect<void, DatabaseError> =>
      Effect.gen(function* () {
        const { error } = yield* Effect.promise(() =>
          supabase.client.from("trips").delete().eq("user_id", userId).eq("id", tripId)
        );

        if (error) {
          return yield* Effect.fail(new DatabaseError("delete", error.message, error));
        }
      });

    return {
      findById,
      findAll,
      findByConversationId,
      create,
      updatePlaces,
      delete: deleteTrip,
    };
  })
);

// ============================================================================
// UserPersonasRepository
// ============================================================================

export interface IUserPersonasRepository {
  find: (userId: string) => Effect.Effect<UserPersonasDAO | null, DatabaseError>;
  save: (userId: string, personas: string[]) => Effect.Effect<void, DatabaseError>;
}

export class UserPersonasRepository extends Context.Tag("UserPersonasRepository")<
  UserPersonasRepository,
  IUserPersonasRepository
>() {}

export const UserPersonasRepositoryLive = Layer.effect(
  UserPersonasRepository,
  Effect.gen(function* () {
    const supabase = yield* SupabaseClient;

    const find = (userId: string): Effect.Effect<UserPersonasDAO | null, DatabaseError> =>
      Effect.gen(function* () {
        const { data, error } = yield* Effect.promise(() =>
          supabase.client.from("user_personas").select("*").eq("user_id", userId).maybeSingle()
        );

        if (error) {
          return yield* Effect.fail(new DatabaseError("find", error.message, error));
        }

        if (!data) {
          return null;
        }

        return rowToUserPersonasDAO(data);
      });

    const save = (userId: string, personas: string[]): Effect.Effect<void, DatabaseError> =>
      Effect.gen(function* () {
        const insert = toUserPersonasInsert(userId, personas);

        const { error } = yield* Effect.promise(() =>
          supabase.client.from("user_personas").upsert(insert, {
            onConflict: "user_id",
          })
        );

        if (error) {
          return yield* Effect.fail(new DatabaseError("save", error.message, error));
        }
      });

    return {
      find,
      save,
    };
  })
);
