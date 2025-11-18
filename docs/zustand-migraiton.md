## Zustand Migration Plan (map-v2 only)

All steps below apply exclusively to `map-v2` surfaces. Legacy views remain on existing context/reducer paths until they are sunset.

---

## Current State Analysis

### Problem: Context Re-render Cascade

**Symptoms:**
- Clicking "Add to Plan" causes all visible place cards to blink (flash loading state)
- Scroll position jumps to top of list unexpectedly
- LazyImage components reset their loading state during re-renders

**Root Cause:**
1. `MapStateContext` uses Context API + reducer for all state management
2. When `plannedPlaces` updates (e.g., adding attraction), the entire context value changes
3. All consumers of `useMapState` re-render, even if they don't use `plannedPlaces`
4. Callback props (`onAddClick`, `onCardClick`, `setHoveredMarker`) get new references
5. `React.memo` on `PlaceCard` fails because callbacks changed
6. LazyImage components remount → shimmer loading animation briefly appears (the "blink")

### Context Architecture (Current)

**State Shape** (`MapStateV2`):
```typescript
{
  // Core data
  places: PlannedPlace[]                    // 🔥 Hot path: updates trigger cascades
  selectedPlaceId: string | null
  discoveryResults: AttractionScore[]       // 🔥 Hot path: large arrays
  searchCenters: { lat, lng }[]
  
  // Desktop UI
  activeMode: 'discover' | 'plan' | 'ai'
  sidebarCollapsed: boolean
  
  // Mobile UI  
  activeMobileTab: 'map' | 'discover' | 'plan'
  bottomSheetOpen, aiChatModalOpen, filterSheetOpen: boolean
  
  // View prefs
  viewMode: 'cards' | 'grid' | 'list'
  filters: { category, minScore, showHighQualityOnly }
  
  // AI
  aiConversation: AIMessage[]               // 🔥 Hot path: frequent updates
  aiContext: string | null
  
  // Loading/save state
  saveStatus, lastSaved
  isLoadingPlaces, isLoadingDiscovery, isLoadingAI
  
  // Progressive disclosure
  hoveredMarkerId: string | null            // 🔥 Hot path: mouse movements
  expandedCardPlaceId: string | null
  highlightedPlaceId: string | null
}
```

**Actions** (30 action types dispatched via reducer):
- Place CRUD: `ADD_PLACE`, `REMOVE_PLACE`, `REORDER_PLACES`, `ADD_ATTRACTION_TO_PLACE`, etc.
- Selection: `SELECT_PLACE`
- Discovery: `SET_DISCOVERY_RESULTS`, `ADD_DISCOVERY_RESULTS`, search centers
- UI modes: desktop mode, sidebar, mobile tabs, sheets/modals
- Filters: `UPDATE_FILTERS`, `CLEAR_FILTERS`
- AI: `ADD_AI_MESSAGE`, `CLEAR_AI_CONVERSATION`, context
- Loading flags, progressive disclosure cards

### Component Consumers (30 files)

**Discover Panel (Desktop & Mobile)** - Heavy consumers:
- `DiscoverPanel.tsx` - Orchestrates view, filters, results
- `PlaceCardGrid.tsx`, `PhotoGrid.tsx`, `PlaceList.tsx` - Display components
- `DiscoverHeader.tsx` - Place context, stats
- All read: `selectedPlaceId`, `discoveryResults`, `filters`, `places`, `highlightedPlaceId`
- All write: `addAttractionToPlace`, `addRestaurantToPlace`, `setHoveredMarker`, `setExpandedCard`, `setHighlightedPlace`

**Plan Panel** - Moderate consumers:
- `PlanPanel.tsx`, `HubCardList.tsx`, `HubCard.tsx`
- `PlannedItemList.tsx`, `MobileHubCard.tsx`, `MobilePlannedItem.tsx`
- All read: `places` (planned items), `selectedPlaceId`
- All write: `removeAttractionFromPlace`, `removeRestaurantFromPlace`, `reorderPlaces`

**Map Canvas** - High-frequency consumers:
- `MapCanvas.tsx` - Main map with markers
- `FloatingPlaceSearch.tsx` - Search overlay
- Read: `places`, `discoveryResults`, `searchCenters`, `hoveredMarkerId`, `expandedCardPlaceId`, `highlightedPlaceId`
- Write: `setHoveredMarker`, `setExpandedCard`, `closeCard`, `setHighlightedPlace`, search centers

**AI Sidebar** - Moderate consumers:
- `AIChatPanel.tsx`, `SuggestionCard.tsx`
- `useAIChat.ts` hook
- Read: `aiConversation`, `aiContext`, `isLoadingAI`, `selectedPlaceId`
- Write: `addAIMessage`, `clearAIConversation`, `setAIContext`, `addAttractionToPlace`

**Mobile Views** - Medium consumers:
- `MobileLayout.tsx` - Tab state
- `MapView.tsx`, `DiscoverView.tsx`, `PlanView.tsx` - View containers
- `FilterButton.tsx`, `FloatingAIButton.tsx` - UI controls
- `MobileSuggestionCard.tsx` - AI suggestions
- Read: `activeMobileTab`, sheet/modal flags, filters, view mode
- Write: mobile tab switches, sheet toggles

**Layouts** - Light consumers:
- `DesktopLayout.tsx` - Sidebar state

### Other Contexts in map-v2

**ScrollPreservationContext** (`DiscoverPanel.tsx`):
- Separate context for scroll position management
- Used by `PlaceCardGrid`, `PhotoGrid`, `PlaceList` via `useScrollPreservation()`
- Could be migrated to store slice for consistency

---

## Zustand Best Practices (from Context7 docs)

### 1. Fine-Grained Selectors
```typescript
// ❌ Bad: subscribes to entire store
const state = useMapStore()

// ✅ Good: subscribes only to needed slice
const places = useMapStore((state) => state.places)
const addAttraction = useMapStore((state) => state.addAttractionToPlace)
```

### 2. Shallow Equality for Derived Data
```typescript
import { useShallow } from 'zustand/react/shallow'

// ✅ Prevents re-renders when array contents unchanged
const plannedIds = useMapStore(
  useShallow((state) => {
    const ids = new Set<string>()
    state.places.forEach(p => {
      p.plannedAttractions?.forEach(a => ids.add(a.id))
    })
    return ids
  })
)
```

### 3. Co-locate Actions with State
```typescript
const useMapV2Store = create<State & Actions>((set, get) => ({
  // State
  places: [],
  
  // Actions next to state
  addAttractionToPlace: (placeId, attraction) => 
    set((state) => ({
      places: state.places.map(p =>
        p.id === placeId
          ? { ...p, plannedAttractions: [...p.plannedAttractions, attraction] }
          : p
      )
    }))
}))
```

### 4. Type-Safe Store Definition
```typescript
interface MapV2State {
  places: PlannedPlace[]
  selectedPlaceId: string | null
  // ... state fields
}

interface MapV2Actions {
  addAttractionToPlace: (placeId: string, attraction: Attraction) => void
  setSelectedPlace: (id: string | null) => void
  // ... action methods
}

type MapV2Store = MapV2State & MapV2Actions

export const useMapV2Store = create<MapV2Store>()(
  devtools(
    (set, get) => ({
      // State + actions
    })
  )
)
```

### 5. Middleware for DevTools & Persistence
```typescript
import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

export const useMapV2Store = create<MapV2Store>()(
  devtools(
    persist(
      (set, get) => ({ /* state + actions */ }),
      {
        name: 'map-v2-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist UI prefs, not runtime data
          viewMode: state.viewMode,
          sidebarCollapsed: state.sidebarCollapsed,
          filters: state.filters,
        }),
      }
    ),
    { name: 'MapV2Store' }
  )
)
```

### 6. Multiple Stores vs. Slices
For `map-v2`, a **single store with logical slices** is recommended:
- Discover, Plan, Map, AI, UI share context (selectedPlaceId)
- Easier to manage cross-slice updates (e.g., select place → load discovery)
- Use separate vanilla stores only if slices become truly independent

### 7. Caching Strategy for Discovery Results

**Problem:** Currently, navigating away from a place and back requires re-fetching all discovery data.

**Solution:** Store discovery results keyed by location/place coordinates:

```typescript
interface MapV2State {
  // Cache discovery results by location key
  discoveryCache: Map<string, {
    results: AttractionScore[]
    timestamp: number
    center: { lat: number; lng: number }
    radius: number
  }>
  
  // Current active discovery (pointer to cache entry)
  currentDiscoveryKey: string | null
  
  // Helper to generate cache key
  getDiscoveryCacheKey: (lat: number, lng: number, radius: number) => string
}

interface MapV2Actions {
  // Smart fetch: check cache first
  fetchDiscoveryResults: (lat: number, lng: number, radius: number) => Promise<void>
  
  // Clear stale cache entries (optional)
  clearDiscoveryCache: (olderThanMs?: number) => void
}

// Implementation
const useMapV2Store = create<MapV2Store>()((set, get) => ({
  discoveryCache: new Map(),
  currentDiscoveryKey: null,
  
  getDiscoveryCacheKey: (lat, lng, radius) => 
    `${lat.toFixed(4)}_${lng.toFixed(4)}_${radius}`,
  
  fetchDiscoveryResults: async (lat, lng, radius) => {
    const key = get().getDiscoveryCacheKey(lat, lng, radius)
    const cached = get().discoveryCache.get(key)
    
    // Return cached if exists and fresh (< 10 minutes old)
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
      set({ 
        currentDiscoveryKey: key,
        discoveryResults: cached.results,
        isLoadingDiscovery: false,
      })
      return
    }
    
    // Fetch and cache
    set({ isLoadingDiscovery: true })
    const results = await fetchNearbyPlaces(lat, lng, radius)
    
    set((state) => {
      const newCache = new Map(state.discoveryCache)
      newCache.set(key, {
        results,
        timestamp: Date.now(),
        center: { lat, lng },
        radius,
      })
      
      return {
        discoveryCache: newCache,
        currentDiscoveryKey: key,
        discoveryResults: results,
        isLoadingDiscovery: false,
      }
    })
  },
  
  clearDiscoveryCache: (olderThanMs = 30 * 60 * 1000) => {
    set((state) => {
      const newCache = new Map(state.discoveryCache)
      const now = Date.now()
      
      for (const [key, entry] of newCache.entries()) {
        if (now - entry.timestamp > olderThanMs) {
          newCache.delete(key)
        }
      }
      
      return { discoveryCache: newCache }
    })
  },
}))
```

**Benefits:**
- Navigate between places without re-fetching
- Expand search radius → only fetch new results, merge with cached
- Persist cache in sessionStorage (via persist middleware) for page refreshes
- Clear stale entries to prevent memory bloat

**Cache Key Strategy:**
- Round coordinates to 4 decimals (~11m precision) for cache hits
- Include radius in key (500m vs 1000m = different results)
- Consider adding filter state to key if filters affect backend query

---

## Target Store Structure

### Store Schema

```typescript
// src/components/map-v2/stores/mapV2Store.ts

import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import type { Attraction, AttractionScore } from '@/domain/map/models'
import type { AIMessage, PlannedPlace } from '../types'

// ============= STATE INTERFACES =============

interface DiscoverState {
  discoveryCache: Map<string, CachedDiscovery>
  currentDiscoveryKey: string | null
  discoveryResults: AttractionScore[]
  highlightedPlaceId: string | null
  filters: FilterState
  viewMode: 'cards' | 'grid' | 'list'
  isLoadingDiscovery: boolean
}

interface PlanState {
  places: PlannedPlace[]
  selectedPlaceId: string | null
  isLoadingPlaces: boolean
}

interface MapState {
  hoveredMarkerId: string | null
  expandedCardPlaceId: string | null
  searchCenters: Array<{ lat: number; lng: number }>
}

interface AIState {
  conversation: AIMessage[]
  context: string | null // Place ID
  isLoading: boolean
  modalOpen: boolean // Mobile
}

interface UIState {
  // Desktop
  activeMode: 'discover' | 'plan' | 'ai'
  sidebarCollapsed: boolean
  
  // Mobile
  activeMobileTab: 'map' | 'discover' | 'plan'
  bottomSheetOpen: boolean
  filterSheetOpen: boolean
  
  // Save status
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved: Date | null
}

// ============= ACTION INTERFACES =============

interface DiscoverActions {
  // Results
  fetchDiscoveryResults: (lat: number, lng: number, radius: number) => Promise<void>
  setDiscoveryResults: (results: AttractionScore[]) => void
  addDiscoveryResults: (results: AttractionScore[]) => void
  clearDiscoveryCache: (olderThanMs?: number) => void
  
  // Highlighting
  setHighlightedPlace: (id: string | null) => void
  
  // Filters
  updateFilters: (filters: Partial<FilterState>) => void
  clearFilters: () => void
  
  // View mode
  setViewMode: (mode: 'cards' | 'grid' | 'list') => void
}

interface PlanActions {
  // Place CRUD
  addPlace: (place: PlannedPlace) => void
  removePlace: (placeId: string) => void
  reorderPlaces: (sourceIndex: number, destIndex: number) => void
  
  // Attraction/Restaurant CRUD
  addAttractionToPlace: (placeId: string, attraction: Attraction) => void
  addRestaurantToPlace: (placeId: string, restaurant: Attraction) => void
  removeAttractionFromPlace: (placeId: string, attractionId: string) => void
  removeRestaurantFromPlace: (placeId: string, restaurantId: string) => void
  
  // Selection
  setSelectedPlace: (id: string | null) => void
  getSelectedPlace: () => PlannedPlace | null
  
  // Derived selectors
  getPlannedAttractionIds: () => Set<string>
}

interface MapActions {
  setHoveredMarker: (id: string | null) => void
  setExpandedCard: (id: string | null) => void
  closeCard: () => void
  addSearchCenter: (center: { lat: number; lng: number }) => void
  clearSearchCenters: () => void
}

interface AIActions {
  addMessage: (message: AIMessage) => void
  clearConversation: () => void
  setContext: (placeId: string | null) => void
  setModalOpen: (open: boolean) => void
}

interface UIActions {
  // Desktop
  setActiveMode: (mode: 'discover' | 'plan' | 'ai') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  
  // Mobile
  setMobileTab: (tab: 'map' | 'discover' | 'plan') => void
  setBottomSheetOpen: (open: boolean) => void
  setFilterSheetOpen: (open: boolean) => void
  
  // Save status
  setSaveStatus: (status: UIState['saveStatus']) => void
  setLastSaved: (date: Date) => void
}

// ============= COMBINED STORE TYPE =============

type MapV2Store = 
  & DiscoverState 
  & PlanState 
  & MapState 
  & AIState 
  & UIState
  & DiscoverActions
  & PlanActions
  & MapActions
  & AIActions
  & UIActions

// ============= STORE IMPLEMENTATION =============

export const useMapV2Store = create<MapV2Store>()(
  devtools(
    persist(
      (set, get) => ({
        // ========== DISCOVER STATE ==========
        discoveryCache: new Map(),
        currentDiscoveryKey: null,
        discoveryResults: [],
        highlightedPlaceId: null,
        filters: {
          category: 'all',
          minScore: 7,
          showHighQualityOnly: false,
        },
        viewMode: 'cards',
        isLoadingDiscovery: false,
        
        // ========== PLAN STATE ==========
        places: [],
        selectedPlaceId: null,
        isLoadingPlaces: false,
        
        // ========== MAP STATE ==========
        hoveredMarkerId: null,
        expandedCardPlaceId: null,
        searchCenters: [],
        
        // ========== AI STATE ==========
        conversation: [],
        context: null,
        isLoading: false,
        modalOpen: false,
        
        // ========== UI STATE ==========
        activeMode: 'discover',
        sidebarCollapsed: false,
        activeMobileTab: 'map',
        bottomSheetOpen: false,
        filterSheetOpen: false,
        saveStatus: 'idle',
        lastSaved: null,
        
        // ========== ACTIONS (see full implementation below) ==========
        // ... actions implemented inline
      }),
      {
        name: 'map-v2-storage',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          // Persist UI prefs only
          viewMode: state.viewMode,
          sidebarCollapsed: state.sidebarCollapsed,
          filters: state.filters,
          activeMode: state.activeMode,
          // Cache discovery for session
          discoveryCache: state.discoveryCache,
        }),
      }
    ),
    { name: 'MapV2Store' }
  )
)

// ========== SELECTOR HELPERS ==========

// Get planned attraction IDs (with shallow comparison)
export const selectPlannedIds = (state: MapV2Store) => {
  const ids = new Set<string>()
  state.places.forEach(p => {
    p.plannedAttractions?.forEach(a => ids.add(a.id))
    p.plannedRestaurants?.forEach(r => ids.add(r.id))
  })
  return ids
}

// Check if attraction is in plan
export const selectIsInPlan = (attractionId: string) => (state: MapV2Store) => {
  const ids = selectPlannedIds(state)
  return ids.has(attractionId)
}

// Get filtered discovery results
export const selectFilteredDiscovery = (state: MapV2Store) => {
  let results = [...state.discoveryResults]
  
  // Apply filters (same logic as DiscoverPanel)
  if (state.filters.category !== 'all') {
    results = results.filter((item: any) => {
      const isRestaurant = item.attraction?.types?.some((t: string) =>
        ['restaurant', 'food', 'cafe', 'bar', 'bakery'].includes(t)
      )
      return state.filters.category === 'restaurants' ? isRestaurant : !isRestaurant
    })
  }
  
  if (state.filters.showHighQualityOnly) {
    results = results.filter((item: any) => {
      const score = item.score || 0
      return score >= state.filters.minScore * 10
    })
  }
  
  return results
}
```

---

## Migration Stages

### Stage 1 – Foundation
- Create `src/components/map-v2/stores/mapV2Store.ts` with complete store implementation
- Implement all actions matching current reducer functionality
- Add selector helpers for derived data
- Set up devtools + sessionStorage persistence
- Write unit tests for store actions (add/remove attractions, filters, etc.)

### Stage 2 – Dual Wiring (Shim Period)

**Goal:** Keep existing Context working while introducing Zustand, allowing gradual migration.

**Steps:**
1. **Update MapStateProvider to use store under the hood:**
```typescript
// MapStateContext.tsx
import { useMapV2Store } from '../stores/mapV2Store'

export function MapStateProvider({ children }: MapStateProviderProps) {
  // Initialize store (no-op if already created)
  const store = useMapV2Store()
  
  // Context now just passes through to store
  return (
    <MapStateContext.Provider value={{ store }}>
      {children}
    </MapStateContext.Provider>
  )
}
```

2. **Update useMapState to proxy to store:**
```typescript
export function useMapState() {
  const context = useContext(MapStateContext)
  if (!context) {
    throw new Error('useMapState must be used within MapStateProvider')
  }
  
  // Proxy all selectors/actions to Zustand
  const places = useMapV2Store(state => state.places)
  const selectedPlaceId = useMapV2Store(state => state.selectedPlaceId)
  const addAttractionToPlace = useMapV2Store(state => state.addAttractionToPlace)
  // ... etc for all 40+ properties/methods
  
  return {
    places,
    selectedPlaceId,
    addAttractionToPlace,
    // ... return all with same API as before
  }
}
```

3. **Add scroll preservation to store:**
```typescript
interface UIState {
  // ...existing
  scrollPosition: number
}

interface UIActions {
  // ...existing
  saveScrollPosition: (position: number) => void
  getScrollPosition: () => number
}
```

**Validation:**
- Run full discover flow: select place, view results, add to plan, change filters
- Verify mobile tabs/sheets still work
- Check AI chat can add suggestions
- Confirm plan reordering works
- No performance regressions (should be same or faster)

### Stage 3 – Component Migration (`map-v2` views)

**Goal:** Migrate components to use Zustand directly, fixing the re-render cascade issue.

#### 3.1 Discover Components (Priority 1 - Fixes blinking cards bug)

**PlaceCardGrid.tsx:**
```typescript
// Before (using useMapState - causes re-renders)
const { places, selectedPlaceId, addAttractionToPlace, ... } = useMapState()

// After (fine-grained Zustand selectors)
import { useMapV2Store, selectPlannedIds } from '../stores/mapV2Store'
import { useShallow } from 'zustand/react/shallow'

const selectedPlaceId = useMapV2Store(state => state.selectedPlaceId)
const addAttractionToPlace = useMapV2Store(state => state.addAttractionToPlace)
const addRestaurantToPlace = useMapV2Store(state => state.addRestaurantToPlace)
const setHoveredMarker = useMapV2Store(state => state.setHoveredMarker)
const highlightedPlaceId = useMapV2Store(state => state.highlightedPlaceId)

// Use derived selector with shallow comparison
const plannedIds = useMapV2Store(useShallow(selectPlannedIds))
const isInPlan = (id: string) => plannedIds.has(id)
```

**Key Fix:** Actions are now stable references! `setHoveredMarker` doesn't change on every render, so `React.memo` on `PlaceCard` works correctly.

**PhotoGrid.tsx & PlaceList.tsx:**
- Apply same pattern as PlaceCardGrid
- Replace `useMapState` with direct store selectors
- Use `useShallow` for derived data

**DiscoverPanel.tsx:**
```typescript
// Replace useMapState selectors
const discoveryResults = useMapV2Store(state => state.discoveryResults)
const filters = useMapV2Store(state => state.filters)
const viewMode = useMapV2Store(state => state.viewMode)
const updateFilters = useMapV2Store(state => state.updateFilters)
const setViewMode = useMapV2Store(state => state.setViewMode)

// Use scroll position from store
const scrollPosition = useMapV2Store(state => state.scrollPosition)
const saveScrollPosition = useMapV2Store(state => state.saveScrollPosition)
```

**Expected Result:**
- ✅ Cards no longer blink when adding to plan
- ✅ Scroll position stays stable
- ✅ Only affected card re-renders

#### 3.2 Map Components

**MapCanvas.tsx:**
```typescript
// Fine-grained subscriptions for map markers
const places = useMapV2Store(state => state.places)
const discoveryResults = useMapV2Store(state => state.discoveryResults)
const hoveredMarkerId = useMapV2Store(state => state.hoveredMarkerId)
const expandedCardPlaceId = useMapV2Store(state => state.expandedCardPlaceId)
const highlightedPlaceId = useMapV2Store(state => state.highlightedPlaceId)
const searchCenters = useMapV2Store(state => state.searchCenters)

// Actions
const setHoveredMarker = useMapV2Store(state => state.setHoveredMarker)
const setExpandedCard = useMapV2Store(state => state.setExpandedCard)
```

**FloatingPlaceSearch.tsx:**
- Subscribe to `searchCenters`, `addSearchCenter` only

#### 3.3 Plan Components

**HubCard.tsx & PlannedItemList.tsx:**
```typescript
const places = useMapV2Store(state => state.places)
const removeAttractionFromPlace = useMapV2Store(state => state.removeAttractionFromPlace)
const removeRestaurantFromPlace = useMapV2Store(state => state.removeRestaurantFromPlace)
const reorderPlaces = useMapV2Store(state => state.reorderPlaces)
```

**Mobile plan views:**
- Same pattern, direct store access

#### 3.4 AI Components

**AIChatPanel.tsx & useAIChat.ts:**
```typescript
const conversation = useMapV2Store(state => state.conversation)
const context = useMapV2Store(state => state.context)
const isLoading = useMapV2Store(state => state.isLoading)
const addMessage = useMapV2Store(state => state.addMessage)
const clearConversation = useMapV2Store(state => state.clearConversation)
```

#### 3.5 Mobile Views

**MobileLayout.tsx:**
```typescript
const activeMobileTab = useMapV2Store(state => state.activeMobileTab)
const setMobileTab = useMapV2Store(state => state.setMobileTab)
```

**FilterButton.tsx, FloatingAIButton.tsx:**
- Subscribe only to modal/sheet flags they control

**Migration Checklist:**
- [ ] PlaceCardGrid.tsx
- [ ] PhotoGrid.tsx
- [ ] PlaceList.tsx
- [ ] DiscoverPanel.tsx
- [ ] DiscoverHeader.tsx
- [ ] MapCanvas.tsx
- [ ] FloatingPlaceSearch.tsx
- [ ] PlanPanel.tsx
- [ ] HubCardList.tsx
- [ ] HubCard.tsx
- [ ] PlannedItemList.tsx
- [ ] AIChatPanel.tsx
- [ ] useAIChat.ts
- [ ] SuggestionCard.tsx
- [ ] MobileLayout.tsx
- [ ] MapView.tsx
- [ ] DiscoverView.tsx
- [ ] PlanView.tsx
- [ ] FilterButton.tsx
- [ ] FloatingAIButton.tsx
- [ ] MobileHubCard.tsx
- [ ] MobilePlannedItem.tsx
- [ ] MobileSuggestionCard.tsx
- [ ] DesktopLayout.tsx

### Stage 4 – Cleanup & Enhancements

**Goal:** Remove legacy code and optimize the store.

**Steps:**
1. **Delete legacy Context/Reducer:**
   - Remove `mapStateReducer` from `MapStateContext.tsx`
   - Remove `MapAction` types and `initialMapState` (now in store)
   - Simplify `MapStateProvider` to just initialize store or remove entirely
   - Delete `types.ts` if all types moved to store

2. **Remove `useMapState` hook:**
   - Delete the proxy hook once no components use it
   - Grep for `useMapState` usage to confirm: `grep -r "useMapState" src/components/map-v2/`
   - Should return 0 results in component files

3. **Optimize selectors:**
```typescript
// Add more derived selectors
export const selectDiscoveryResultCount = (state: MapV2Store) => 
  state.discoveryResults.length

export const selectFilteredResultCount = (state: MapV2Store) =>
  selectFilteredDiscovery(state).length

export const selectPlannedPlaceCount = (state: MapV2Store) =>
  state.places.length

export const selectCurrentPlace = (state: MapV2Store) => {
  if (!state.selectedPlaceId) return null
  return state.places.find(p => p.id === state.selectedPlaceId) || null
}

// Memoized selector for expensive computations
import { createSelector } from 'reselect'

export const selectPlannedSetMemoized = createSelector(
  [(state: MapV2Store) => state.places],
  (places) => {
    const ids = new Set<string>()
    places.forEach(p => {
      p.plannedAttractions?.forEach(a => ids.add(a.id))
      p.plannedRestaurants?.forEach(r => ids.add(r.id))
    })
    return ids
  }
)
```

4. **Add persistence for discovery cache:**
   - Verify `discoveryCache` persists in sessionStorage
   - Test: navigate away, come back, cache should load instantly

5. **Performance monitoring:**
   - Add DevTools Redux extension
   - Monitor action dispatch times
   - Verify no unnecessary re-renders using React DevTools Profiler

**Files to Delete:**
- `src/components/map-v2/context/types.ts` (merged into store)
- `src/components/map-v2/context/MapStateContext.tsx` (or simplified to minimal provider)
- `src/components/map-v2/discover/DiscoverPanel.tsx` ScrollPreservationContext (if migrated to store)

### Stage 5 – Future `map-v2` Targets

**Additional Optimizations (Post-Migration):**

1. **Advanced Caching:**
   - Add ETags or version tracking for cache invalidation
   - Implement background refresh for stale cache entries
   - Add cache size limits (e.g., max 20 locations)

2. **Performance:**
   - Use `useStoreWithEqualityFn` for object/array comparisons
   - Add computed selectors for frequently accessed derived data
   - Consider splitting large components that still re-render unnecessarily

3. **Developer Experience:**
   - Add TypeScript strict mode to store
   - Create custom hooks for common selector patterns:
     ```typescript
     export const usePlannedIds = () => 
       useMapV2Store(useShallow(selectPlannedIds))
     
     export const useIsInPlan = (attractionId: string) =>
       useMapV2Store(state => selectIsInPlan(attractionId)(state))
     ```

4. **Future Migrations:**
   - Other React contexts in project (plan-v2, other features)
   - Heavy prop-drilling scenarios
   - Global UI state (notifications, modals)

---

## Testing Checklist

### Functional Tests (Each Stage)

**Stage 2 (Dual Wiring):**
- [ ] Select place on map → discovery results load
- [ ] Add attraction to plan → appears in plan panel
- [ ] Add restaurant to plan → appears in plan panel
- [ ] Remove from plan → disappears from plan panel
- [ ] Reorder places in plan → order persists
- [ ] Change filters → results filter correctly
- [ ] Switch view modes → layout changes
- [ ] Mobile tab switching works
- [ ] AI chat can send messages
- [ ] AI suggestions can be added to plan

**Stage 3 (Component Migration):**
After migrating each component group, test:

**Discover Panel:**
- [ ] Click "Add to Plan" → card doesn't blink ✅ **Main Fix**
- [ ] Scroll position stays stable ✅ **Main Fix**
- [ ] Only affected card shows "Added" state
- [ ] Hover over card → map marker highlights
- [ ] Click card → expanded view opens
- [ ] Change view mode → cards re-render correctly
- [ ] Filter changes → results update without blink

**Map Canvas:**
- [ ] Hover marker → card in discover highlights
- [ ] Click marker → card expands
- [ ] Search centers render correctly
- [ ] Multiple markers don't flicker

**Plan Panel:**
- [ ] Drag and drop reordering works
- [ ] Remove attraction → updates immediately
- [ ] Place cards show correct attractions
- [ ] Mobile plan view matches desktop

**AI Panel:**
- [ ] Send message → appears in conversation
- [ ] Add suggestion → goes to plan
- [ ] Clear conversation → resets state
- [ ] Mobile AI modal works

**Mobile:**
- [ ] Tab switching smooth
- [ ] Bottom sheet opens/closes
- [ ] Filter sheet works
- [ ] All views render correctly

**Stage 4 (After Cleanup):**
- [ ] All Stage 3 tests still pass
- [ ] DevTools shows clean action log
- [ ] No console errors
- [ ] Cache persists across refreshes
- [ ] Performance same or better

### Performance Tests

**Before Migration (Baseline):**
- [ ] Measure render count when adding to plan (should be ~50+ with Context)
- [ ] Time to interactive after place selection
- [ ] Scroll FPS during rapid scrolling

**After Migration (Expected Improvements):**
- [ ] Render count when adding to plan (should be ~1-3 with Zustand) ✅
- [ ] No frame drops during scroll ✅
- [ ] Faster state updates (no reducer overhead)

**Tools:**
- React DevTools Profiler
- Chrome Performance tab
- Redux DevTools (via Zustand middleware)

---

## Broader Adoption Opportunities

### Within map-v2 (Covered in Migration)
- ✅ MapStateContext → Zustand store
- ✅ ScrollPreservationContext → Store slice
- ✅ All 30 component consumers

### Other Candidates in Project

1. **plan-v2 Components** (`src/components/plan-v2/`)
   - 53 files with potential state management
   - Check for Context usage or heavy prop drilling
   - May have similar re-render issues

2. **PhotoLightbox** (`src/components/PhotoLightbox.tsx`)
   - If used across features, could benefit from shared state
   - Gallery navigation state

3. **Common Components** (`src/components/common/`)
   - DevStats, MobileNavigation
   - Check for prop drilling from parent pages

4. **Application-Level State**
   - User preferences (if not in Context)
   - Authentication state
   - Global notifications/toasts
   - Modal management

### Analysis Needed
Run these searches to find other Context usage:
```bash
grep -r "createContext" src/components --exclude-dir=map-v2
grep -r "useContext" src/components --exclude-dir=map-v2
grep -r "useReducer" src/components --exclude-dir=map-v2
```

Look for:
- Multiple Context providers nested deeply
- Props passed through 3+ component levels unchanged
- Components re-rendering due to parent state changes
- State shared between distant components

---

## References & Resources

### Zustand Documentation
- Official Docs: https://github.com/pmndrs/zustand
- Best Practices: `/pmndrs/zustand` (Context7)
- Selectors & Performance: https://github.com/pmndrs/zustand/blob/main/docs/guides/auto-generating-selectors.md

### Migration Examples
- Redux → Zustand: https://github.com/pmndrs/zustand/blob/main/docs/guides/migrating-to-v4.md
- Context → Zustand patterns: https://github.com/pmndrs/zustand/discussions/1180

### Project Docs
- Current architecture: `docs/project-highlevel.md`
- Map features: `docs/map-features.md`
- UX plan: `docs/map-ux-implementation-plan.md`

### References
- Zustand selectors & shallow comparison: `/pmndrs/zustand` docs on `useShallow`, `useStoreWithEqualityFn`.
- Co-locating actions with state & Redux-style reducers via middleware for complex updates.
- Type-safe multiple stores guidance for future slice extraction if map-v2 grows further.

