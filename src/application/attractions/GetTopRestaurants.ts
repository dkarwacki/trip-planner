import { Effect, Data } from "effect";
import { scoreRestaurants } from "@/domain/scoring";
import { RestaurantsCache } from "@/infrastructure/cache";
import type { GetTopRestaurantsInput } from "./inputs";

export const GetTopRestaurants = (input: GetTopRestaurantsInput) =>
  Effect.gen(function* () {
    const cache = yield* RestaurantsCache;
    const cacheKey = Data.struct({ lat: input.lat, lng: input.lng, radius: input.radius });
    const restaurants = yield* cache.get(cacheKey);

    const scored = scoreRestaurants(restaurants);
    return scored.slice(0, input.limit);
  });
