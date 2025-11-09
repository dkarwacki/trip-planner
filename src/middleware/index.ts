import type { MiddlewareHandler } from "astro";
import { Effect } from "effect";
import { AppRuntime } from "@/infrastructure/common/runtime";
import { SupabaseClient } from "@/infrastructure/common/database";

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Get Supabase client from Effect runtime
  const supabaseService = await Effect.runPromise(Effect.provide(SupabaseClient, AppRuntime));

  context.locals.supabase = supabaseService.client;

  return next();
};
