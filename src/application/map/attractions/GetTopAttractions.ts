import { Effect, Data } from "effect";
import { scoreAttractions } from "@/domain/map/scoring";
import { AttractionsCache } from "@/infrastructure/map/cache";
import type { GetTopAttractionsInput } from "./inputs";

export const getTopAttractions = (input: GetTopAttractionsInput) =>
  Effect.gen(function* () {
    const cache = yield* AttractionsCache;
    const cacheKey = Data.struct({ lat: input.lat, lng: input.lng, radius: input.radius });
    const attractions = yield* cache.get(cacheKey);

    const scored = scoreAttractions(attractions);
    return scored.slice(0, input.limit);
  });
