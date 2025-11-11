import { Effect, Data } from "effect";
import { scoreAttractions } from "@/domain/map/scoring";
import { AttractionsCache } from "@/infrastructure/map/cache";
import type { GetAttractionsQuery } from "@/domain/map/models";

export const getTopAttractions = (query: GetAttractionsQuery) =>
  Effect.gen(function* () {
    const cache = yield* AttractionsCache;
    const cacheKey = Data.struct({ lat: query.lat, lng: query.lng, radius: query.radius });
    const attractions = yield* cache.get(cacheKey);

    const scored = scoreAttractions(attractions);
    return scored.slice(0, query.limit);
  });
