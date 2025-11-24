# Refactor map-v2 to Eliminate `any`/`unknown` and Use DTOs/ViewModels

## Progress Summary

**TypeScript Errors:** 363 → 2 (99.4% reduction) 🎉
**Phases Completed:** 5/6 (83%) - Phase 5 100% complete!
**Last Updated:** 2025-01-23

## Implementation Progress

### ✅ Completed Phases

- **Phase 1**: Foundation - Define ViewModels
  - ✅ Created `/src/lib/map-v2/types.ts` with all ViewModels
  - ✅ Created `/src/lib/map-v2/mappers.ts` with DTO → ViewModel mappers
  - ✅ All files pass TypeScript, ESLint, and Prettier validation

- **Phase 2**: Update Core Types
  - ✅ Updated `stores/types.ts` - replaced domain imports with ViewModels
  - ✅ Updated `context/types.ts` - removed all `any` types
  - ✅ Updated `types/index.ts` - removed `any`/`unknown` types

- **Phase 3**: Update Stores
  - ✅ Updated `mapStore.ts` (src/components/map-v2/stores/mapStore.ts)
    - Removed domain import: `AttractionScore` from `@/domain/map/models`
    - Replaced with ViewModel import: `DiscoveryItemViewModel` from `@/lib/map-v2/types`
    - Fixed `filterDiscoveryResults` function with proper types and return type
    - Removed all `(item: any)` type annotations
    - Fixed property access: `item.attraction?.types` → `item.types` (flattened structure)
  - ✅ Updated `createPlanSlice.ts` (src/components/map-v2/stores/slices/createPlanSlice.ts)
    - Removed 5 `@eslint-disable @typescript-eslint/no-explicit-any` comments
    - Fixed `removeAttractionFromPlace` - removed `(a: any)` type annotation (line 84)
    - Fixed `removeRestaurantFromPlace` - removed `(r: any)` type annotation (line 99)
    - Fixed `getSelectedPlace` - removed `(p: any)` type annotation (line 117)
    - Fixed `getPlannedAttractionIds` - removed 2 `any` type annotations (lines 133, 135)
  - ✅ Updated `createDiscoverSlice.ts` (src/components/map-v2/stores/slices/createDiscoverSlice.ts)
    - Fixed `addDiscoveryResults` - changed `r.attraction?.id` → `r.id` (flattened structure)
    - Verified no domain imports or explicit `any` types
  - ✅ **Verification**: All store files pass TypeScript type checking with no errors

- **Infrastructure Fixes** (2024-01-23)
  - ✅ Fixed error imports in `response-mappers.ts` (src/infrastructure/common/http/response-mappers.ts)
    - Moved map-specific errors to correct import from `@/domain/map/errors`
    - Fixed `ValidationError` mapping with proper type annotation
  - ✅ Fixed `PlacePhoto` type definition (src/domain/common/models/Place.ts)
    - Made `lat`, `lng`, `placeName` optional (not always available from API)
    - Resolved 8+ type errors across infrastructure and database layers
  - ✅ Fixed `PhotoCache` and `GetPhoto` (src/infrastructure/map/cache/PhotoCache.ts, src/application/map/photos/GetPhoto.ts)
    - Removed `maxWidth` from `PhotoCacheKey` interface
    - Updated `GetPhoto.ts` to not pass `maxWidth` to cache
    - Fixed placeholder photo to use constant `MAX_PHOTO_WIDTH`
  - **Result**: Reduced TypeScript errors from 363 to 187 (48% reduction)

- **Phase 4**: Update Hooks ✅ COMPLETED (2025-01-23)
  - ✅ Fixed `useAIChat.ts` (src/components/map-v2/hooks/useAIChat.ts)
    - Removed all domain imports: `Place`, `Attraction`, `PlaceId`, `Latitude`, `Longitude`
    - Replaced with ViewModels: `PlannedPlaceViewModel`, `PlannedPOIViewModel`, `DiscoveryItemViewModel`
    - Removed all `unknown` casts (70+ instances)
    - Fixed property access: `selectedPlace.lat/lng` → `selectedPlace.latitude/longitude`
    - Added proper typing for raw API responses with `RawSuggestion` interface
    - Updated discovery items mapping to use type predicates
    - Simplified from manual object construction to direct ViewModel usage
  - ✅ Fixed `useNearbyPlaces.ts` (src/components/map-v2/hooks/useNearbyPlaces.ts)
    - Removed `@eslint-disable @typescript-eslint/no-explicit-any` comments
    - Fixed property access: `selectedPlace.lat/lng` → `selectedPlace.latitude/longitude`
    - Removed unnecessary `Number()` conversions
  - ✅ Fixed `useMapSelection.ts` (src/components/map-v2/map/hooks/useMapSelection.ts)
    - Added proper typing for `plannedAttractionMap` with `PlannedPOIViewModel`
    - Updated `handleAddToPlan` to convert `DiscoveryItemViewModel` → `PlannedPOIViewModel`
    - Fixed discovery results access: removed `.attraction` wrapper
    - Fixed property access: `selectedPlace.lat/lng` → `selectedPlace.latitude/longitude`
    - Added breakdown construction for DiscoveryItemViewModel
  - ✅ Fixed `useMapSearch.ts` (src/components/map-v2/map/hooks/useMapSearch.ts)
    - Removed domain `Place` import, replaced with `PlannedPlaceViewModel`
    - Fixed all property access: `.lat/.lng` → `.latitude/.longitude`
    - Added proper conversion from domain `Place` to `PlannedPlaceViewModel` in:
      - `handleSearchArea` - creates new places with proper structure
      - `handleFinishAdjustment` - updates draft places
  - ✅ Fixed `useDiscoverFilters.ts` (src/components/map-v2/discover/hooks/useDiscoverFilters.ts)
    - Fixed category filter: `item.attraction?.types` → `item.types`
    - Fixed sorting logic: removed `.attraction` wrapper access
    - All type checks use flattened DiscoveryItemViewModel structure
  - **Result**: Reduced TypeScript errors from 187 to ~100 (47% reduction)

### ⏳ Current Phase

- **Phase 5**: Update Components (70% complete)
  - ✅ **Map Components:**
    - ✅ `tripMappers.ts` (src/lib/map-v2/tripMappers.ts)
      - Updated all functions to use ViewModels instead of domain types
      - Renamed: `attractionToDAO` → `poiToDAO`, `attractionFromDAO` → `poiFromDAO`
      - Uses `PlannedPlaceViewModel`, `PlannedPOIViewModel`, `PhotoViewModel`
      - Fixed property mapping: `.location.lat/.lng` → `.latitude/.longitude`
    - ✅ `PlaceMarkers.tsx` (src/components/map-v2/map/PlaceMarkers.tsx)
      - Replaced `PlannedPlace` with `PlannedPlaceViewModel`
      - Fixed all property access (6 occurrences)
      - Removed unnecessary `Number()` conversions
    - ✅ `MapInteractiveLayer.tsx` (src/components/map-v2/map/MapInteractiveLayer.tsx)
      - Updated to use `DiscoveryItemViewModel[]` for discovery results
      - Fixed filtered discovery results to use flattened structure
      - Updated DiscoveryMarkersLayer props
    - ✅ `DiscoveryMarkersLayer.tsx` (src/components/map-v2/map/DiscoveryMarkersLayer.tsx)
      - Changed to accept `DiscoveryItemViewModel[]`
      - Fixed `PlaceWithCategory` from `extends` to intersection type
    - ✅ `DiscoveryMarker.tsx` (src/components/map-v2/map/DiscoveryMarker.tsx)
      - Updated to accept `DiscoveryItemViewModel`
      - Fixed marker position: `place.location` → `{ lat: place.latitude, lng: place.longitude }`
    - ✅ `ExpandedPlaceCard.tsx` (src/components/map-v2/map/ExpandedPlaceCard.tsx)
      - Updated to accept `DiscoveryItemViewModel | PlannedPOIViewModel`
      - Removed `editorialSummary` references (not in ViewModels)
      - Fixed location access for Google Maps URL and PhotoLightbox
      - Removed unused `isDescriptionOpen` state
    - ✅ `PlacePreviewCard.tsx` (src/components/map-v2/map/PlacePreviewCard.tsx)
      - Updated to use `PlannedPlaceViewModel`
      - Fixed property access: `.lat/.lng` → `.latitude/.longitude`
  - ✅ **Discover Components:**
    - ✅ `PhotoGrid.tsx` (src/components/map-v2/discover/PhotoGrid.tsx)
      - Updated props: `(Attraction | AttractionScore)[]` → `DiscoveryItemViewModel[]`
      - Removed domain imports
    - ✅ `PlaceCardGrid.tsx` (src/components/map-v2/discover/PlaceCardGrid.tsx)
      - Updated props: `(Attraction | AttractionScore)[]` → `DiscoveryItemViewModel[]`
      - Removed domain imports
    - ✅ `PlaceList.tsx` (src/components/map-v2/discover/PlaceList.tsx)
      - Updated props: `(Attraction | AttractionScore)[]` → `DiscoveryItemViewModel[]`
      - Removed domain imports
    - ✅ `PlaceCard.tsx` (src/components/map-v2/discover/PlaceCard.tsx)
      - Updated to accept `DiscoveryItemViewModel`
      - Removed domain `Attraction` import
    - ✅ `DiscoverView.tsx` (src/components/map-v2/mobile/DiscoverView.tsx)
      - Fixed `isRestaurant` helper: `item.attraction?.types` → `item.types`
      - Fixed `sortByScore` function with proper `DiscoveryItemViewModel` type
      - Removed `any` types
    - ✅ `DiscoverPanel.tsx` (src/components/map-v2/discover/DiscoverPanel.tsx)
      - Updated child component props to use `DiscoveryItemViewModel[]`
  - ✅ **Shared Components:**
    - ✅ `BasePlaceCard.tsx` (src/components/map-v2/shared/BasePlaceCard.tsx)
      - Updated to use `latitude`/`longitude` instead of `location` object
      - Fixed to handle optional `types` array
      - Updated LazyImage location props
  - ✅ **Plan Components:**
    - ✅ `PlannedItemList.tsx` - Replaced `any[]` with `PlannedPOIViewModel[]`
    - ✅ `PlannedItem.tsx` - Fixed property access to use `latitude`/`longitude`
    - ✅ `ItineraryStats.tsx` - Replaced `any[]` with `PlannedPlaceViewModel[]`
  - ✅ **Mobile Components:**
    - ✅ `MobilePlannedItem.tsx` - Replaced `any` with `PlannedPOIViewModel`, removed `displayName` reference
    - ✅ `MobilePlanItemCard.tsx` - Replaced `any` with ViewModels, fixed property access
    - ✅ `MobileItineraryStats.tsx` - Replaced `any[]` with `PlannedPlaceViewModel[]`
    - ✅ `MobileLayout.tsx` - Replaced domain `Place` with `PlannedPlaceViewModel`
    - ✅ `MobilePlannedItemList.tsx` - Replaced `any[]` with `PlannedPOIViewModel[]`
    - ✅ `MobilePlanItemCardList.tsx` - Replaced `any[]` with `PlannedPlaceViewModel[]`
  - ✅ **Map Marker Components:**
    - ✅ `PlannedItemMarkers.tsx` - Replaced domain `Attraction` with `PlannedPOIViewModel`
    - ✅ `PlannedItemMarker.tsx` - Replaced domain `Attraction` with `PlannedPOIViewModel`
    - ✅ `HoverMiniCard.tsx` - Replaced domain `Attraction` with `PlannedPOIViewModel`
  - ✅ **Hooks:**
    - ✅ `useMobileAIChat.ts` - Updated to use `PlannedPlaceViewModel` instead of domain `Place`
    - ✅ `usePlaceAutocomplete.ts` - Fixed lat/lng type extraction
  - ✅ **Mappers:**
    - ✅ `mappers.ts` - Fixed all DTO property access errors, removed non-existent properties
  - **Result**: Reduced TypeScript errors from 100 to 2 (99.4% total reduction)

### 🔲 Pending Phases

- **Phase 6**: Cleanup & Verification

---

## Architecture Principles

### Backend Responsibilities

- Handle all DAO � Domain � DTO mapping
- DTOs are the contract between backend and frontend

### Frontend Responsibilities

- Use DTOs directly when possible
- Create ViewModels only when DTOs need enhancement (UI state, computed properties, combining multiple DTOs)
- All DTO � ViewModel mapping in `/src/lib/map-v2/mappers.ts`

### Key Rules

-  Prefer DTOs over ViewModels
-  No `any` or `unknown` types
-  No domain imports in components
-  Backend handles all DAO/Domain/DTO mapping

---

## Phase 1: Foundation - Define ViewModels ✅ COMPLETED

### 1.1 Analyze DTO usage and identify ViewModel needs ✅ COMPLETED

**Review existing DTOs:**

- `infrastructure/map/api/types.ts`:
  - `PlaceDTO`
  - `AttractionDTO`
  - `RestaurantDTO`
  - `PhotoDTO`
  - `ScoreExplanationDTO`
  - `AttractionsResponseDTO`
  - `RestaurantsResponseDTO`

- `infrastructure/plan/api/types.ts`:
  - `TripPlaceDTO`
  - `AttractionOnlyDTO`
  - `RestaurantDTO`
  - `ChatMessageDTO`
  - `PlaceSuggestionDTO`

**Identify cases requiring ViewModels:**

- Combining multiple DTOs
- Adding UI-specific state (isExpanded, isHovered, etc.)
- Adding computed properties for display
- Transforming nested structures for easier component consumption

### 1.2 Create ViewModel types in `/src/lib/map-v2/types.ts` ✅ COMPLETED

**Created ViewModels:**

1. **AttractionViewModel** - If we need to enhance `AttractionDTO` with:
   - Normalized score data for UI display
   - Expanded state
   - Selection state
   - Combined photo metadata

2. **PlaceViewModel** - If `PlaceDTO`/`TripPlaceDTO` need:
   - UI interaction state
   - Computed display properties
   - Combined address formatting

3. **ConversationMessageViewModel** - If `ChatMessageDTO` needs:
   - Parsed content structure
   - UI rendering metadata
   - Status indicators

**Decision criteria:**

- Does the DTO have everything the component needs? � Use DTO directly
- Does the component need additional computed/UI state? � Create ViewModel

### 1.3 Create DTO → ViewModel mappers in `/src/lib/map-v2/mappers.ts` ✅ COMPLETED

**Implementation notes:**

- Created comprehensive mapper functions in new file `/src/lib/map-v2/mappers.ts`
- Original `tripMappers.ts` kept for DAO conversions (will be refactored in Phase 6)

```typescript
// Export structure:
export const toViewModel = {
  attraction: (dto: AttractionDTO, score?: number): AttractionViewModel => {...},
  place: (dto: PlaceDTO): PlaceViewModel => {...},
  // Only add mappers for ViewModels that actually exist
}

// If needed for API requests:
export const toDTO = {
  place: (vm: PlaceViewModel): PlaceDTO => {...},
}
```

**Rules:**

- Only map DTOs to ViewModels (no DAO or domain type handling)
- No `any` or `unknown` types
- Clear, descriptive function names
- Proper null/undefined handling

---

## Phase 2: Update Core Types ✅ COMPLETED

### 2.1 Update store types (`stores/types.ts`) ✅ COMPLETED

**Current violations:**

- Imports from `@/domain/`
- Uses `any` for attractions and scores

**Actions:**

- Replace all domain imports with DTO/ViewModel imports
- Remove all `any` and `unknown` types
- Define proper types for all store state
- Update action payload types

**Example:**

```typescript
// Before
import { Attraction, AttractionScore } from "@/domain/attractions/models";

interface DiscoveryState {
  results: any[];
}

// After
import type { AttractionDTO } from "@/infrastructure/map/api/types";

interface DiscoveryState {
  results: AttractionDTO[];
}
```

### 2.2 Update context types (`context/types.ts`) ✅ COMPLETED

**Fixed violations:**

- Line 10: `places: any[];`
- Line 12: `discoveryResults: any[];`
- Lines 56-70: Multiple action payloads using `any`

**Actions:**

- Replace `places: any[]` with `places: PlaceDTO[]` or `places: PlaceViewModel[]`
- Replace `discoveryResults: any[]` with `discoveryResults: AttractionDTO[]`
- Update all action payload types to remove `any`
- Add proper types for all context values

### 2.3 Update shared component types (`types/index.ts`) ✅ COMPLETED

**Fixed violations:**

- Line 50: `attractionData?: any;`
- Line 55: `place: any;` (PlaceCardProps)
- Line 63: `place: any;` (PlanItemCardProps)
- Line 84-85: `photos?: unknown[];` and `[key: string]: unknown;`

**Actions:**

- Replace `attractionData?: any` with `attractionData?: AttractionDTO`
- Replace `place: any` with `place: PlaceDTO | PlaceViewModel`
- Replace `photos?: unknown[]` with `photos?: PhotoDTO[]`
- Remove `[key: string]: unknown` index signatures - define explicit properties

---

## Phase 3: Update Stores (4-5 hours)

### 3.1 Update `mapStore.ts` main store

**Current violations:**

- Lines 68, 77: Filter operations using `(item: any)`
- Imports `AttractionScore` from domain

**Actions:**

- Import DTOs/ViewModels instead of domain types
- Replace all `(item: any) => ...` with properly typed parameters
- Update all filter/map operations to use typed data
- Add mapper calls where ViewModel transformation is needed
- Remove domain imports

**Example:**

```typescript
// Before
.filter((item: any) => item.score >= minScore)

// After
.filter((item: AttractionDTO) => item.score >= minScore)
```

### 3.2 Update store slices (4 files)

**`createPlanSlice.ts`** (Priority: HIGH)

- Current violations: Lines 84, 99, 117, 133-135 with `@eslint-disable` comments
- Actions:
  - Remove all `@eslint-disable @typescript-eslint/no-explicit-any` comments
  - Replace all `any` types with proper DTOs/ViewModels
  - Update place manipulation logic to use typed data
  - Add proper types for all action parameters

**`createDiscoverySlice.ts`**

- Actions:
  - Use DTOs/ViewModels for discovery results
  - Remove any `any` types
  - Update filtering and sorting logic with proper types

**Other slices:**

- Remove all `any`/`unknown` types
- Ensure all state mutations use proper types
- Add type annotations for all parameters

---

## Phase 4: Update Hooks (4-5 hours)

### 4.1 Critical: `hooks/useAIChat.ts` (Priority: HIGHEST)

**Current violations: 70+ instances**

- Lines 42, 48, 53, 69, 94, 104, 182, 237, 358, 366-367: Extensive `unknown` casting
- Imports domain types: `Place`, `Attraction`, `PlaceId`, `Latitude`, `Longitude`
- Lines 94-114, 182-227, 261-277: Inline DTO mapping logic

**Actions:**

1. Replace domain imports with DTO/ViewModel imports
2. Remove all `unknown` casting - use proper types
3. Move all mapping logic to `/src/lib/map-v2/mappers.ts`
4. Use mappers from `/src/lib/map-v2/mappers.ts` for transformations
5. Remove `@eslint-disable` comments
6. Update all function signatures to use DTOs/ViewModels

**Example:**

```typescript
// Before
const places = response.suggestions?.map((s: unknown) => {
  const suggestion = s as any;
  return {
    id: suggestion.id,
    // ... manual mapping
  };
});

// After
import { toViewModel } from "@/lib/map-v2/mappers";
const places = response.suggestions?.map(toViewModel.placeSuggestion);
```

### 4.2 Update `hooks/useNearbyPlaces.ts`

**Current violations:**

- Lines 27, 34: `eslint-disable @typescript-eslint/no-explicit-any` with `any` usage

**Actions:**

- Remove `any` types
- Use proper DTOs for API responses
- Add mapper calls if ViewModels are needed
- Remove eslint-disable comments

### 4.3 Update other hooks (6 files)

**`useMapSelection.ts`**

- Lines 34, 38, 55: `any` types in mapping operations
- Actions: Replace with proper types, use typed parameters

**`useReverseGeocoding.ts`**

- Imports domain `Place`
- Actions: Use `PlaceDTO` instead

**`useMobileAIChat.ts`**

- Imports domain `Place`
- Actions: Use DTOs instead of domain types

**`useMapSearch.ts`**

- Imports domain `Place`
- Actions: Use DTOs instead of domain types

**Other hooks:**

- Remove all `any`/`unknown` types
- Add proper type annotations

---

## Phase 5: Update Components (8-10 hours)

### 5.1 Map components (10 files)

**`PlannedItemMarkers.tsx`**

- Line 18: `places: any[]` with comment "Will be typed with domain Place type"
- Actions: Replace with `places: PlaceDTO[]` or `places: PlaceViewModel[]`

**`PlannedItemMarker.tsx`**

- Imports domain `Attraction`
- Actions: Remove domain import, use DTO/ViewModel

**`DiscoveryMarkers.tsx`**

- Imports domain `AttractionScore`
- Actions: Use DTO/ViewModel instead of domain types

**`DiscoveryMarker.tsx`**

- Imports domain `Attraction`
- Actions: Use DTO/ViewModel

**`DiscoveryMarkersLayer.tsx`**

- Imports domain `Attraction`
- Actions: Use DTO/ViewModel

**`PlacePreviewCard.tsx`**

- Imports domain `Place`
- Actions: Use DTO/ViewModel

**`ExpandedPlaceCard.tsx`**

- Imports domain `Attraction`
- Actions: Use DTO/ViewModel

**`HoverMiniCard.tsx`**

- Imports domain `Attraction`
- Actions: Use DTO/ViewModel

**`hooks/useMapSelection.ts`**

- Lines 34, 38, 55: `any` types
- Actions: Remove `any` types

**`hooks/useMapSearch.ts`**

- Imports domain `Place`
- Actions: Use DTOs

### 5.2 Discover components (7 files)

**All discover components** (PhotoGrid, PhotoGridItem, PlaceCard, PlaceCardGrid, PlaceList, PlaceListItem):

- Import domain types: `Attraction`, `AttractionScore`
- Actions:
  - Replace domain imports with DTO/ViewModel imports
  - Update component props to use DTOs/ViewModels
  - Update internal logic to work with new types
  - Remove any inline type casting

**Pattern for each file:**

```typescript
// Before
import { Attraction } from "@/domain/attractions/models";
interface Props {
  attraction: Attraction;
}

// After
import type { AttractionDTO } from "@/infrastructure/map/api/types";
// OR if ViewModel is needed:
import type { AttractionViewModel } from "@/lib/map-v2/types";
interface Props {
  attraction: AttractionDTO; // or AttractionViewModel
}
```

### 5.3 Plan components (2 files)

**`PlanItemCard.tsx`**

- Lines 40-41: Explicit casting to `any[]` for attractions and restaurants
- Actions:
  - Remove `as any[]` casts
  - Use proper types for attractions and restaurants arrays
  - Update props interface

### 5.4 Mobile components (5 files)

**`MobilePlannedItem.tsx`**

- Line 12: Uses `any`
- Actions: Replace with proper DTO/ViewModel type

**`MobilePlanItemCard.tsx`**

- Lines 14, 51-52: Uses `any` types
- Actions: Remove `any` types and casts, use proper types

**`MobileItineraryStats.tsx`**

- Line 9: Uses `any`
- Actions: Use proper types

**`MobileLayout.tsx`**

- Imports domain `Place`
- Actions: Use DTOs instead of domain types

**`DiscoverView.tsx`**

- Line 90: Uses `any`
- Actions: Remove `any` types

---

## Phase 6: Cleanup & Verification (2-3 hours)

### 6.1 Remove old mappers

**Actions:**

- Evaluate if `/src/lib/map-v2/tripMappers.ts` is still needed
- If not needed: Delete the file
- If some functions are still used: Refactor them to use DTOs/ViewModels
- Verify all mapping is now in `/src/lib/map-v2/mappers.ts`

### 6.2 Verification checklist

**Automated checks:**

```bash
# Should find 0 results in map-v2:
grep -r "\bany\b" src/components/map-v2/
grep -r "\bunknown\b" src/components/map-v2/

# Should find 0 domain imports in map-v2:
grep -r "from '@/domain/" src/components/map-v2/

# Type checking:
npm run lint
npx tsc --noEmit
```

**Manual verification:**

- [ ] All store types properly defined
- [ ] All hook return types properly defined
- [ ] All component props properly typed
- [ ] No `any` or `unknown` in entire map-v2 directory
- [ ] No domain imports in map-v2 directory
- [ ] All mapping functions in `/src/lib/map-v2/mappers.ts`
- [ ] ViewModels only created where necessary
- [ ] DTOs used directly where possible

### 6.3 Documentation

**Update CLAUDE.md with ViewModel patterns:**

```markdown
### Frontend DTO vs ViewModel Decision Criteria

- **Use DTOs directly** when:
  - Component needs only data from the API
  - No additional computed properties needed
  - No UI-specific state required

- **Create ViewModels** when:
  - Combining multiple DTOs
  - Adding UI interaction state (isExpanded, isSelected, etc.)
  - Adding computed properties for display
  - Transforming complex nested structures

- **Mapping location**: All DTO � ViewModel mapping in `/src/lib/map-v2/mappers.ts`
- **Backend mapping**: All DAO � Domain � DTO mapping stays in infrastructure layer
```

---

## Success Criteria

 **Zero `any` types** in `src/components/map-v2/`
 **Zero `unknown` types** in `src/components/map-v2/`
 **Zero domain imports** in `src/components/map-v2/`
 **All mapping logic** in `/src/lib/map-v2/mappers.ts`
 **DTOs preferred** over ViewModels where possible
 **Type checking passes** (`npx tsc --noEmit`)
 **Linting passes** (`npm run lint`)

---

## Estimated Total: 22-28 hours

**Breakdown:**

- Phase 1: ✅ 2-3 hours (COMPLETED)
- Phase 2: ✅ 2 hours (COMPLETED)
- Phase 3: ✅ 4-5 hours (COMPLETED)
- Phase 4: ✅ 4-5 hours (COMPLETED)
- Phase 5: ⏳ 6-7 hours (70% complete, ~2-3 hours remaining)
- Phase 6: 🔲 2-3 hours

**Time Spent So Far:** ~18-20 hours
**Time Remaining:** ~4-6 hours

---

## Recent Session Summary (2025-01-23)

### What Was Accomplished

1. **Completed Phase 4: Update Hooks** (5 hooks fixed)
   - Fixed `useAIChat.ts` - Removed 70+ `unknown` casts, mapped to ViewModels
   - Fixed `useNearbyPlaces.ts` - Removed `any` types, fixed property access
   - Fixed `useMapSelection.ts` - Added ViewModel support with breakdown construction
   - Fixed `useMapSearch.ts` - Converted domain Place to PlannedPlaceViewModel
   - Fixed `useDiscoverFilters.ts` - Fixed flattened discovery item structure
   - Reduced errors from 187 to ~100

2. **Substantial Progress on Phase 5: Update Components** (70% complete)
   - **Map Components (7 files):** tripMappers, PlaceMarkers, MapInteractiveLayer, DiscoveryMarkersLayer, DiscoveryMarker, ExpandedPlaceCard, PlacePreviewCard
   - **Discover Components (6 files):** PhotoGrid, PlaceCardGrid, PlaceList, PlaceCard, DiscoverView, DiscoverPanel
   - **Shared Components (1 file):** BasePlaceCard
   - All components now use ViewModels (no domain imports)
   - Fixed property access pattern: `.location.lat/.lng` → `.latitude/.longitude`
   - Removed `.attraction` wrapper access throughout
   - Reduced errors from ~100 to 79

3. **Architecture Compliance**
   - ✅ All components use DTOs/ViewModels only
   - ✅ No domain imports in fixed components
   - ✅ Proper type safety with no `any` or `unknown`
   - ✅ Consistent ViewModel structure throughout

4. **Updated Documentation**
   - Added detailed progress tracking
   - Documented all file changes with specific fixes
   - Updated metrics: 78% error reduction (363 → 79)

### Next Steps

**Remaining Work (~30% of Phase 5):**

1. Fix child components (PhotoGridItem, PlaceListItem)
2. Fix AI/Mobile suggestion cards
3. Fix Plan components (PlanItemCard, PlannedItemsList)
4. Fix remaining v1 components (ChatInterface, MarkerTooltip)
5. Fix API route DTO/ViewModel mapping

**Phase 6: Cleanup & Verification:**

- Run verification checklist
- Ensure zero domain imports in map-v2
- Final TypeScript/ESLint validation
