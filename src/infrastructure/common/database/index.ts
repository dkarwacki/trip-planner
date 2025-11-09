/**
 * Database barrel export
 *
 * Re-exports Supabase types and client for convenient importing.
 */

export type { Json, Database, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes } from "./types";
export { Constants } from "./types";
export { SupabaseClient, SupabaseClientLive, type ISupabaseClient } from "./SupabaseClient";
