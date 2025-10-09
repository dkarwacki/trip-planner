import { Effect, Context, Layer } from "effect";
import {
  MissingGoogleMapsAPIKeyError,
  MissingOpenRouterAPIKeyError,
  MissingOpenRouterModelError,
} from "@/domain/errors";
import { OpenRouterApiKey, OpenRouterModel } from "@/domain/models";

export interface IConfigService {
  readonly getGoogleMapsApiKey: () => Effect.Effect<string, MissingGoogleMapsAPIKeyError>;
  readonly getOpenRouterApiKey: () => Effect.Effect<OpenRouterApiKey, MissingOpenRouterAPIKeyError>;
  readonly getOpenRouterModel: () => Effect.Effect<OpenRouterModel, MissingOpenRouterModelError>;
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
});
