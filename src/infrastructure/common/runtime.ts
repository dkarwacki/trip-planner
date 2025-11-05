import { Effect, Layer } from "effect";
import { ConfigServiceLive } from "./config";
import { GoogleMapsClientLive } from "./google-maps";
import {
  AttractionsCacheLayer,
  RestaurantsCacheLayer,
  PhotoCacheLayer,
  TextSearchCacheLayer,
} from "@/infrastructure/map/cache";
import { OpenAIClientLive } from "./openai";

// Combined application layer with proper dependency injection
// ConfigService is at the bottom (no dependencies)
// GoogleMapsClient depends on ConfigService
// OpenAIClient depends on ConfigService
// Caches depend on GoogleMapsClient or ConfigService
const GoogleMapsWithConfig = GoogleMapsClientLive.pipe(Layer.provide(ConfigServiceLive));

const OpenAIWithConfig = OpenAIClientLive.pipe(Layer.provide(ConfigServiceLive));

const AttractionsWithDeps = AttractionsCacheLayer.pipe(Layer.provide(GoogleMapsWithConfig));

const RestaurantsWithDeps = RestaurantsCacheLayer.pipe(Layer.provide(GoogleMapsWithConfig));

const PhotoCacheWithConfig = PhotoCacheLayer.pipe(Layer.provide(ConfigServiceLive));

const TextSearchWithDeps = TextSearchCacheLayer.pipe(Layer.provide(GoogleMapsWithConfig));

export const AppLayer = Layer.mergeAll(
  ConfigServiceLive,
  GoogleMapsWithConfig,
  OpenAIWithConfig,
  AttractionsWithDeps,
  RestaurantsWithDeps,
  PhotoCacheWithConfig,
  TextSearchWithDeps
);

// Create runtime once at module load
const runtimeEffect = Layer.toRuntime(AppLayer);
export const AppRuntime = await Effect.runPromise(Effect.scoped(runtimeEffect));
