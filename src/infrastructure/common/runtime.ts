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
import { SupabaseClientLive } from "./database";
import {
  ConversationRepositoryLive,
  TripRepositoryLive,
  UserPersonasRepositoryLive,
} from "@/infrastructure/plan/database";
import { PlaceRepositoryLive, AttractionRepositoryLive } from "@/infrastructure/map/database";

// Combined application layer with proper dependency injection
// ConfigService is at the bottom (no dependencies)
// GoogleMapsClient depends on ConfigService
// OpenAIClient depends on ConfigService
// SupabaseClient depends on ConfigService
// Caches depend on GoogleMapsClient or ConfigService
// Repositories depend on SupabaseClient
const GoogleMapsWithConfig = GoogleMapsClientLive.pipe(Layer.provide(ConfigServiceLive));

const OpenAIWithConfig = OpenAIClientLive.pipe(Layer.provide(ConfigServiceLive));

const SupabaseWithConfig = SupabaseClientLive.pipe(Layer.provide(ConfigServiceLive));

const AttractionsWithDeps = AttractionsCacheLayer.pipe(Layer.provide(GoogleMapsWithConfig));

const RestaurantsWithDeps = RestaurantsCacheLayer.pipe(Layer.provide(GoogleMapsWithConfig));

const PhotoCacheWithConfig = PhotoCacheLayer.pipe(Layer.provide(ConfigServiceLive));

const TextSearchWithDeps = TextSearchCacheLayer.pipe(Layer.provide(GoogleMapsWithConfig));

// Plan repositories
const ConversationRepoWithDeps = ConversationRepositoryLive.pipe(Layer.provide(SupabaseWithConfig));

const TripRepoWithDeps = TripRepositoryLive.pipe(Layer.provide(SupabaseWithConfig));

const UserPersonasRepoWithDeps = UserPersonasRepositoryLive.pipe(Layer.provide(SupabaseWithConfig));

// Map repositories
const PlaceRepoWithDeps = PlaceRepositoryLive.pipe(Layer.provide(SupabaseWithConfig));

const AttractionRepoWithDeps = AttractionRepositoryLive.pipe(Layer.provide(SupabaseWithConfig));

export const AppLayer = Layer.mergeAll(
  ConfigServiceLive,
  GoogleMapsWithConfig,
  OpenAIWithConfig,
  SupabaseWithConfig,
  AttractionsWithDeps,
  RestaurantsWithDeps,
  PhotoCacheWithConfig,
  TextSearchWithDeps,
  ConversationRepoWithDeps,
  TripRepoWithDeps,
  UserPersonasRepoWithDeps,
  PlaceRepoWithDeps,
  AttractionRepoWithDeps
);

// Create runtime once at module load
const runtimeEffect = Layer.toRuntime(AppLayer);
export const AppRuntime = await Effect.runPromise(Effect.scoped(runtimeEffect));
