# Trip Planner UI/UX Improvements

## Map & Discover Features

### 1. Fix "Show on Map" Behavior
- **File:** `src/components/map-v2/search/SearchResults.tsx`
- **Action:** Update `onSelect` to:
  - Center map on the selected place.
  - Trigger "Search in this area" / `handleSearchArea` to load nearby attractions.
  - Ensure z-index of search results doesn't interfere with map when closed.

### 2. Discover Mode Improvements
- **File:** `src/components/map-v2/discover/PhotoGridItem.tsx` (and/or `PlaceCard.tsx`)
  - **Action:** Add `cursor-default` to text elements to prevent text selection cursor.
  - **Action:** Add a "View on Google Maps" icon/button to the card.
- **File:** `src/components/map-v2/map/MapInteractiveLayer.tsx`
  - **Action:** Remove `HoverMiniCard`.
  - **Action:** Change hover behavior to show `ExpandedPlaceCard`.

### 3. Map Markers & filters
- **File:** `src/components/map-v2/map/PlannedItemMarkers.tsx`
  - **Action:** Change marker color to Green (`#22c55e` / `green-500`) for all planned items to distinguish them from discoverable places.
- **File:** `src/components/map-v2/map/DiscoveryMarkersLayer.tsx`
  - **Action:** Verify filter logic (Categories, Score) is correctly applied to `discoveryResults`.

### 4. Map Layout & "No Distraction"
- **File:** `src/components/map-v2/layouts/DesktopLayout.tsx` / `MobileLayout.tsx`
  - **Action:** Ensure the "No Distraction" / Full Screen mode (toggled by the map button) hides the sidebar but *keeps* map controls (Zoom, Search Area, etc.) visible and interactive.
- **File:** `src/styles/global.css`
  - **Action:** Review and fix z-index stacking context to ensure Map Search and Cards appear correctly over the map but under modals.

## Plan & Chat Features

### 5. Chat Prompt Adjustment
- **File:** `src/application/plan/TravelPlanningChat.ts`
  - **Action:** Update `buildSystemPrompt` to explicitly instruct the AI to suggest *areas* (cities, districts, villages, hubs) rather than specific individual attractions, to serve as starting points for map exploration.

### 6. Plan UI Updates
- **File:** `src/components/plan-v2/layout/PlanHeader.tsx`
  - **Action:** Add a "Create" button (under Plan section or in Header).
  - **Action:** Add a tooltip/hover state: "Creates exportable plan from planned items (Coming Soon)".
- **File:** `src/components/common/MobileNavigation.tsx` (or relevant sidebar file)
  - **Action:** Ensure icons in the Plan tab match the style/set used in the Map tab.

## General UI Polish

### 7. Lightbox & Cards
- **File:** `src/components/PhotoLightbox.tsx`
  - **Action:** Add a visible "X" (Close) button in a convenient location (e.g., top right), ensuring it doesn't overlap critical content.
- **File:** `src/components/map-v2/map/ExpandedPlaceCard.tsx`
  - **Action:** Ensure "X" close button is visible and accessible.

