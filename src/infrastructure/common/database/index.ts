/**
 * Database types barrel export
 *
 * Re-exports all Supabase database types for convenient importing.
 * Use: `import type { Database, Tables } from 'infrastructure/common/database'`
 */

export type { Json, Database, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes } from "./types";

export { Constants } from "./types";
