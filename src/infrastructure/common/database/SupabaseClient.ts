import { Effect, Context, Layer } from "effect";
import { createClient, type SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";
import type { Database } from "./types";
import { ConfigService } from "../config";

export interface ISupabaseClient {
  readonly client: SupabaseClientType<Database>;
}

export class SupabaseClient extends Context.Tag("SupabaseClient")<SupabaseClient, ISupabaseClient>() {}

export const SupabaseClientLive = Layer.effect(
  SupabaseClient,
  Effect.gen(function* () {
    const config = yield* ConfigService;
    const url = yield* config.getSupabaseUrl();
    const key = yield* config.getSupabaseKey();

    const client = createClient<Database>(url, key);

    return { client };
  })
);
