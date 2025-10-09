import { Effect, Context, Layer } from "effect";
import { MissingGoogleMapsAPIKeyError } from "@/domain/errors";

export interface IConfigService {
  readonly getGoogleMapsApiKey: () => Effect.Effect<string, MissingGoogleMapsAPIKeyError>;
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
});
