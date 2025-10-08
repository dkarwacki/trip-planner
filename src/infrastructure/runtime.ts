import { Effect, Layer } from "effect";
import { ConfigServiceLive } from "./config";
import { GoogleMapsClientLive } from "./google-maps";
import { AttractionsCacheLayer, RestaurantsCacheLayer } from "./cache";

// Combined application layer with proper dependency injection
// ConfigService is at the bottom (no dependencies)
// GoogleMapsClient depends on ConfigService
// Caches depend on GoogleMapsClient
const GoogleMapsWithConfig = GoogleMapsClientLive.pipe(Layer.provide(ConfigServiceLive));

const AttractionsWithDeps = AttractionsCacheLayer.pipe(Layer.provide(GoogleMapsWithConfig));

const RestaurantsWithDeps = RestaurantsCacheLayer.pipe(Layer.provide(GoogleMapsWithConfig));

export const AppLayer = Layer.mergeAll(
  ConfigServiceLive,
  GoogleMapsWithConfig,
  AttractionsWithDeps,
  RestaurantsWithDeps
);

// Create runtime once at module load
const runtimeEffect = Layer.toRuntime(AppLayer);
export const AppRuntime = await Effect.runPromise(Effect.scoped(runtimeEffect));
