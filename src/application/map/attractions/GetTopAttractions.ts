import { Effect, Data } from "effect";
import { scoreAttractions } from "@/domain/map/scoring";
import { AttractionsCache } from "@/infrastructure/map/cache";
import type { AttractionsQueryParamsDTO } from "@/infrastructure/map/api";

export const getTopAttractions = (input: AttractionsQueryParamsDTO) =>
  Effect.gen(function* () {
    const cache = yield* AttractionsCache;
    const cacheKey = Data.struct({ lat: input.lat, lng: input.lng, radius: input.radius });
    const attractions = yield* cache.get(cacheKey);

    const scored = scoreAttractions(attractions);
    return scored.slice(0, input.limit);
  });
