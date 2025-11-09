import { Effect, Context, Layer } from "effect";
import {
  MissingGoogleMapsAPIKeyError,
  MissingOpenRouterAPIKeyError,
  MissingOpenRouterModelError,
  MissingSupabaseUrlError,
  MissingSupabaseKeyError,
} from "@/domain/common/errors";
import { OpenRouterApiKey, OpenRouterModel } from "@/domain/plan/models";

export interface IConfigService {
  readonly getGoogleMapsApiKey: () => Effect.Effect<string, MissingGoogleMapsAPIKeyError>;
  readonly getOpenRouterApiKey: () => Effect.Effect<OpenRouterApiKey, MissingOpenRouterAPIKeyError>;
  readonly getOpenRouterModel: () => Effect.Effect<OpenRouterModel, MissingOpenRouterModelError>;
  readonly getSupabaseUrl: () => Effect.Effect<string, MissingSupabaseUrlError>;
  readonly getSupabaseKey: () => Effect.Effect<string, MissingSupabaseKeyError>;
}

export class ConfigService extends Context.Tag("ConfigService")<ConfigService, IConfigService>() {}

export const ConfigServiceLive = Layer.succeed(ConfigService, {
  getGoogleMapsApiKey: () =>
    Effect.gen(function* () {
      const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        yield* Effect.logError("GOOGLE_MAPS_API_KEY is not configured");
        return yield* Effect.fail(new MissingGoogleMapsAPIKeyError());
      }

      return apiKey;
    }),
  getOpenRouterApiKey: () =>
    Effect.gen(function* () {
      const apiKey = import.meta.env.OPENROUTER_API_KEY;

      if (!apiKey) {
        yield* Effect.logError("OPENROUTER_API_KEY is not configured");
        return yield* Effect.fail(new MissingOpenRouterAPIKeyError());
      }

      return OpenRouterApiKey(apiKey);
    }),
  getOpenRouterModel: () =>
    Effect.gen(function* () {
      const model = import.meta.env.OPENROUTER_MODEL;

      if (!model) {
        yield* Effect.logError("OPENROUTER_MODEL is not configured");
        return yield* Effect.fail(new MissingOpenRouterModelError());
      }

      return OpenRouterModel(model);
    }),
  getSupabaseUrl: () =>
    Effect.gen(function* () {
      const url = import.meta.env.SUPABASE_URL;

      if (!url) {
        yield* Effect.logError("SUPABASE_URL is not configured");
        return yield* Effect.fail(new MissingSupabaseUrlError());
      }

      return url;
    }),
  getSupabaseKey: () =>
    Effect.gen(function* () {
      const key = import.meta.env.SUPABASE_KEY;

      if (!key) {
        yield* Effect.logError("SUPABASE_KEY is not configured");
        return yield* Effect.fail(new MissingSupabaseKeyError());
      }

      return key;
    }),
});
