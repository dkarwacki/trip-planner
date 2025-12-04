# Map Feature Test Plan (`/map` Route)

## Test Objectives

1. **Validate Core Map Functionality**: Ensure the interactive Google Maps integration renders correctly, handles user interactions, and displays markers appropriately
2. **Verify Discovery Flow**: Confirm that selecting a place triggers nearby attraction/restaurant fetching, scoring works correctly, and results display properly
3. **Test AI Suggestions**: Validate the chat interface, tool-calling pattern, and suggestion display with priority badges
4. **Confirm Trip Persistence**: Ensure auto-save works with proper debouncing, trips load correctly from various entry points, and data syncs to the database
5. **Validate Responsive Experience**: Test both desktop (collapsible sidebars) and mobile (three-tab navigation) layouts function correctly
6. **Test State Management**: Verify Zustand store slices work independently and together, with proper persistence to sessionStorage

## Scope

**In Scope:**
- Map rendering and interaction (zoom, pan, markers)
- Discovery feature (nearby search, scoring, filtering)
- AI suggestions (chat, tool-calling, suggestions display)
- Trip management (create, load, auto-save, sync)
- Place autocomplete (search, debounce, selection)
- Mobile three-tab layout and navigation
- Desktop sidebar collapse/expand behavior
- Filter system (category, quality, sorting)
- Error handling and edge cases

**Out of Scope:**
- Google Maps API internal behavior (mocked)
- OpenAI/OpenRouter API internal behavior (mocked)
- Supabase internal operations (mocked)
- Authentication flows (tested separately)
- Plan page integration (tested separately)

---

## Test Cases

### Category 1: Map Initialization & Rendering

**TC-MAP-001: Map Canvas Initial Render**
- Priority: High
- Preconditions: Valid Google Maps API key configured
- Steps:
  1. Navigate to `/map` page
  2. Wait for map to load
- Expected Results:
  - Map renders with world view (lat: 0, lng: 0, zoom: 2)
  - No console errors related to Google Maps
  - `gestureHandling: "greedy"` applied for touch support

**TC-MAP-002: Map with Trip ID Parameter**
- Priority: High
- Preconditions: Existing trip with places in database
- Steps:
  1. Navigate to `/map?tripId={validTripId}`
  2. Wait for trip data to load
- Expected Results:
  - Trip places load and display as markers
  - Map fits bounds to show all places
  - Plan slice populated with trip data

**TC-MAP-003: Map with Conversation ID Parameter**
- Priority: High
- Preconditions: Existing conversation linked to a trip
- Steps:
  1. Navigate to `/map?conversationId={validConversationId}`
  2. Wait for trip data to load
- Expected Results:
  - Trip associated with conversation loads
  - First place is focused
  - Active mode set to "plan"

**TC-MAP-004: Map with Invalid Trip ID**
- Priority: Medium
- Preconditions: None
- Steps:
  1. Navigate to `/map?tripId={nonExistentId}`
- Expected Results:
  - Graceful error handling
  - Fallback to empty state or current trip
  - User-friendly error message displayed

**TC-MAP-005: Hub Place Markers Rendering**
- Priority: High
- Preconditions: Trip with multiple places loaded
- Steps:
  1. Load map with 3+ places
  2. Observe marker rendering
- Expected Results:
  - Blue numbered markers appear for each place
  - Markers use AdvancedMarkerElement
  - Marker size is 36px (unselected)

**TC-MAP-006: Selected Marker Visual State**
- Priority: Medium
- Preconditions: Places loaded on map
- Steps:
  1. Click on a place marker
  2. Observe marker visual change
- Expected Results:
  - Selected marker grows to 44px
  - Ring highlight appears around selected marker
  - Other markers remain at 36px

**TC-MAP-007: Discovery Markers Layer Visibility**
- Priority: High
- Preconditions: Discovery results available
- Steps:
  1. Set active mode to "discover"
  2. Observe discovery markers
- Expected Results:
  - Discovery markers visible in discover mode
  - Discovery markers visible in AI mode
  - Discovery markers hidden in plan mode

---

### Category 2: Discovery Feature Flow

**TC-DISC-001: Auto-fetch on Place Selection**
- Priority: High
- Preconditions: Map loaded with at least one place
- Steps:
  1. Select a place (hub) on the map
  2. Wait for discovery fetch
- Expected Results:
  - Parallel requests made to `/api/attractions` and `/api/restaurants`
  - Loading state shown during fetch
  - Results combined and deduplicated
  - Discovery results stored in DiscoverSlice

**TC-DISC-002: Attractions API Request Validation**
- Priority: High
- Preconditions: Valid coordinates
- Steps:
  1. POST to `/api/attractions` with `{ lat, lng, radius, limit }`
  2. Observe response
- Expected Results:
  - Request validates against `AttractionsQueryParamsSchema`
  - User personas fetched from database
  - `getTopAttractions` use case invoked
  - Response includes scored attractions

**TC-DISC-003: Scoring Algorithm Validation**
- Priority: High
- Preconditions: Raw attractions data available
- Steps:
  1. Process attractions through scoring algorithm
  2. Verify score components
- Expected Results:
  - Quality score = rating (60%) + log₁₀(reviews) (40%) × 50% weight
  - Persona score = 100 if types match, 10 otherwise × 10% weight
  - Diversity score rewards rare place types × 20% weight
  - Confidence score based on review thresholds × 20% weight

**TC-DISC-004: General Tourist Persona Scoring**
- Priority: Medium
- Preconditions: User has `general_tourist` persona selected
- Steps:
  1. Fetch attractions with general_tourist persona
  2. Observe scoring
- Expected Results:
  - Persona weight redistributed to quality
  - Quality weight becomes 60% total
  - No specific type matching applied

**TC-DISC-005: Attractions Cache Hit**
- Priority: High
- Preconditions: Previous request made for same location
- Steps:
  1. Request attractions for location A
  2. Request attractions for location A again (within 30 minutes)
- Expected Results:
  - Second request returns cached data
  - No new Google Maps API call made
  - Response time significantly faster

**TC-DISC-006: Attractions Cache Miss (TTL Expired)**
- Priority: Medium
- Preconditions: Cache entry exists but older than 30 minutes
- Steps:
  1. Simulate cache entry with expired TTL
  2. Request attractions for same location
- Expected Results:
  - Cache miss detected
  - Fresh data fetched from Google Maps API
  - Cache updated with new data

**TC-DISC-007: Discovery Cache Persistence**
- Priority: Medium
- Preconditions: Discovery results fetched
- Steps:
  1. Fetch discovery results
  2. Refresh page
  3. Check for cached results
- Expected Results:
  - Discovery cache persisted to sessionStorage
  - Cached results available after refresh
  - Cache includes timestamps for validation

**TC-DISC-008: Category Filter - Attractions Only**
- Priority: High
- Preconditions: Mixed attractions/restaurants in results
- Steps:
  1. Set category filter to "attractions"
  2. Observe filtered results
- Expected Results:
  - Only items without restaurant types shown
  - Restaurant types: `restaurant`, `food`, `cafe`, `bar`, `bakery` excluded

**TC-DISC-009: Category Filter - Restaurants Only**
- Priority: High
- Preconditions: Mixed attractions/restaurants in results
- Steps:
  1. Set category filter to "restaurants"
  2. Observe filtered results
- Expected Results:
  - Only items with restaurant types shown
  - Attractions excluded from view

**TC-DISC-010: Quality Score Filter**
- Priority: High
- Preconditions: Results with varying scores
- Steps:
  1. Set minScore filter to 7
  2. Observe filtered results
- Expected Results:
  - Only items with `score >= 70` shown
  - Filter formula: `score >= minScore * 10`

**TC-DISC-011: Result Sorting Order**
- Priority: Medium
- Preconditions: Filtered results available
- Steps:
  1. Apply filters
  2. Observe sort order
- Expected Results:
  - Attractions sorted first (by score descending)
  - Restaurants sorted second (by score descending)

**TC-DISC-012: Filter Persistence Per Place**
- Priority: Medium
- Preconditions: Multiple places with different filter states
- Steps:
  1. Set filters for Place A
  2. Switch to Place B, set different filters
  3. Switch back to Place A
- Expected Results:
  - Place A filters restored
  - Filter state persisted via `filterPersistence.ts`

---

### Category 3: AI Suggestions Feature

**TC-AI-001: Initial AI Message Send**
- Priority: High
- Preconditions: Place selected, AI mode active
- Steps:
  1. Enter message in AI chat input
  2. Submit message
- Expected Results:
  - Loading state shown
  - POST to `/api/attractions/suggest` with correct payload
  - Payload includes: place, mapCoordinates, conversationHistory, userMessage, personas

**TC-AI-002: Place Context Building**
- Priority: High
- Preconditions: Place with planned attractions/restaurants
- Steps:
  1. Send AI message with existing planned items
  2. Observe request payload
- Expected Results:
  - Place context includes planned attractions
  - Place context includes planned restaurants
  - Last 10 conversation messages included

**TC-AI-003: Tool-Calling Loop Execution**
- Priority: High
- Preconditions: AI request made
- Steps:
  1. Mock OpenAI to return tool calls
  2. Observe tool execution
- Expected Results:
  - `searchAttractions` and `searchRestaurants` tools available
  - Tool calls processed up to 5 iterations maximum
  - Coordinates overridden with `mapCoordinates` (AI doesn't control location)

**TC-AI-004: Initial Suggestion Requirements**
- Priority: High
- Preconditions: First AI request for a place
- Steps:
  1. Send initial AI message
  2. Observe suggestions
- Expected Results:
  - 5 attractions returned (≥1 hidden gem)
  - Maximum 2 restaurants returned
  - Suggestions include priority badges

**TC-AI-005: Priority Badge Display**
- Priority: Medium
- Preconditions: AI suggestions returned
- Steps:
  1. Receive suggestions with priority values
  2. Observe badge rendering
- Expected Results:
  - "must-see" badge for high priority
  - "highly recommended" badge for medium priority
  - "hidden gem" badge for special finds

**TC-AI-006: Follow-up Message Handling**
- Priority: High
- Preconditions: Initial suggestions received
- Steps:
  1. Send follow-up message (e.g., "Show me more museums")
  2. Observe response
- Expected Results:
  - Follow-up system prompt used
  - Results filtered to match specific query
  - Already-planned items excluded

**TC-AI-007: AI Suggestions Added to Discovery**
- Priority: High
- Preconditions: AI suggestions returned
- Steps:
  1. Receive AI suggestions
  2. Check discovery results
- Expected Results:
  - `addAIMessage` called with response
  - `addDiscoveryResults` called with suggestions
  - Suggestions appear in discovery panel

**TC-AI-008: Chain-of-Thought Display**
- Priority: Medium
- Preconditions: AI response includes `_thinking` array
- Steps:
  1. Receive AI response with reasoning
  2. Observe ThinkingProcess component
- Expected Results:
  - Chain-of-thought reasoning displayed
  - Expandable/collapsible UI for reasoning
  - Reasoning helps user understand suggestions

**TC-AI-009: AI Error Handling**
- Priority: High
- Preconditions: AI API returns error
- Steps:
  1. Mock API failure
  2. Send AI message
- Expected Results:
  - Error state shown in UI
  - User-friendly error message
  - Chat remains functional for retry

**TC-AI-010: Optimistic UI for Adding Suggestions**
- Priority: Medium
- Preconditions: AI suggestion displayed
- Steps:
  1. Click "Add" on a suggestion
  2. Observe immediate UI update
- Expected Results:
  - `addingPlaceIds` tracks in-progress additions
  - UI shows adding state immediately
  - `addedPlaceIds` updated on completion

---

### Category 4: Trip Persistence & Auto-Save

**TC-TRIP-001: Auto-Save Trigger on Dirty State**
- Priority: High
- Preconditions: Trip loaded, changes made
- Steps:
  1. Add/remove a place
  2. Wait for auto-save debounce (750ms)
- Expected Results:
  - `isDirty` flag set to true on change
  - 750ms debounce before save
  - PUT request to `/api/trips/${tripId}/places`

**TC-TRIP-002: Save Status Progression**
- Priority: Medium
- Preconditions: Auto-save triggered
- Steps:
  1. Make change to trigger save
  2. Observe save status indicator
- Expected Results:
  - Status: "idle" → "saving" → "saved" → "idle"
  - "saved" status shows for 2 seconds
  - UI reflects each status change

**TC-TRIP-003: Trip Title Auto-Update**
- Priority: Medium
- Preconditions: Trip with default "Trip to ..." title
- Steps:
  1. Add places to trip
  2. Trigger auto-save
- Expected Results:
  - Title auto-updates if still "Trip to ..."
  - Title reflects first place name
  - Custom titles not overwritten

**TC-TRIP-004: Load Trip by ID**
- Priority: High
- Preconditions: Valid trip ID
- Steps:
  1. Call `GET /api/trips/${tripId}`
  2. Verify response
- Expected Results:
  - Trip data returned with places
  - Places include planned attractions/restaurants
  - Data converted to `PlannedPlaceViewModel[]`

**TC-TRIP-005: Load Trip by Conversation ID**
- Priority: High
- Preconditions: Valid conversation ID
- Steps:
  1. Call `GET /api/trips/by-conversation/${conversationId}`
  2. Verify response
- Expected Results:
  - Trip linked to conversation returned
  - If 404, new trip created automatically
  - Conversation ID linked to new trip

**TC-TRIP-006: Load Current Trip (Default)**
- Priority: High
- Preconditions: User has previous trips
- Steps:
  1. Navigate to `/map` without parameters
  2. Observe trip loading
- Expected Results:
  - Most recent trip loaded via `GET /api/trips/current`
  - If no trips exist, empty state shown
  - Trip ID stored in plan slice

**TC-TRIP-007: Save Error Handling**
- Priority: High
- Preconditions: Network failure during save
- Steps:
  1. Make changes to trigger save
  2. Mock network failure
- Expected Results:
  - `saveStatus` set to "error"
  - `syncError` populated with error details
  - UI shows error indicator
  - Data not lost (stays in local state)

**TC-TRIP-008: Place Data Conversion**
- Priority: Medium
- Preconditions: Places in plan slice
- Steps:
  1. Trigger auto-save
  2. Inspect request payload
- Expected Results:
  - `PlannedPlace[]` converted to `PlaceDAO[]` via `plannedPlacesToDAOs`
  - All required fields mapped correctly
  - Photos and nested POIs included

---

### Category 5: Place Autocomplete

**TC-AUTO-001: Autocomplete Debounce**
- Priority: High
- Preconditions: Search input focused
- Steps:
  1. Type "Par" quickly
  2. Observe API calls
- Expected Results:
  - Only one request after 300ms of no typing
  - Intermediate keystrokes don't trigger requests
  - Debounce prevents API spam

**TC-AUTO-002: Autocomplete Suggestions Display**
- Priority: High
- Preconditions: Valid search query entered
- Steps:
  1. Type "Paris" and wait for suggestions
  2. Observe dropdown
- Expected Results:
  - `fetchAutocompleteSuggestions` called
  - Results displayed in dropdown
  - Each result shows name and address

**TC-AUTO-003: Place Selection and Details Fetch**
- Priority: High
- Preconditions: Autocomplete results shown
- Steps:
  1. Click on a suggestion
  2. Wait for details fetch
- Expected Results:
  - `fetchPlaceDetails` called with placeId
  - Fields fetched: id, displayName, formattedAddress, location
  - lat/lng extracted (handles both function and property access)

**TC-AUTO-004: Request Cancellation on New Input**
- Priority: Medium
- Preconditions: Autocomplete request in progress
- Steps:
  1. Type "Par"
  2. Before results return, type "is"
- Expected Results:
  - AbortController cancels previous request
  - Only latest request results displayed
  - No race condition issues

**TC-AUTO-005: Mobile Search Overlay**
- Priority: Medium
- Preconditions: Mobile viewport
- Steps:
  1. Tap search input
  2. Observe overlay behavior
- Expected Results:
  - Full-screen SearchOverlay opens
  - Keyboard appears
  - Results show in overlay

**TC-AUTO-006: Recent Searches Display**
- Priority: Low
- Preconditions: Previous searches made
- Steps:
  1. Focus search input (empty)
  2. Observe recent searches
- Expected Results:
  - Recent searches shown via RecentSearches component
  - Storage managed by `recentSearches.ts`
  - Click on recent search populates input

---

### Category 6: Search This Area Feature

**TC-AREA-001: Search Area Button Appearance**
- Priority: High
- Preconditions: Discovery results loaded for a location
- Steps:
  1. Pan map more than 2km from search center
  2. Observe SearchAreaButton
- Expected Results:
  - Button appears when `minDistance > 2km`
  - Uses Google Maps geometry `computeDistanceBetween`
  - Button shows "Search this area"

**TC-AREA-002: Search Area Button Hidden Near Searched Areas**
- Priority: Medium
- Preconditions: Multiple areas previously searched
- Steps:
  1. Search area A
  2. Search area B
  3. Pan back to area A
- Expected Results:
  - Button hidden when near any previous search center
  - All search centers tracked in `searchCenters` array
  - Avoids redundant searches

**TC-AREA-003: Search Area Trigger**
- Priority: High
- Preconditions: Search area button visible
- Steps:
  1. Click "Search this area" button
  2. Wait for results
- Expected Results:
  - New search triggered with current map center
  - New search center added to tracking array
  - Discovery results update with new location data

---

### Category 7: Mobile Experience

**TC-MOB-001: Three-Tab Navigation**
- Priority: High
- Preconditions: Mobile viewport (< 768px)
- Steps:
  1. Navigate to `/map` on mobile
  2. Observe bottom navigation
- Expected Results:
  - MobileBottomNav visible with 3 tabs
  - Tabs: Map (Map icon), Discover (Compass), Plan (ListTodo)
  - Safe-area padding applied: `calc(16px + env(safe-area-inset-bottom))`

**TC-MOB-002: Tab Persistence to Session Storage**
- Priority: Medium
- Preconditions: Mobile layout active
- Steps:
  1. Select "Plan" tab
  2. Refresh page
- Expected Results:
  - Active tab persisted with key `"map-mobile-active-tab"`
  - Plan tab remains selected after refresh

**TC-MOB-003: URL Tab Sync on Mount**
- Priority: Medium
- Preconditions: None
- Steps:
  1. Navigate to `/map?tab=plan`
  2. Observe active tab
- Expected Results:
  - Plan tab active based on URL param
  - URL param takes precedence over sessionStorage

**TC-MOB-004: Plan Tab Badge Count**
- Priority: Medium
- Preconditions: Items in plan
- Steps:
  1. Add items to plan
  2. Observe Plan tab
- Expected Results:
  - Badge shows `planItemCount`
  - Badge updates as items added/removed

**TC-MOB-005: Place Select Navigation Flow**
- Priority: High
- Preconditions: Mobile discover view
- Steps:
  1. Select a place from autocomplete
  2. Observe navigation
- Expected Results:
  - Place added via `handlePlaceSelect`
  - Switches to map tab
  - Zoom set to 13 if needed

**TC-MOB-006: AI Chat Modal**
- Priority: Medium
- Preconditions: Mobile map view
- Steps:
  1. Tap floating AI button
  2. Observe modal
- Expected Results:
  - AIChatModal opens full-screen
  - MobileChatHeader, MobileChatInput rendered
  - MobileSuggestionCard for results

**TC-MOB-007: Discover View Drawer**
- Priority: Medium
- Preconditions: Mobile discover tab
- Steps:
  1. Tap Discover tab
  2. Observe drawer behavior
- Expected Results:
  - Vaul drawer component renders
  - Swipeable to expand/collapse
  - Discovery results shown in drawer

---

### Category 8: Desktop Sidebar Experience

**TC-DESK-001: Collapsed Sidebar State**
- Priority: Medium
- Preconditions: Desktop viewport
- Steps:
  1. Collapse sidebar
  2. Observe UI
- Expected Results:
  - Sidebar width: 64px
  - Icon rail with tooltips shown
  - Mode icons visible: Discover, Plan, AI

**TC-DESK-002: Expanded Sidebar State**
- Priority: Medium
- Preconditions: Desktop viewport
- Steps:
  1. Expand sidebar
  2. Observe UI
- Expected Results:
  - Sidebar width: 24rem/28rem
  - Full panel content visible
  - Active mode panel rendered

**TC-DESK-003: Auto-Expand on Mode Click**
- Priority: Medium
- Preconditions: Sidebar collapsed
- Steps:
  1. Click mode icon (e.g., AI)
  2. Observe sidebar
- Expected Results:
  - Mode selected AND sidebar expanded
  - Single click performs both actions
  - Smooth transition animation

**TC-DESK-004: Mode Tab Switching**
- Priority: High
- Preconditions: Desktop layout, sidebar expanded
- Steps:
  1. Click Discover icon
  2. Click Plan icon
  3. Click AI icon
- Expected Results:
  - Correct panel renders for each mode
  - DiscoverMode, PlanMode, AIMode components load
  - State preserved when switching modes

---

### Category 9: Plan Management (Drag & Drop)

**TC-PLAN-001: Add Place to Plan**
- Priority: High
- Preconditions: Discovery results available
- Steps:
  1. Click "Add" on a discovery item
  2. Observe plan state
- Expected Results:
  - Item added to `places` array in PlanSlice
  - `isDirty` set to true
  - UI updates immediately

**TC-PLAN-002: Remove Place from Plan**
- Priority: High
- Preconditions: Places in plan
- Steps:
  1. Click remove button on a place
  2. Observe plan state
- Expected Results:
  - Place removed from `places` array
  - `isDirty` set to true
  - Associated POIs also removed

**TC-PLAN-003: Add Attraction to Place**
- Priority: High
- Preconditions: Place in plan, discovery result available
- Steps:
  1. Add an attraction to existing place
  2. Observe place state
- Expected Results:
  - `addAttractionToPlace` action called
  - Attraction added to `plannedAttractions` array
  - `isDirty` set to true

**TC-PLAN-004: Drag and Drop Reorder**
- Priority: High
- Preconditions: Multiple places in plan
- Steps:
  1. Drag Place A below Place B
  2. Drop to complete reorder
- Expected Results:
  - `reorderPlaces` action called
  - Places array reordered
  - @dnd-kit handles drag events
  - `isDirty` set to true

**TC-PLAN-005: Mobile Drag and Drop**
- Priority: Medium
- Preconditions: Mobile layout, items in plan
- Steps:
  1. Long press on a plan item
  2. Drag to new position
- Expected Results:
  - MobilePlanItemCard draggable
  - MobilePlanItemCardList uses @dnd-kit
  - Reorder works on touch devices

---

### Category 10: Expanded Place Card

**TC-CARD-001: Place Card Display on Hover**
- Priority: Medium
- Preconditions: Markers on map
- Steps:
  1. Hover over a place marker
  2. Observe card
- Expected Results:
  - HoverMiniCard or ExpandedPlaceCard appears
  - Card positioned correctly (CardPositioning.ts)
  - Card shows place details

**TC-CARD-002: Place Card Actions**
- Priority: Medium
- Preconditions: Place card visible
- Steps:
  1. Observe card action buttons
  2. Click relevant actions
- Expected Results:
  - Add to plan action available
  - View details action available
  - Card interactions work correctly

---

## Edge Cases and Boundary Conditions

**EC-001: Zero Discovery Results**
- Scenario: Search in area with no attractions
- Expected: EmptyState component displays with appropriate message

**EC-002: Maximum Places Limit**
- Scenario: Attempt to add more than max allowed places
- Expected: Graceful handling, user notification if limit exists

**EC-003: Very Long Place Names**
- Scenario: Place with 100+ character name
- Expected: Text truncated with ellipsis, no layout breaking

**EC-004: Invalid Coordinates in URL**
- Scenario: `/map?lat=invalid&lng=invalid`
- Expected: Fallback to default view, no crash

**EC-005: Concurrent Auto-Save Requests**
- Scenario: Rapid changes triggering multiple saves
- Expected: Debounce prevents concurrent requests, only latest state saved

**EC-006: Session Storage Full**
- Scenario: sessionStorage quota exceeded
- Expected: Graceful degradation, core functionality continues

**EC-007: Google Maps API Rate Limit**
- Scenario: Excessive API calls
- Expected: Error handling, cache helps prevent this

**EC-008: OpenAI API Timeout**
- Scenario: AI suggestion request times out
- Expected: Loading indicator, timeout error message, retry option

**EC-009: Offline Mode**
- Scenario: Network connection lost during use
- Expected: Cached data still accessible, error on new requests, save retried when online

**EC-010: Large Conversation History**
- Scenario: AI chat with 50+ messages
- Expected: Only last 10 messages sent to API, history still viewable

---

## Integration Testing

**INT-001: Discovery → Plan Integration**
- Verify: Adding discovery item updates plan slice and triggers auto-save

**INT-002: Plan → Map Markers Integration**
- Verify: Plan changes reflect immediately in PlannedItemMarkers

**INT-003: AI → Discovery Integration**
- Verify: AI suggestions appear in discovery panel via `addDiscoveryResults`

**INT-004: Autocomplete → Place Selection Integration**
- Verify: Selecting autocomplete result adds place, triggers discovery fetch

**INT-005: Trip Load → State Hydration**
- Verify: Loading trip populates all relevant slices (Plan, Discover cache, UI mode)

**INT-006: Mobile ↔ Desktop State Sync**
- Verify: State consistent when resizing between breakpoints

**INT-007: Filter → Map Markers Integration**
- Verify: Filtered discovery results reflect in DiscoveryMarkersLayer

**INT-008: URL Parameters → Context Provider**
- Verify: tripId/conversationId params correctly handled by MapStateContext

---

## Dependencies

### External Services (Mocked for Testing)
- Google Maps JavaScript API (`@googlemaps/js-api-loader`)
- Google Places API (nearby search, autocomplete, place details)
- Google Geocoding API
- OpenAI/OpenRouter API
- Supabase Database

### Internal Dependencies
- Zustand store (mapStore with all slices)
- Effect runtime (`AppRuntime`)
- Shared UI components (Shadcn/ui)
- Domain scoring algorithms
- Infrastructure cache layers

### Feature Dependencies
- Authentication (user context for personas)
- Plan page (conversation linking)

---

## Test Data Requirements

### Places Data
- At least 5 pre-created places with varying:
  - Coordinates (different continents)
  - Names (short, long, special characters)
  - Photos (0, 1, multiple)
  
### Trips Data
- Trip with no places (empty)
- Trip with 1 place
- Trip with 5+ places
- Trip with custom title
- Trip with default "Trip to..." title

### Discovery Data
- Attraction responses with varying:
  - Scores (0-100 range)
  - Types (museum, park, restaurant, café)
  - Review counts (10, 100, 1000, 10000)
  - Ratings (1.0 to 5.0)

### AI Suggestions Data
- Initial suggestion response (5 attractions, 2 restaurants)
- Follow-up response (filtered results)
- Response with `_thinking` chain-of-thought
- Tool-calling response requiring multiple iterations

### User Data
- User with no personas
- User with `general_tourist` persona
- User with specific personas (history, food, adventure)

### Personas
- general_tourist (no type matching)
- history_culture (matches museums, monuments)
- food_wine (matches restaurants, cafés)
- adventure (matches parks, outdoor)

