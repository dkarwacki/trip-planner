import { Effect, Data } from "effect";
import { scoreRestaurants } from "@/domain/map/scoring";
import { RestaurantsCache } from "@/infrastructure/map/cache";
import type { GetRestaurantsQuery } from "@/domain/map/models";

export const getTopRestaurants = (query: GetRestaurantsQuery) =>
  Effect.gen(function* () {
    const cache = yield* RestaurantsCache;
    const cacheKey = Data.struct({ lat: query.lat, lng: query.lng, radius: query.radius });
    const restaurants = yield* cache.get(cacheKey);

    const scored = scoreRestaurants(restaurants);
    return scored.slice(0, query.limit);
  });
