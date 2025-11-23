# Type Fixes Required in Map V2

The following files and components use `any`, `unknown`, or non-DTO types and need to be refactored to use strict DTOs or ViewModels.

## Type Definitions

| File                                     | Symbol / Location             | Issue                                    | Recommendation                                        |
| ---------------------------------------- | ----------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| `src/components/map-v2/types/index.ts`   | `PlaceCardProps.place`        | Typed as `any`                           | Use `PlaceDTO`                                        |
| `src/components/map-v2/types/index.ts`   | `PlanItemCardProps.place`     | Typed as `any`                           | Use `PlaceDTO`                                        |
| `src/components/map-v2/types/index.ts`   | `AISuggestion.attractionData` | Typed as `any`                           | Use `AttractionDTO`                                   |
| `src/components/map-v2/types/index.ts`   | `PlannedPlace.photos`         | Typed as `unknown[]`                     | Use `PhotoDTO[]`                                      |
| `src/components/map-v2/types/index.ts`   | `PlannedPlace`                | Index signature `[key: string]: unknown` | Remove or define specific properties                  |
| `src/components/map-v2/context/types.ts` | `MapStateV2.places`           | Typed as `any[]`                         | Use `PlaceDTO[]`                                      |
| `src/components/map-v2/context/types.ts` | `MapStateV2.discoveryResults` | Typed as `any[]`                         | Use `(AttractionDTO \| RestaurantDTO)[]`              |
| `src/components/map-v2/context/types.ts` | `MapAction` payloads          | Multiple payloads use `any`              | Use specific DTOs (e.g., `PlaceDTO`, `AttractionDTO`) |

## Components

| File                                                      | Location                     | Issue                         | Recommendation                           |
| --------------------------------------------------------- | ---------------------------- | ----------------------------- | ---------------------------------------- |
| `src/components/map-v2/mobile/MobilePlannedItem.tsx`      | `Props.item`                 | Typed as `any`                | Use `PlaceDTO`                           |
| `src/components/map-v2/mobile/DiscoverView.tsx`           | `sortByScore` args           | Typed as `any`                | Use `AttractionDTO` or `RestaurantDTO`   |
| `src/components/map-v2/mobile/MobileItineraryStats.tsx`   | `Props.places`               | Typed as `any[]`              | Use `PlaceDTO[]`                         |
| `src/components/map-v2/mobile/MobilePlanItemCardList.tsx` | `Props.places`               | Typed as `any[]`              | Use `PlaceDTO[]`                         |
| `src/components/map-v2/mobile/MobilePlannedItemList.tsx`  | `Props.items`                | Typed as `any[]`              | Use `PlaceDTO[]`                         |
| `src/components/map-v2/mobile/MapView.tsx`                | `results.filter`             | Callback arg typed as `any`   | Use `AttractionDTO` or `RestaurantDTO`   |
| `src/components/map-v2/mobile/MobilePlanItemCard.tsx`     | `Props.place`                | Typed as `any`                | Use `PlaceDTO`                           |
| `src/components/map-v2/mobile/MobilePlanItemCard.tsx`     | `attractions`, `restaurants` | Typed as `any[]`              | Use `AttractionDTO[]`, `RestaurantDTO[]` |
| `src/components/map-v2/shared/TripSelector.tsx`           | `Trip` interface             | `photos` typed as `unknown[]` | Use `PhotoDTO[]`                         |
| `src/components/map-v2/map/PlannedItemMarkers.tsx`        | `Props.places`               | Typed as `any[]`              | Use `PlaceDTO[]`                         |
| `src/components/map-v2/plan/ItineraryStats.tsx`           | `Props.places`               | Typed as `any[]`              | Use `PlaceDTO[]`                         |
| `src/components/map-v2/plan/PlannedItemList.tsx`          | `Props.items`                | Typed as `any[]`              | Use `PlaceDTO[]`                         |
| `src/components/map-v2/plan/PlannedItem.tsx`              | `Props.item`                 | Typed as `any`                | Use `PlaceDTO`                           |

## Hooks

| File                                                  | Location                        | Issue                               | Recommendation                                 |
| ----------------------------------------------------- | ------------------------------- | ----------------------------------- | ---------------------------------------------- |
| `src/components/map-v2/hooks/useReverseGeocoding.ts`  | Error handling                  | `message: unknown`                  | Use proper error type or type guard            |
| `src/components/map-v2/hooks/useAIChat.ts`            | `places.find`                   | Callback arg typed as `unknown`     | Use `PlaceDTO`                                 |
| `src/components/map-v2/hooks/useAIChat.ts`            | `agentResponse.suggestions.map` | Callback arg typed as `unknown`     | Use `AISuggestion` or `AgentResponseDTO` types |
| `src/components/map-v2/hooks/usePlaceAutocomplete.ts` | `fetchPredictionsImpl`          | Args typed as `unknown[]`           | Define specific arguments                      |
| `src/components/map-v2/hooks/useAutoSave.ts`          | `body.places`                   | Typed as `unknown`                  | Use `PlaceDTO[]`                               |
| `src/components/map-v2/hooks/useNearbyPlaces.ts`      | `places.find`                   | Callback arg typed as `any`         | Use `PlaceDTO`                                 |
| `src/components/map-v2/stores/mapStore.ts`            | `filtered.filter`               | Callback arg typed as `any`         | Use `AttractionDTO` or `RestaurantDTO`         |
| `src/components/map-v2/map/hooks/useMapSelection.ts`  | `map` definition                | `attraction: any`, `breakdown: any` | Use `AttractionDTO`, `ScoreExplanationDTO`     |
| `src/components/map-v2/map/hooks/useMapSelection.ts`  | `place.plannedAttractions`      | Callback arg typed as `any`         | Use `AttractionDTO`                            |

## General Recommendations

1.  **Import DTOs**: Import DTOs from `@/infrastructure/map/api/types` (e.g., `PlaceDTO`, `AttractionDTO`, `RestaurantDTO`).
2.  **Create ViewModels**: If the UI requires data shapes that differ significantly from DTOs, create specific ViewModel interfaces in `src/components/map-v2/types/viewModels.ts` (or similar) instead of extending DTOs with `any` or loose types.
3.  **Strict Typing**: Enable `noImplicitAny` in `tsconfig.json` if not already enabled to prevent future regressions.
