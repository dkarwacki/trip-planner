# /map-v2 UX Redesign - Detailed Implementation Plan

## Overview

This plan outlines the complete redesign of the `/map` view as `/map-v2`, addressing UX pain points while maintaining core functionality. The redesign focuses on:

- **Simplified information hierarchy** - Progressive disclosure to reduce clutter
- **Photo-first visual discovery** - Larger images, cleaner card designs
- **Platform-specific experiences** - Desktop power tools, mobile native patterns
- **Improved feature discoverability** - Make AI, planning, and filters obvious and accessible
- **Better itinerary building** - Cleaner lists, intuitive drag-drop interactions

### Key Design Principles

1. **Progressive Disclosure** - Show only what's needed, when it's needed
2. **Photo-First Visual Discovery** - Beautiful imagery drives exploration
3. **Obvious Feature Discovery** - Make AI and planning tools immediately apparent
4. **Platform-Native Patterns** - Desktop power user tools, mobile touch-optimized
5. **Cleaner Lists** - Keep familiarity but reduce clutter drastically

### Architecture Approach

- **No component reuse from v1** - Fresh implementation with lessons learned
- **Same backend infrastructure** - Reuse existing API endpoints, domain logic, and database
- **Effect stays server-side** - Browser components use async/await
- **Clean architecture maintained** - Follow existing project patterns
- **TypeScript strict mode** - Type safety throughout

---

## Stage 1: Project Setup & Architecture Foundation ✅

**Goal:** Establish the foundational structure for /map-v2 with proper state management, responsive detection, and clean architecture patterns.

### 1.1 Create Base File Structure ✅

**Files to create:**
- `/src/pages/map-v2.astro` - New page route with SSR disabled
- `/src/components/map-v2/MapPlannerV2.tsx` - Main orchestrator component
- `/src/components/map-v2/index.ts` - Barrel exports
- `/src/lib/map-v2/index.ts` - Feature-specific utilities
- `/src/components/map-v2/hooks/index.ts` - Custom hooks directory

**Page Setup:**
The map-v2.astro page should extract `tripId` and `conversationId` from URL search params and pass them to the main React component. Use `client:only="react"` directive since this is a fully interactive application. Set `prerender = false` for SSR.

**Main Component:**
MapPlannerV2 should be a thin wrapper that:
- Wraps everything in MapStateProvider (context)
- Uses useResponsive hook to detect platform
- Conditionally renders DesktopLayout or MobileLayout based on screen size
- Accepts tripId and conversationId as props to initialize state

**Tasks:**
- Set up new page route at `/map-v2`
- Create main orchestrator component that detects platform and renders appropriate layout
- Add barrel exports for clean imports (export everything from index.ts files)
- Add temporary link in navigation for testing access during development

---

### 1.2 Shared State Management ✅

**Files to create:**
- `/src/components/map-v2/context/MapStateContext.tsx` - Context provider with reducer
- `/src/components/map-v2/context/types.ts` - State and action type definitions
- `/src/components/map-v2/context/actions.ts` - Action creators (optional, for convenience)
- `/src/components/map-v2/context/index.ts` - Barrel exports

**State Structure:**
Create a comprehensive state interface (`MapStateV2`) that includes:

**Core Data:**
- `places` - Array of Place objects (hubs/locations in the itinerary)
- `selectedPlaceId` - Currently selected place (nullable)
- `discoveryResults` - Nearby attractions/restaurants for selected place

**Desktop UI State:**
- `activeMode` - Current sidebar mode: 'discover' | 'plan' | 'ai'
- `sidebarCollapsed` - Boolean for sidebar visibility

**Mobile UI State:**
- `activeMobileTab` - Current bottom nav tab: 'map' | 'plan'
- `bottomSheetOpen` - Boolean for place details sheet

**View Preferences:**
- `viewMode` - How to display discovery results: 'cards' | 'grid' | 'list'

**Filters:**
- `category` - Filter by type: 'all' | 'attractions' | 'restaurants'
- `minScore` - Minimum quality score: 7 | 8 | 9
- `showHighQualityOnly` - Boolean toggle for high-quality filter

**AI Conversation:**
- `aiConversation` - Array of messages (user and assistant)
- `aiContext` - Which place AI is currently helping with

**Auto-save State:**
- `saveStatus` - Current save state: 'idle' | 'saving' | 'saved' | 'error'
- `lastSaved` - Timestamp of last successful save

**Loading States:**
- `isLoadingPlaces`, `isLoadingDiscovery`, `isLoadingAI` - Separate loading flags

**Action Types:**
Define a discriminated union of all possible actions:
- Place management: SET_PLACES, ADD_PLACE, REMOVE_PLACE, REORDER_PLACES
- Selection: SELECT_PLACE
- Discovery: SET_DISCOVERY_RESULTS
- UI modes: SET_ACTIVE_MODE, TOGGLE_SIDEBAR, SET_MOBILE_TAB, SET_VIEW_MODE
- Filters: UPDATE_FILTERS
- AI: ADD_AI_MESSAGE, CLEAR_AI_CONVERSATION
- Save status: SET_SAVE_STATUS
- Loading: SET_LOADING

**Reducer Logic:**
Implement a reducer function that handles all actions immutably. Key behaviors:
- When a place is selected, auto-switch to 'discover' mode (desktop)
- When filters are updated, clear any existing discovery results (will be refetched)
- When sidebar is toggled, persist state to localStorage

**Provider Implementation:**
- Use useReducer with the reducer function and initial state
- Accept tripId and conversationId as props
- On mount, load initial data (places from Supabase based on URL params)
- Set up effects to persist UI preferences to localStorage (sidebar collapsed, view mode, filters)
- Provide both state and dispatch through context value

**Custom Hook:**
Export a `useMapState()` hook that:
- Calls useContext internally
- Throws an error if used outside provider
- Returns both state and dispatch for easy access

**Tasks:**
- Create comprehensive state interface covering all UI and data needs
- Implement reducer with all action handlers (immutable updates)
- Build context provider with initialization logic
- Add localStorage persistence for user preferences
- Add URL parameter handling for tripId/conversationId
- Create useMapState hook with error handling

---

### 1.3 Responsive Layout Detection ✅

**Files to create:**
- `/src/components/map-v2/hooks/useResponsive.ts` - Platform detection hook
- `/src/components/map-v2/hooks/useMediaQuery.ts` - Primitive media query hook

**useMediaQuery Hook:**
Create a low-level hook that:
- Accepts a media query string (e.g., "(max-width: 639px)")
- Returns a boolean indicating if the query matches
- Handles SSR safely (returns false on server, uses window.matchMedia on client)
- Sets up event listener for media query changes
- Cleans up listener on unmount
- Updates state when media query match changes

**useResponsive Hook:**
Build on useMediaQuery to provide semantic breakpoints:
- `isMobile` - true when viewport ≤639px (Tailwind sm breakpoint)
- `isTablet` - true when viewport is 640px-1023px
- `isDesktop` - true when viewport ≥1024px (Tailwind lg breakpoint)
- `platform` - Helper string: 'mobile' | 'tablet' | 'desktop'

**Breakpoints:**
Align with Tailwind CSS defaults:
- Mobile: max-width 639px
- Tablet: 640px - 1023px
- Desktop: 1024px and up

**Tasks:**
- Implement useMediaQuery with SSR safety and proper cleanup
- Create useResponsive with semantic breakpoints matching Tailwind
- Ensure no memory leaks from event listeners
- Test resize behavior (debouncing handled by browser's matchMedia)

---

### 1.4 Type Definitions ✅

**Files to create:**
- `/src/components/map-v2/types/index.ts` - Shared UI type definitions

**Type Categories:**

**Enums/Union Types:**
- `ViewMode` - 'cards' | 'grid' | 'list'
- `DesktopMode` - 'discover' | 'plan' | 'ai'
- `MobileTab` - 'map' | 'plan'
- `SaveStatus` - 'idle' | 'saving' | 'saved' | 'error'
- `PriorityLevel` - 'must-see' | 'highly-recommended' | 'hidden-gem'

**Component Props Interfaces:**
- `PlaceCardProps` - For place card components (includes viewMode, callbacks)
- `HubCardProps` - For hub cards in plan mode
- `SuggestionCardProps` - For AI suggestion cards

**Data Structures:**
- `SuggestionCard` - AI suggestion with priority, reasoning, photo
- `FilterState` - Category, score threshold, and toggle flags

**Tasks:**
- Define all shared types used across multiple components
- Export from barrel index for easy imports
- Ensure type safety for all discriminated unions
- Document complex types with JSDoc comments

---

### Expected Outcomes for Stage 1 ✅

After completing this stage, you should have:

 **File structure** for /map-v2 in place
✅ **State management** with Context API and reducer
✅ **Responsive detection** working across devices
✅ **Type safety** with comprehensive interfaces
✅ **Clean architecture** following project patterns
✅ **URL parameter** handling for tripId/conversationId
✅ **localStorage** persistence for UI preferences

**Next Stage Preview:** Stage 2 will build the desktop layout foundation with the header, dynamic sidebar shell, and map canvas integration.

---

## Stage 2: Desktop Layout Foundation ✅

**Goal:** Create the core desktop layout structure with header, collapsible sidebar, and map canvas integration.

### 2.1 Main Desktop Layout Structure ✅

**Files to create:**
- `/src/components/map-v2/layouts/DesktopLayout.tsx` - Main desktop container
- `/src/components/map-v2/layouts/DesktopHeader.tsx` - Top header bar

**Layout Architecture:**
```
┌─────────────────────────────────────────────┐
│ Header (60px fixed height)                  │
│ - Logo/title left                           │
│ - Search bar center (400px)                 │
│ - Save status & Back link right             │
├──────────────┬──────────────────────────────┤
│              │                              │
│  Sidebar     │   Map Canvas                 │
│  400-480px   │   (flex-1, takes remaining)  │
│  Fixed width │                              │
│  Collapsible │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

**Header Components:**
- **Left side:** Small app logo or "Trip Planner" text
- **Center:** Place search bar (persistent, always visible)
  - Width: ~400px
  - Placeholder: "Search for a place..."
  - Autocomplete dropdown appears below
- **Right side:**
  - Save status indicator (small pill: "Saving..." / "Saved ✓")
  - "Back to Planning" link (only visible if conversationId in URL)

**Main Container:**
- Use CSS Grid or Flexbox for layout
- Full viewport height minus header (calc(100vh - 60px))
- Left column: sidebar with fixed width when expanded
- Right column: flex-1 to fill remaining space

**Responsive Behavior:**
- On very wide screens (>1920px), consider max-width on sidebar
- On narrow desktop (<1200px), reduce sidebar to minimum width (320px)

**Tasks:**
- Create DesktopLayout container with CSS Grid/Flexbox
- Build fixed-height header with three-column layout
- Add place search bar (functional autocomplete added later)
- Implement save status indicator (reads from context)
- Add conditional "Back to Planning" link based on URL params
- Ensure proper z-index stacking (header on top)

---

### 2.2 Dynamic Sidebar Shell ✅

**Files to create:**
- `/src/components/map-v2/sidebar/DynamicSidebar.tsx` - Sidebar container
- `/src/components/map-v2/sidebar/SidebarModeSelector.tsx` - Tab switcher
- `/src/components/map-v2/sidebar/CollapsedSidebarRail.tsx` - Slim collapsed state

**Sidebar Structure:**
```
┌────────────────────────┐
│ Mode Tabs (sticky top) │
│ [Discover][Plan][AI]   │
├────────────────────────┤
│                        │
│  Content Area          │
│  (switches based on    │
│   active mode)         │
│                        │
│  - DiscoverPanel       │
│  - PlanPanel           │
│  - AIChatPanel         │
│                        │
└────────────────────────┘
```

**Mode Selector Design:**
- Three horizontal tabs at top of sidebar
- Tab labels and icons:
  - **Discover** (🔍 icon) - Browse nearby attractions and restaurants
  - **Plan** (📋 icon) - Organize your itinerary
  - **AI Suggestions** (✨ icon) - Get personalized recommendations (better than just "AI Chat")
- Active state: Bold text, bottom border (accent color, 2px)
- Inactive state: Normal weight, muted text
- Sticky position so tabs remain visible when scrolling content
- Keyboard navigation: Tab key to focus, Arrow keys to switch
- **Important:** Consider adding subtle tooltips on hover explaining what each tab does

**Collapsed State:**
When sidebar is collapsed:
- Sidebar shrinks to ~60px width (shows only icons)
- Mode tabs become vertical icon stack
- Tooltips appear on hover showing mode names
- Collapse button transforms to expand button
- Smooth width transition (200ms ease-out)

**Content Switching:**
- Only render active mode's panel (unmount others to save resources)
- Fade transition when switching modes (150ms)
- Preserve scroll position per mode (use refs or state)

**Collapse Button:**
- Position: Top-right of sidebar (or bottom of mode tabs)
- Icon: Chevron left (collapsed) / right (expanded)
- Tooltip: "Collapse sidebar" / "Expand sidebar"
- Keyboard shortcut: Cmd/Ctrl + B

**Tasks:**
- Create sidebar container with fixed width and scroll area
- Build mode selector with three tabs (Discover, Plan, AI Chat)
- Implement active/inactive tab styling
- Add keyboard navigation for tabs
- Create collapsed rail with vertical icon stack
- Implement collapse/expand toggle button
- Add smooth width transition animations
- Persist collapsed state to localStorage via context
- Ensure sticky positioning for mode tabs

---

### 2.3 Map Canvas Setup ✅

**Files to create:**
- `/src/components/map-v2/map/MapCanvas.tsx` - Map container wrapper
- `/src/components/map-v2/map/FloatingControls.tsx` - Optional custom controls (if needed)
- `/src/components/map-v2/map/useMapInstance.ts` - Hook to manage Google Maps instance
- `/src/components/map-v2/map/PlaceMarkers.tsx` - Marker rendering component

**Map Container:**
- Takes full height and width of right column
- Position relative for absolute-positioned overlays
- Background color while loading (light gray)

**Reuse from v1:**
Leverage existing Google Maps setup:
- Google Maps initialization logic
- API key configuration
- Map options (zoom controls, map type, etc.)

**Redesigned Elements:**

**Markers:**
- **Hub markers** (places in itinerary):
  - Circular shape (not default pin)
  - Color: Primary brand color
  - Size: 32x32px desktop
  - Show place photo thumbnail when selected
  - Number badge (1, 2, 3...) showing order

- **Discovery markers** (nearby attractions):
  - Smaller circular markers
  - Color-coded: Blue (attractions), Red (restaurants)
  - Size: 20x20px
  - Category icon inside circle
  - Progressive disclosure on interaction (see below)

**Progressive Disclosure Interaction System:**

The map uses a three-level progressive disclosure system for discovery markers:

**Level 1: Hover Mini Card (Desktop Only)**
- Trigger: Mouse hover on marker for 300ms
- Small preview card (200x120px) appears next to marker
- Contents:
  - Photo thumbnail (120x80px)
  - Place name (bold, 14px)
  - Rating stars + score badge (e.g., ★★★★☆ 8.7)
- No action buttons (just preview)
- Smart positioning: Flips direction near screen edges
- Smooth fade-in animation (150ms)
- Dismisses on mouse leave or click

**Level 2: Click Expanded Card**
- Trigger: Click on marker (or click on mini card)
- Replaces mini card with larger card (280x360px)
- Contents:
  - Hero photo (280x180px, 16:9 ratio)
  - Score badge (top-right of photo)
  - Place name (bold, 18px)
  - Category • Price • Distance (e.g., "Italian • $$ • 1.2km")
  - Rating: ★★★★☆ (234 reviews)
  - Action buttons:
    - **"Add to Plan"** (primary button, full width or left)
    - **"Details"** (secondary button, right)
  - Close button (×) in top-right corner
- Semi-transparent backdrop (0.1 opacity) dims other markers
- Card stays open until:
  - User clicks close button (×)
  - User clicks another marker
  - User clicks outside card
  - User presses ESC key
- Smart positioning algorithm prevents card from going off-screen

**Level 3: Details Panel**
- Trigger: Click "Details" button in expanded card
- Desktop: Opens Discover panel in sidebar, highlights selected place
- Mobile: Opens bottom sheet with full place details
- Shows complete information: photos, description, reviews, hours, etc.

**Why This Approach:**
1. **Reduces cognitive load** - Progressive disclosure (peek → commit → explore)
2. **Keeps map clean** - No persistent overlays
3. **Clear hierarchy** - Hover = preview, Click = action, Details = full info
4. **Single-action adding** - "Add to Plan" immediately accessible
5. **Prevents accidents** - 300ms hover delay avoids triggers while panning
6. **Platform-appropriate** - Desktop hover vs mobile tap patterns

**Floating Controls:**
Position: Bottom-right corner
- Map type selector (Map, Satellite, Terrain) - if needed
- Optional: Fullscreen button
- Note: Google Maps provides built-in zoom controls, no need to duplicate them
- Stack vertically with spacing
- Semi-transparent background
- Hover: Full opacity

**"Search This Area" Button:**
- Position: Top-center of map
- Appears when user pans map >2km from selected place
- Button text: "Search this area"
- Primary button styling
- Click: Fetch nearby places for current viewport center

**Map Interactions:**
- **Hover marker (desktop):** Show mini card after 300ms delay
- **Click marker:** Show expanded card with actions
- **Click "Add to Plan":** Add place to itinerary, update button state
- **Click "Details":** Open full details in sidebar/bottom sheet
- **Click outside card:** Close expanded card
- **ESC key:** Close expanded card
- **Pan/zoom:** Check if moved far enough to show search button
- **Click empty area:** Deselect current place, close any open cards

**Viewport Management:**
- When places load: Fit bounds to show all hub markers
- When place selected: Pan to location and zoom to level 14
- Smooth animations for pan/zoom (300ms duration)

**Tasks:**
- Create MapCanvas wrapper component
- Extract and reuse Google Maps initialization from v1
- Implement useMapInstance hook to expose map object
- Design and render custom circular markers for hubs
- Create discovery markers (color-coded by category)
- Create HoverMiniCard component with 300ms delay
- Build ExpandedPlaceCard with action buttons
- Implement smart positioning algorithm (flip near edges)
- Add backdrop overlay when card expanded (0.1 opacity)
- Handle hover delays and cancellation (prevent accidental triggers)
- Implement click outside to close
- Add ESC key handler for closing cards
- Sync card state with sidebar highlighting (bidirectional)
- Handle "Add to Plan" action with optimistic UI update
- Handle "Details" button (open sidebar/bottom sheet)
- Build floating controls panel if needed (Google Maps provides zoom controls by default)
- Implement "Search this area" button with appearance logic
- Add marker interaction handlers (hover, click)
- Implement viewport bounds fitting for multiple places
- Handle map pan/zoom to detect movement threshold
- Add smooth pan/zoom animations
- Ensure mobile touch adaptation (skip mini card, direct to expanded)
- Test card interactions on various screen sizes

---

### 2.3.5 Progressive Disclosure Cards (Map Overlays) ✅

**Goal:** Implement the hover and click card system for map markers that provides progressive disclosure of place information.

**Files to create:**
- `/src/components/map-v2/map/HoverMiniCard.tsx` - Hover preview card
- `/src/components/map-v2/map/ExpandedPlaceCard.tsx` - Click card with actions
- `/src/components/map-v2/map/CardPositioning.ts` - Smart positioning utilities
- `/src/components/map-v2/map/MapBackdrop.tsx` - Subtle backdrop overlay

**HoverMiniCard Component:**

Displays on hover after 300ms delay (desktop only).

**Visual Design:**
```
┌──────────────────────┐
│ [Photo 120x80px]     │ ← Thumbnail (16:9)
│ Place Name           │ ← Bold, 14px
│ ★★★★☆ 8.7           │ ← Rating stars + score badge
└──────────────────────┘
```

**Size & Layout:**
- Width: 200px
- Height: ~120px (auto-fits content)
- Photo: 120x80px (16:9 aspect ratio)
- Padding: 8px around content
- Border-radius: 8px
- Background: White
- Shadow: Elevation 8dp (0 4px 12px rgba(0,0,0,0.15))

**Positioning Logic:**
- Default: Appears to the right of marker
- If would overflow right edge: Flip to left side
- If would overflow bottom: Position above marker
- Always 12px offset from marker center
- Uses CardPositioning utility for calculations

**Behavior:**
- Shows after 300ms hover delay
- Cancels if mouse moves away before delay
- Dismisses on mouse leave
- Dismisses if user clicks (opens expanded card)
- Smooth fade-in animation (150ms)
- Does not block mouse events (pointer-events on card only)

**Props Interface:**
```typescript
interface HoverMiniCardProps {
  place: Attraction;
  position: { x: number; y: number }; // Marker screen position
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void; // Opens expanded card
}
```

**ExpandedPlaceCard Component:**

Displays on marker click, replaces mini card if present.

**Visual Design:**
```
┌────────────────────────┐
│ [Hero Photo 280x180]  [×]│ ← Close button (top-right)
│ [Score: 8.7]             │ ← Badge overlay on photo
├────────────────────────┤
│ Restaurant Name          │ ← Bold, 18px
│ Italian • $$ • 1.2km     │ ← Metadata, muted color
│ ★★★★☆ (234 reviews)     │ ← Rating inline
│                          │
│ ┌──────────┐ ┌────────┐ │
│ │Add to Plan│ │Details │ │ ← Action buttons
│ └──────────┘ └────────┘ │
└────────────────────────┘
```

**Size & Layout:**
- Width: 280px
- Height: ~360px (auto-fits content)
- Hero photo: 280x180px (16:9 ratio, full width)
- Content padding: 16px
- Button spacing: 8px gap
- Border-radius: 12px
- Background: White
- Shadow: Elevation 16dp (0 8px 24px rgba(0,0,0,0.2))

**Score Badge (on photo):**
- Position: Absolute, top-right (8px margin)
- Background: Semi-transparent white (0.9 opacity) or dark based on photo
- Size: 48x28px
- Border-radius: 6px
- Font: Bold, 14px
- Color-coded:
  - Green: 9.0-10.0
  - Blue: 8.0-8.9
  - Gray: 7.0-7.9

**Close Button:**
- Position: Absolute, top-right of card (8px margin)
- Icon: × (X)
- Size: 32x32px (touch-friendly)
- Background: Semi-transparent white circle
- Hover: Darker background

**Action Buttons:**
- **"Add to Plan"** (Primary):
  - Width: ~60% or full width depending on layout
  - Height: 44px (touch-friendly)
  - Primary brand color
  - Bold text
  - States:
    - Default: "Add to Plan"
    - Loading: Spinner + "Adding..."
    - Added: "Added ✓" (green, disabled)
    - Already in plan: "In Plan ✓" (muted, disabled)

- **"Details"** (Secondary):
  - Width: ~40% or separate row
  - Height: 44px
  - Secondary/outline styling
  - Opens full details in sidebar/bottom sheet

**Positioning Logic:**
- Default: Centered on marker, slightly above
- Smart positioning algorithm:
  - Check if fits in viewport
  - If overflow right: Shift left
  - If overflow left: Shift right
  - If overflow top: Position below marker
  - If overflow bottom: Position above marker
  - Always maintain 16px margin from viewport edges

**Backdrop Overlay:**
- Semi-transparent dark overlay (0.1 opacity)
- Covers entire map area
- Slightly dims other markers
- Click backdrop → closes card
- Smooth fade-in/out (150ms)

**Behavior:**
- Opens on marker click
- Opens on mini card click (replaces mini card)
- Stays open until:
  - User clicks close button (×)
  - User clicks backdrop/outside
  - User clicks another marker (switches card)
  - User presses ESC key
- Smooth fade-in animation (200ms)
- Smooth fade-out animation (150ms)
- z-index: Above markers, below modals

**Props Interface:**
```typescript
interface ExpandedPlaceCardProps {
  place: Attraction;
  position: { x: number; y: number }; // Marker screen position
  isAddedToPlan: boolean;
  isAddingToPlan?: boolean;
  onClose: () => void;
  onAddToPlan: (placeId: string) => void;
  onViewDetails: (placeId: string) => void;
}
```

**CardPositioning Utility:**

Helper functions for smart positioning.

**Functions:**
```typescript
// Calculate position that keeps card in viewport
function calculateCardPosition(params: {
  markerPosition: { x: number; y: number };
  cardSize: { width: number; height: number };
  viewportSize: { width: number; height: number };
  offset?: number;
  preferredSide?: 'top' | 'bottom' | 'left' | 'right';
}): {
  x: number;
  y: number;
  side: 'top' | 'bottom' | 'left' | 'right';
};

// Check if position would overflow viewport
function wouldOverflow(params: {
  position: { x: number; y: number };
  size: { width: number; height: number };
  viewport: { width: number; height: number };
  margin?: number;
}): {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
};

// Adjust position to fit in viewport
function constrainToViewport(params: {
  position: { x: number; y: number };
  size: { width: number; height: number };
  viewport: { width: number; height: number };
  margin?: number;
}): { x: number; y: number };
```

**MapBackdrop Component:**

Simple backdrop overlay when expanded card is open.

**Visual:**
- Full-screen overlay
- Background: rgba(0, 0, 0, 0.1)
- Position: Fixed, covers map area only (not sidebar)
- z-index: Between map and card
- Pointer events: Enabled (click to close card)
- Animation: Fade in/out (150ms)

**Props:**
```typescript
interface MapBackdropProps {
  isVisible: boolean;
  onClick: () => void;
}
```

**State Management:**

Add to MapStateContext:
```typescript
interface MapStateV2 {
  // ...existing state
  
  // Card state
  hoveredMarkerId: string | null;
  expandedCardPlaceId: string | null;
}

// Actions
type MapAction = 
  // ...existing actions
  | { type: 'SET_HOVERED_MARKER'; payload: string | null }
  | { type: 'SET_EXPANDED_CARD'; payload: string | null }
  | { type: 'CLOSE_CARD' };
```

**Implementation Notes:**

**Hover Delay Implementation:**
Use a timeout pattern:
```typescript
let hoverTimeout: ReturnType<typeof setTimeout> | null = null;

const handleMarkerMouseEnter = (placeId: string) => {
  hoverTimeout = setTimeout(() => {
    dispatch({ type: 'SET_HOVERED_MARKER', payload: placeId });
  }, 300);
};

const handleMarkerMouseLeave = () => {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
  dispatch({ type: 'SET_HOVERED_MARKER', payload: null });
};
```

**Mobile Adaptation:**
- Skip HoverMiniCard entirely (no hover on touch)
- Tap marker → directly show ExpandedPlaceCard
- Position card at bottom of screen (easier thumb access)
- Swipe down gesture to dismiss (optional enhancement)
- Buttons: 48px height minimum for touch

**Accessibility:**
- HoverMiniCard: `role="tooltip"`, `aria-label="Quick preview of [Place Name]"`
- ExpandedPlaceCard: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="place-name"`
- Close button: `aria-label="Close place details"`
- Add to Plan: `aria-label="Add [Place Name] to plan"`
- Details button: `aria-label="View full details for [Place Name]"`
- ESC key closes card
- Focus management: Trap focus in expanded card when open

**Performance:**
- Lazy load place photos (only when card opens)
- Use blur-up placeholder technique
- Debounce hover events (300ms delay helps)
- Cleanup timeouts on unmount
- Memoize card components (prevent unnecessary re-renders)

**Tasks:**
- Create HoverMiniCard component with 300ms hover delay
- Implement smooth fade-in/out animations
- Build ExpandedPlaceCard with hero photo and actions
- Add score badge overlay on photo
- Implement "Add to Plan" button with optimistic UI
- Implement "Details" button (opens sidebar/bottom sheet)
- Create smart positioning utility functions
- Add backdrop overlay component
- Handle click outside to close
- Add ESC key handler
- Implement hover delay with cleanup
- Add state management for card visibility
- Ensure mobile touch adaptation (skip hover, direct to expanded)
- Position expanded card at bottom on mobile
- Implement swipe-to-dismiss (mobile, optional)
- Add accessibility attributes (role, aria-*)
- Test on various screen sizes and devices
- Test edge cases (viewport edges, multiple rapid interactions)
- Optimize photo loading (lazy load, blur-up)

---

### 2.4 Layout Integration & Testing

**Integration Tasks:**
- Wire up sidebar mode selector to context state (activeMode)
- Connect collapse button to context (sidebarCollapsed)
- Sync map selection with context (selectedPlaceId)
- Test mode switching (Discover ↔ Plan ↔ AI Chat)
- Test sidebar collapse/expand with animation
- Test keyboard shortcuts (Cmd+B for sidebar toggle)

**Responsive Testing:**
- Test on different desktop widths (1024px, 1366px, 1920px, 2560px)
- Ensure sidebar doesn't overflow on narrow screens
- Verify header search bar doesn't get squashed
- Check map remains functional when sidebar width changes

**Accessibility:**
- Add ARIA labels to all buttons (collapse, mode tabs, zoom controls)
- Ensure keyboard focus visible (focus-visible ring)
- Test tab order: Header search → Mode tabs → Sidebar content → Map
- Add landmarks: header (banner), sidebar (complementary), map (main)
- Ensure screen reader announces mode changes

**Performance:**
- Ensure smooth 60fps during sidebar transitions
- Lazy load map only when component mounts (not SSR)
- Debounce "search area" detection (100ms)

---

### Expected Outcomes for Stage 2 ✅

After completing this stage, you should have:

✅ **Complete desktop layout** with header, sidebar, and map
✅ **Mode switching** working smoothly (Discover/Plan/AI tabs)
✅ **Collapsible sidebar** with animations and persistence
✅ **Google Maps integration** with custom markers
✅ **Map controls** (using Google Maps built-in controls)
✅ **Progressive disclosure cards** (hover mini card and expanded place card)
✅ **Keyboard navigation** for tabs and shortcuts
✅ **Responsive behavior** across desktop widths
✅ **Accessibility** with ARIA labels and landmarks

**Next Stage Preview:** Stage 3 will implement the Discover mode panel with photo cards, filters, and view toggles.

---

### 2.5 AI Feature Discoverability Strategy

**Problem:** Users may not understand what the "AI Suggestions" tab does or when to use it.

**Solutions to Implement:**

**1. Clear Tab Naming:**
- Use "AI Suggestions" instead of "AI Chat" or just "AI"
- Tooltip on hover: "Get personalized recommendations for [Place Name]" or "Ask AI about this destination"

**2. Context Indicator (Always Visible):**
When AI tab is active, show at the top:
```
┌────────────────────────────────┐
│ Getting suggestions for:       │
│ 📍 Paris, France              │
├────────────────────────────────┤
│ [AI conversation area]         │
```
- Makes it immediately clear which place AI is helping with
- If no place selected: "Select a place on the map to get AI suggestions"

**3. Empty State with Clear Examples:**
When AI tab is opened for the first time (or no messages yet):
```
┌────────────────────────────────────────┐
│ ✨ AI Suggestions                      │
│                                        │
│ Ask me anything about Paris!           │
│                                        │
│ Try these:                             │
│ ┌────────────────────────────────┐   │
│ │ "Must-see attractions"          │   │ ← Clickable chips
│ │ "Romantic restaurants"          │   │
│ │ "Hidden gems locals love"       │   │
│ │ "Best cafes for breakfast"      │   │
│ └────────────────────────────────┘   │
│                                        │
│ Or type your own question...           │
└────────────────────────────────────────┘
```

**4. Visual Distinction from Discover Mode:**
Make it clear these are different features:
- **Discover mode:** Manual browsing with filters (photo cards, grid, list views)
- **AI Suggestions:** Conversational, personalized recommendations with reasoning

Add a small info icon (ⓘ) in AI tab with tooltip:
"AI analyzes your travel style and preferences to suggest personalized places you'll love"

**5. First-Time User Hint:**
On very first visit to AI tab (detect with localStorage flag):
- Show a dismissible banner or modal explaining:
  - "AI can suggest attractions and restaurants based on your preferences"
  - "Ask questions naturally, like 'Where should I eat tonight?' or 'Show me museums'"
  - "Every suggestion comes with reasoning so you understand why it's recommended"

**6. Suggested Prompts (Dynamic):**
Show context-aware suggestions based on:
- Selected place type (city, region, etc.)
- Time of day
- What's already in the plan

Examples:
- Morning: "Best cafes for breakfast near [Place]"
- If plan is empty: "Must-see highlights in [Place]"
- If plan has attractions: "Restaurants near my planned attractions"

**7. Badge/Indicator on Tab:**
When user selects a new place they haven't asked AI about yet:
- Show a small dot or "New" badge on AI Suggestions tab
- Subtle pulse animation to draw attention
- Tooltip: "Get AI suggestions for this location"

**8. Onboarding Tour (Optional):**
First-time users see a quick 3-step overlay:
1. "Select a place on the map"
2. "Browse nearby in Discover, or..."
3. "Ask AI for personalized suggestions ✨"

**Tasks:**
- Rename tab to "AI Suggestions" with clear icon
- Add context indicator showing which place AI is helping with
- Design compelling empty state with example prompts
- Implement clickable suggested questions (chips)
- Add subtle tooltips explaining the difference between modes
- Consider first-time user hint (localStorage flag)
- Test with users who haven't seen the feature before

---

## Stage 3: Discover Mode Panel (Desktop) ✅

**Goal:** Implement the Discover panel for browsing nearby attractions and restaurants with multiple view modes and filtering.

### 3.1 Discover Panel Structure ✅

**Files to create:**
- `/src/components/map-v2/sidebar/discover/DiscoverPanel.tsx` - Main panel container
- `/src/components/map-v2/sidebar/discover/DiscoverHeader.tsx` - Context and controls
- `/src/components/map-v2/sidebar/discover/FilterBar.tsx` - Category and quality filters
- `/src/components/map-v2/sidebar/discover/ViewToggle.tsx` - Cards/Grid/List switcher

**Panel Layout:**
```
┌────────────────────────────────┐
│ Selected: Paris, France        │ ← Context header
│ 45 attractions • 38 restaurants│
├────────────────────────────────┤
│ View: [Cards][Grid][List]      │ ← View toggle
├────────────────────────────────┤
│ [All][Attractions][Restaurants]│ ← Category filter
│ ☑ High-quality only (8.5+)     │ ← Quality toggle
├────────────────────────────────┤
│                                │
│  [Content Area - scrollable]   │
│   - PlaceCardGrid              │
│   - PhotoGrid                  │
│   - PlaceList                  │
│                                │
└────────────────────────────────┘
```

**Header Content:**
- Selected place name + location (if place selected)
- Quick stats: "X attractions • Y restaurants nearby"
- Empty state: "Select a place on the map to discover nearby spots"

**View Toggle:**
- Three options: Cards (default) | Grid | List
- Icon for each view type
- Active state: filled background
- Persist selection to localStorage

**Filter Bar:**
- **Category chips:** All | Attractions | Restaurants
  - Multi-select not needed (radio-style selection)
  - Active state: filled, accent color
- **Quality toggle:** Prominent switch/checkbox
  - Label: "High-quality only"
  - Shows threshold in tooltip: "8.5+ score"
- **Adjustable threshold (future):** Slider or dropdown for 7+ / 8+ / 9+

**Result Count Indicator:**
- Show filtered count: "Showing 12 of 45 places"
- Update dynamically when filters change
- Clear filters button if any active

**Tasks:**
- Create DiscoverPanel container with scrollable content area
- Build header with place context and stats
- Implement view toggle (3 buttons: Cards/Grid/List)
- Create filter bar with category chips
- Add prominent quality filter toggle
- Show result count with active filter indicator
- Add empty state when no place selected
- Wire filters to context state
- Persist view mode and filters to localStorage

---

### 3.2 Large Photo Card View ✅

**Files to create:**
- `/src/components/map-v2/sidebar/discover/PlaceCardGrid.tsx` - Grid container
- `/src/components/map-v2/sidebar/discover/PlaceCard.tsx` - Individual card
- `/src/components/map-v2/sidebar/discover/PlaceCardSkeleton.tsx` - Loading skeleton

**Card Design (full sidebar width, ~400px):**
```
┌────────────────────────────────┐
│                                │
│  Hero Photo (16:9 ratio)       │ ← Large, prominent image
│  [Score: 8.7]                  │ ← Badge top-right corner
│                                │
├────────────────────────────────┤
│ Restaurant Name                │ ← Semi-bold, 16-18px
│ Italian • $$ • 1.2km           │ ← Category, price, distance
│ ★★★★☆ (234 reviews)           │ ← Rating inline
│                                │
│ [+] Add to Plan                │ ← Full-width button
└────────────────────────────────┘
```

**Card States:**
- **Default:** Clean, white background, subtle border
- **Hover:** Slight shadow lift, scale 1.01
- **Added:** Button changes to "Added ✓" with checkmark, disabled state

**Photo Handling:**
- 16:9 aspect ratio (width: 100%, height: auto)
- Lazy loading with blur-up placeholder
- Alt text: place name
- Error fallback: neutral placeholder with icon

**Score Badge:**
- Position: Absolute, top-right corner (8px margin)
- Semi-transparent background (white/black based on image brightness)
- Size: ~40x24px
- Font: Bold, 14px
- Color-coded: Green (9-10), Blue (8-9), Gray (7-8)

**Expand Functionality:**
- Click card (not button) to open full details dialog
- Dialog shows: larger photos, full description, hours, reviews, map location
- "Add to Plan" button in dialog footer

**Tasks:**
- Create PlaceCard component with 16:9 photo
- Implement lazy loading with IntersectionObserver or library
- Design and position score badge (color-coded)
- Add hover effects (shadow, scale)
- Implement "Add to Plan" button with optimistic UI
- Show "Added ✓" state for places already in plan
- Add expand/click handler to open details dialog
- Create skeleton loader matching card layout
- Ensure smooth animations (150-200ms transitions)

---

### 3.3 Photo Grid View ✅

**Files to create:**
- `/src/components/map-v2/sidebar/discover/PhotoGrid.tsx` - Masonry grid
- `/src/components/map-v2/sidebar/discover/PhotoGridItem.tsx` - Individual photo item
- `/src/components/map-v2/sidebar/discover/PhotoLightbox.tsx` - Full-screen preview

**Grid Layout:**
- 2-column masonry layout (CSS Grid or library like react-masonry-css)
- Variable height images (maintain original aspect ratios)
- Small gap between images (8-12px)
- Smooth reflow when filters change

**Grid Item:**
```
┌─────────────┐
│             │
│   Photo     │ ← Variable height
│             │
│ [Score 8.7] │ ← Small badge
│ Place Name  │ ← Text overlay at bottom
└─────────────┘
```

**Overlay Content:**
- Gradient overlay at bottom (dark → transparent)
- Place name in white text
- Score badge (smaller, top-right)
- Hover: Show quick-add "+" button

**Lightbox:**
- Click photo → open full-screen lightbox
- Large photo display with pan/zoom
- Navigation: Arrow keys, swipe gestures
- Show place details in sidebar (name, rating, category)
- Quick actions: Add to Plan, View Details
- Close: ESC key, click outside, X button

**Tasks:**
- Implement 2-column masonry grid layout
- Create photo grid items with overlay
- Add hover state showing quick-add button
- Build full-screen lightbox component
- Add keyboard navigation (arrows, ESC)
- Support swipe gestures for touch devices
- Preload adjacent images in lightbox
- Show place info in lightbox sidebar
- Optimize image loading (progressive, WebP)

---

### 3.4 Compact List View ✅

**Files to create:**
- `/src/components/map-v2/sidebar/discover/PlaceList.tsx` - Virtualized list
- `/src/components/map-v2/sidebar/discover/PlaceListItem.tsx` - Compact item

**List Item Design (compact, ~70px height):**
```
┌────────────────────────────────────────┐
│ [Photo  ] Place Name              [+] │
│ [60x60px] Category • $$ • 1.2km        │
│           ★★★★☆ (234) Score: 8.7      │
└────────────────────────────────────────┘
```

**Layout:**
- Left: Square photo thumbnail (60x60px)
- Middle: Place details (name, meta info, rating/score)
- Right: Add button (icon only, 40x40px touch target)

**Virtualization:**
- Use react-window or react-virtual for long lists (>50 items)
- Dynamic item height if needed
- Scroll restoration when switching views

**Interactions:**
- Click item → select place on map + open details dialog
- Hover → highlight + subtle background change
- Sync with map markers (hover item highlights marker)

**Keyboard Navigation:**
- Arrow up/down to navigate list
- Enter to open details
- Space to add to plan

**Tasks:**
- Create compact list item component
- Implement virtualized list for performance
- Add small square photo thumbnails
- Show essential info only (name, category, rating, score)
- Add hover state synced with map markers
- Implement keyboard navigation
- Ensure 60fps scrolling performance
- Test with 100+ items

---

### 3.5 Data Fetching & Discovery ✅

**Files to create:**
- `/src/components/map-v2/hooks/useNearbyPlaces.ts` - Fetch nearby attractions/restaurants
- `/src/components/map-v2/hooks/usePlaceScoring.ts` - Calculate and apply scores

**Fetch Strategy:**
Reuse existing API endpoints from v1:
- `/api/attractions/nearby` - Fetch attractions
- `/api/restaurants/nearby` - Fetch restaurants
- Parallel requests for both categories
- Pass: lat, lng, radius (default: 5km)

**Caching:**
- Cache results per place (key: placeId + category)
- TTL: 5-10 minutes
- Use SWR or React Query for smart caching
- Invalidate cache when "Search This Area" button clicked

**Scoring:**
Reuse domain scoring logic from v1:
- Quality score (rating + review count)
- Diversity score (for attractions)
- Confidence score (review volume)
- Persona boost (based on user preferences)

**Loading States:**
- Show skeleton cards while loading
- Maintain layout (no content shift)
- Progressive loading: Show results as they arrive

**Error Handling:**
- Network error: Show retry button
- No results: Helpful empty state ("No attractions found. Try adjusting filters.")
- Partial failure: Show what loaded successfully

**Tasks:**
- Create useNearbyPlaces hook with caching
- Implement parallel fetching (attractions + restaurants)
- Apply scoring logic from domain layer
- Add loading skeletons matching view mode
- Handle errors gracefully with retry
- Show empty state when no results
- Implement cache invalidation
- Add refetch on "Search This Area" click

### Stage 3 Completion Summary ✅

**Implementation Date:** 2025-01-15

**Files Created (13):**
1. `/src/components/map-v2/discover/DiscoverPanel.tsx` - Main panel with dynamic view switching
2. `/src/components/map-v2/discover/DiscoverHeader.tsx` - Context header with stats
3. `/src/components/map-v2/discover/ViewToggle.tsx` - Cards/Grid/List switcher
4. `/src/components/map-v2/discover/FilterBar.tsx` - Category & quality filters
5. `/src/components/map-v2/discover/PlaceCardGrid.tsx` - Card grid container
6. `/src/components/map-v2/discover/PlaceCard.tsx` - Large photo card (16:9)
7. `/src/components/map-v2/discover/PlaceCardSkeleton.tsx` - Loading skeleton
8. `/src/components/map-v2/discover/PhotoGrid.tsx` - 2-column photo grid
9. `/src/components/map-v2/discover/PhotoGridItem.tsx` - Photo item with overlay
10. `/src/components/map-v2/discover/PlaceList.tsx` - Compact list view
11. `/src/components/map-v2/discover/PlaceListItem.tsx` - List item (~70px height)
12. `/src/components/map-v2/hooks/useNearbyPlaces.ts` - Data fetching hook
13. `/src/components/map-v2/discover/index.ts` - Barrel exports

**Key Features Implemented:**
- ✅ Three view modes (Cards, Grid, List) with smooth transitions
- ✅ Smart filtering (category + quality threshold with 7/8/9+ options)
- ✅ Progressive disclosure (empty states, loading states, filtered results)
- ✅ Color-coded score badges (green 9+, blue 8+, gray 7+)
- ✅ Responsive design with hover states (desktop)
- ✅ Lazy loading images with photo proxy API
- ✅ Filter persistence to localStorage
- ✅ Parallel API fetching (attractions + restaurants)
- ✅ Connected to MapStateContext for state management
- ✅ Accessibility: ARIA labels, semantic HTML, keyboard-friendly

**Integration:**
- Integrated with `/src/components/map-v2/modes/DiscoverMode.tsx`
- Connected to MapStateContext reducer
- Uses domain types (`Attraction`, `AttractionScore`)
- Ready for backend API endpoints

**Notes:**
- PhotoLightbox (full-screen view) deferred to Stage 9 (shared components)
- Virtualization for list view prepared but not yet implemented (Stage 11 - Performance)
- usePlaceScoring hook mentioned but scoring applied inline for now

---

## Stage 4: Plan Mode Panel (Desktop) ✅

**Goal:** Build the itinerary organization panel with drag-drop, collapsible hubs, and nested planned items.

### 4.1 Plan Panel Structure ✅

**Files to create:**
- `/src/components/map-v2/plan/PlanPanel.tsx` - Main panel container
- `/src/components/map-v2/plan/ItineraryStats.tsx` - Header with stats
- `/src/components/map-v2/plan/ViewToggle.tsx` - By Hub / By Category / Timeline

**Panel Layout:**
```
┌────────────────────────────────┐
│ Your Itinerary                 │
│ 3 hubs • 12 attractions        │
│ • 8 restaurants                │
├────────────────────────────────┤
│ View: [Hubs][Category][Timeline]│ (Timeline = future)
├────────────────────────────────┤
│                                │
│  [Scrollable hub cards area]   │
│                                │
│  [Hub 1 - Expanded]            │
│  [Hub 2 - Collapsed]           │
│  [Hub 3 - Collapsed]           │
│                                │
└────────────────────────────────┘
```

**Header Stats:**
- Count hubs, attractions, restaurants
- Optional: Total estimated time, distance
- Format: "3 hubs • 12 attractions • 8 restaurants"

**View Toggle:**
- **By Hubs** (default): Organize by location/hub
- **By Category** (future): Group all attractions together, all restaurants together
- **Timeline** (future): Day-by-day or chronological view

**Empty State:**
- Show when no places in plan
- Message: "Your itinerary is empty"
- CTA: "Select a place and switch to Discover to add attractions"
- Visual: Simple illustration or icon

**Tasks:**
- Create PlanPanel container
- Build stats header with dynamic counts
- Add view toggle (implement "By Hubs" first)
- Design compelling empty state
- Add CTA to switch to Discover mode
- Wire everything to context state

---

### 4.2 Hub Card List with Drag-Drop ✅

**Files to create:**
- `/src/components/map-v2/plan/HubCardList.tsx` - Sortable list
- `/src/components/map-v2/plan/HubCard.tsx` - Individual hub card
- `/src/components/map-v2/plan/DragHandle.tsx` - Drag indicator

**Hub Card Design:**
```
┌────────────────────────────────────┐
│ [≡] Banner Photo (Hub)             │ ← Drag handle + photo
│     1                              │ ← Number badge
├────────────────────────────────────┤
│ Paris, France                      │ ← Hub name (bold, large)
│ 5 attractions • 3 restaurants      │ ← Count
│                                    │
│ ▼ Attractions (5)                  │ ← Collapsible section
│   [Planned item 1]                 │
│   [Planned item 2]                 │
│   ...                              │
│                                    │
│ ▶ Restaurants (3)                  │ ← Collapsed section
│                                    │
│ [+ Discover more]                  │ ← Quick link to Discover
└────────────────────────────────────┘
```

**Drag Handle:**
- Position: Left side of card
- Visual: Three horizontal lines (≡) or grip icon
- Width: 44px (touch-friendly)
- Color: Muted gray, darker on hover
- Cursor: grab / grabbing

**Banner Photo:**
- 16:3 aspect ratio (wide banner)
- Source: First attraction's photo or Google Static Maps of area
- Fallback: Solid color with city icon

**Number Badge:**
- Shows hub order (1, 2, 3...)
- Position: Top-right of banner
- Circular, accent color
- Size: 32x32px

**Collapsible Sections:**
- Two sections: Attractions and Restaurants
- Chevron icon: ▼ (expanded) / ▶ (collapsed)
- Default state: First hub expanded, others collapsed
- Click header to toggle
- Smooth height animation (200ms)

**"Discover More" Button:**
- Position: Bottom of card
- Action: Select this hub + switch to Discover mode
- Style: Ghost/outline button
- Icon: Search or compass

**Drag-Drop with @dnd-kit:**
- Vertical sorting of hubs
- Show drop indicator (horizontal line between cards)
- Lift effect: Shadow + slight scale increase
- Smooth animations during drag
- Auto-scroll when dragging near edges

**Tasks:**
- Create HubCard component with banner photo
- Implement prominent drag handle (left-aligned)
- Add number badge showing order
- Build collapsible sections (Attractions/Restaurants)
- Implement @dnd-kit for hub reordering
- Add drop indicator styling
- Show smooth drag animations
- Implement "Discover more" action (select hub + switch mode)
- Auto-expand hub when items added
- Persist expanded/collapsed state per hub

---

### 4.3 Nested Planned Items ✅

**Files to create:**
- `/src/components/map-v2/plan/PlannedItemList.tsx` - List within hub
- `/src/components/map-v2/plan/PlannedItem.tsx` - Individual planned place

**Planned Item Design (within hub card):**
```
┌────────────────────────────────────┐
│ [Photo    ] Restaurant Name    [×] │ ← Thumbnail + name + remove
│ [80x60px  ] Italian • $$           │ ← Category + price
│             ★★★★☆ (234)            │ ← Rating
│             Score: 8.7             │ ← Score
└────────────────────────────────────┘
```

**Layout:**
- Left: Medium photo (80x60px, 4:3 aspect ratio)
- Middle: Place details (name, category, price, rating, score)
- Right: Remove button (× icon, 40x40px)

**Category Icon Badge:**
- Small icon overlay on photo (bottom-left)
- 🏛️ for attractions
- 🍽️ for restaurants
- Helps quick visual identification

**Reordering Within Category:**
- Drag-drop within Attractions or Restaurants section
- Cannot drag across categories
- Use same @dnd-kit setup as hub cards
- Smaller drag handle or drag by item itself

**Interactions:**
- Click item → Pan map to location + open details dialog
- Hover → Highlight corresponding map marker
- Remove (×) → Confirm dialog (optional) → Remove from plan

**Count Badges:**
- Show count in category header: "Attractions (5)"
- Update dynamically when items added/removed

**Tasks:**
- Create PlannedItem component with medium photo
- Add category icon badge on photo
- Implement remove button with confirmation (optional)
- Enable drag-to-reorder within category
- Add click handler to pan map and show details
- Sync hover state with map markers
- Show item counts in category headers
- Ensure smooth animations

---

### 4.4 Auto-Save Integration

**Files to create:**
- `/src/components/map-v2/hooks/useAutoSave.ts` - Debounced save hook
- `/src/components/map-v2/plan/SaveStatusIndicator.tsx` - Status display

**Auto-Save Behavior:**
- Trigger on any change: add, remove, reorder (hubs or items)
- Debounce: 750ms (wait for user to finish action)
- Save to Supabase (reuse existing API endpoints)
- Optimistic UI: Update immediately, sync in background

**Save Status States:**
- **Idle:** No indicator (or "All changes saved")
- **Saving...:** Small spinner + text
- **Saved ✓:** Green checkmark + text (fade out after 2s)
- **Error ⚠:** Red warning + "Retry" button

**Status Indicator:**
- Position: Header (next to search bar) or bottom of sidebar
- Make it prominent (not buried)
- Small pill/badge design
- Show timestamp on hover: "Last saved: 2 minutes ago"

**Offline Handling:**
- Detect offline state (navigator.onLine)
- Queue changes locally
- Show "Offline - changes will sync when online"
- Auto-sync when connection restored

**Conflict Resolution:**
- If server data newer, prompt user: "Changes detected. Reload or keep local?"
- Prefer local changes (optimistic)

**Tasks:**
- Create useAutoSave hook with 750ms debounce
- Implement save to Supabase via existing API
- Add optimistic UI updates
- Build save status indicator component
- Show status in header (prominent position)
- Handle offline mode gracefully
- Queue changes and sync on reconnect
- Add last saved timestamp
- Implement error handling with retry button

---

### Stage 4 Completion Summary ✅

**Implementation Date:** 2025-01-15

**Files Created (8):**
1. `/src/components/map-v2/plan/PlanPanel.tsx` - Main panel with empty state and dynamic content
2. `/src/components/map-v2/plan/ItineraryStats.tsx` - Header showing hub/attraction/restaurant counts
3. `/src/components/map-v2/plan/ViewToggle.tsx` - View mode switcher (By Hubs/Category/Timeline)
4. `/src/components/map-v2/plan/HubCardList.tsx` - Sortable list with @dnd-kit integration
5. `/src/components/map-v2/plan/HubCard.tsx` - Hub card with drag handle and collapsible sections
6. `/src/components/map-v2/plan/PlannedItemList.tsx` - List of planned items within hub
7. `/src/components/map-v2/plan/PlannedItem.tsx` - Individual item with photo and remove button
8. `/src/components/map-v2/plan/index.ts` - Barrel exports

**Key Features Implemented:**
- ✅ Empty state with "Go to Discover" CTA when itinerary is empty
- ✅ Stats header with dynamic counts (hubs, attractions, restaurants)
- ✅ View toggle with "By Hubs" active (Category/Timeline marked as coming soon)
- ✅ Hub cards with banner photos and number badges showing order
- ✅ Drag-drop reordering of hubs using @dnd-kit (PointerSensor + KeyboardSensor)
- ✅ Prominent drag handle (left-aligned grip icon) with visual feedback
- ✅ Collapsible sections for Attractions and Restaurants
- ✅ "Discover more" button that switches to Discover mode
- ✅ Planned items with medium photos (80x60px), category badges, ratings, and scores
- ✅ Remove button on planned items (appears on hover)
- ✅ Smooth drag animations with lift effect (shadow + scale)

**Integration:**
- Updated `/src/components/map-v2/modes/PlanMode.tsx` to use PlanPanel
- Connected to MapStateContext for state management
- Wired REORDER_PLACES action to context reducer
- Integrated with existing sidebar navigation system

**Notes:**
- Auto-save functionality (4.4) deferred - will be implemented when connecting to backend API
- Drag-drop within categories (reordering items) prepared but not fully implemented
- Hub banner photos use gradient placeholder (will use real photos when data available)
- Planned items structure ready for real attraction/restaurant data

---

## Stage 5: AI Suggestions Panel (Desktop) ✅

**Goal:** Build the conversational AI interface for personalized recommendations with inline suggestion cards.

### 5.1 AI Chat Panel Structure

**Files to create:**
- `/src/components/map-v2/sidebar/ai/AIChatPanel.tsx` - Main panel
- `/src/components/map-v2/sidebar/ai/ChatHeader.tsx` - Context indicator
- `/src/components/map-v2/sidebar/ai/ChatMessages.tsx` - Message history
- `/src/components/map-v2/sidebar/ai/ChatInput.tsx` - Input field

**Panel Layout:**
```
┌────────────────────────────────┐
│ Getting suggestions for:       │ ← Context header (sticky)
│ 📍 Paris, France              │
├────────────────────────────────┤
│                                │
│  [Message history - scroll]    │
│                                │
│  User: "Romantic restaurants"  │
│                                │
│  AI: "Here are 5 romantic..."  │
│  [Suggestion Card 1]           │
│  [Suggestion Card 2]           │
│  ...                           │
│                                │
│  [Thinking ▼] (collapsible)    │
│                                │
├────────────────────────────────┤
│ [Input field + Send button]    │ ← Sticky bottom
│ Suggested: [Chips...]          │
└────────────────────────────────┘
```

**Context Header:**
- Always shows which place AI is helping with
- Format: "Getting suggestions for: [Place Name]"
- If no place selected: "Select a place to get AI suggestions"
- Icon: 📍 or map pin icon
- Sticky at top of scroll area

**Message Area:**
- Scrollable chat history
- Auto-scroll to bottom on new message
- User messages: Right-aligned, colored bubble
- AI messages: Left-aligned, neutral bubble
- Timestamps (optional): Shown on hover or for old messages

**Input Area:**
- Sticky at bottom
- Text input field with placeholder: "Ask anything about [Place]..."
- Send button (icon: paper plane or arrow)
- Character limit: ~500 chars
- Enter to send, Shift+Enter for new line

**Tasks:**
- Create AIChatPanel container with sticky header and footer
- Build context indicator showing selected place
- Implement scrollable message area with auto-scroll
- Design user and assistant message bubbles
- Add input field with send button
- Handle Enter key (send) and Shift+Enter (newline)
- Show empty state with suggested prompts (from Stage 2.5)
- Ensure smooth animations when messages appear

---

### 5.2 Inline Suggestion Cards

**Files to create:**
- `/src/components/map-v2/sidebar/ai/SuggestionCard.tsx` - Card in chat
- `/src/components/map-v2/sidebar/ai/PriorityBadge.tsx` - Badge component

**Suggestion Card Design (within AI message):**
```
┌────────────────────────────────┐
│ [Photo 16:9]                   │ ← Place photo
│ [Must-See]                     │ ← Priority badge
├────────────────────────────────┤
│ Eiffel Tower                   │ ← Name (bold)
│ Landmark • Score: 9.2          │ ← Category + score
│                                │
│ "An iconic symbol of Paris..." │ ← AI reasoning (excerpt)
│ [Read more ▼]                  │ ← Expand full reasoning
│                                │
│ [+] Add to Plan                │ ← Action button
└────────────────────────────────┘
```

**Priority Badges:**
- **Must-See:** Red/gold badge, high emphasis
- **Highly Recommended:** Blue badge, medium emphasis
- **Hidden Gem:** Green badge, discovery emphasis
- Position: Top-right of photo
- Size: ~80x24px
- Font: Bold, small caps

**AI Reasoning:**
- Show excerpt (2-3 lines) by default
- "Read more" to expand full reasoning
- Reasoning explains WHY AI recommended this place
- Connects to user's query and preferences

**Photo Loading:**
- Lazy load photos as message appears
- Blur-up placeholder
- Fetch from Google Places API

**States:**
- **Default:** Normal card with Add button
- **Added:** Button changes to "Added ✓", disabled
- **Already in plan:** Show "In your plan ✓" instead of button

**Tasks:**
- Create SuggestionCard component with 16:9 photo
- Design priority badges (3 types: Must-See, Recommended, Hidden Gem)
- Add AI reasoning with expand/collapse
- Implement Add to Plan action (optimistic update)
- Show "Added ✓" state immediately
- Handle places already in plan
- Lazy load photos
- Ensure cards render nicely in chat flow

---

### 5.3 AI Conversation Integration

**Files to create:**
- `/src/components/map-v2/hooks/useAIChat.ts` - Conversation management
- `/src/components/map-v2/sidebar/ai/ThinkingProcess.tsx` - Collapsible thinking
- `/src/components/map-v2/sidebar/ai/TypingIndicator.tsx` - Loading state

**API Integration:**
Reuse existing endpoint:
- `/api/attractions/suggest` (from v1)
- POST with: selectedPlace, conversation history, user message
- Response: AI message + suggestions array + thinking steps

**Conversation Flow:**
1. User types message + clicks Send
2. Show typing indicator ("AI is thinking...")
3. Stream or load AI response
4. Parse suggestions from response
5. Render message + inline suggestion cards
6. Show collapsible thinking process (optional)

**Thinking Process:**
- Collapsible section below AI message
- Header: "How I chose these ▼"
- Content: Step-by-step reasoning from AI
- Default state: Collapsed (user can expand)
- Helps build trust in AI recommendations

**Multi-Turn Conversation:**
- User can refine: "Show me cheaper options"
- AI maintains context from previous messages
- Send full conversation history to API
- Limit history to last 10 messages (performance)

**Suggested Prompts:**
- Show below input field when empty
- Clickable chips that fill input
- Context-aware examples:
  - "Must-see highlights"
  - "Romantic restaurants"
  - "Family-friendly activities"
  - "Hidden gems locals love"
- Update based on conversation state

**Error Handling:**
- Network error: Show retry button
- API error: Friendly message ("AI is unavailable. Try again.")
- Timeout: "Taking longer than usual. Retry?"

**Tasks:**
- Create useAIChat hook for message management
- Integrate with /api/attractions/suggest endpoint
- Implement typing indicator while AI responds
- Parse and render suggestion cards inline
- Add collapsible thinking process (optional)
- Support multi-turn conversation (send history)
- Show suggested prompts below input
- Handle errors gracefully with retry
- Persist conversation to localStorage
- Clear conversation when switching places

---

### Stage 5 Completion Summary ✅

**Implementation Date:** 2025-01-15

**Files Created (10):**
1. `/src/components/map-v2/sidebar/ai/AIChatPanel.tsx` - Main panel container with sticky header and footer
2. `/src/components/map-v2/sidebar/ai/ChatHeader.tsx` - Context indicator showing selected place
3. `/src/components/map-v2/sidebar/ai/ChatMessages.tsx` - Scrollable message history with auto-scroll
4. `/src/components/map-v2/sidebar/ai/ChatInput.tsx` - Input field with send button and suggested prompts
5. `/src/components/map-v2/sidebar/ai/SuggestionCard.tsx` - Inline suggestion card with photo, priority badge, and reasoning
6. `/src/components/map-v2/sidebar/ai/PriorityBadge.tsx` - Priority badge component (Must-See, Recommended, Hidden Gem)
7. `/src/components/map-v2/sidebar/ai/ThinkingProcess.tsx` - Collapsible thinking process section
8. `/src/components/map-v2/sidebar/ai/TypingIndicator.tsx` - Loading state with animated dots
9. `/src/components/map-v2/sidebar/ai/index.ts` - Barrel exports
10. `/src/components/map-v2/hooks/useAIChat.ts` - Conversation management hook

**Key Features Implemented:**
- ✅ Complete AI chat panel structure with sticky header and footer
- ✅ Context indicator showing which place AI is helping with
- ✅ Scrollable message area with auto-scroll to bottom
- ✅ User and assistant message bubbles (right/left aligned)
- ✅ Input field with Enter/Shift+Enter handling and character limit (500 chars)
- ✅ Suggested prompts shown as clickable chips when input is empty
- ✅ Inline suggestion cards with 16:9 photos and priority badges
- ✅ Three priority badge types with gradient styling (Must-See, Recommended, Hidden Gem)
- ✅ Expandable AI reasoning with "Read more" functionality
- ✅ "Add to Plan" button with optimistic UI updates
- ✅ "Added ✓" state for places already in plan
- ✅ Typing indicator while AI is processing
- ✅ Collapsible thinking process section
- ✅ Integration with `/api/attractions/suggest` endpoint
- ✅ Multi-turn conversation support (sends last 10 messages for context)
- ✅ Error handling with user-friendly messages
- ✅ Conversation clearing when switching places

**Integration:**
- Updated `/src/components/map-v2/modes/AIMode.tsx` to use AIChatPanel
- Connected to MapStateContext for state management
- Integrated with existing sidebar navigation system
- Uses domain types (`AIMessage`, `AISuggestion`) from types/index.ts

**Notes:**
- Conversation persistence to localStorage mentioned but not yet implemented (will be added when needed)
- Photo lazy loading implemented with blur-up placeholder technique
- API integration ready for backend endpoint
- Error handling includes retry capability (UI ready, backend integration pending)

---

## Stage 6: Mobile Layout Foundation ✅

**Goal:** Build the mobile-optimized layout with bottom navigation, fullscreen map, and bottom sheets.

### 6.1 Mobile Bottom Navigation

**Files to create:**
- `/src/components/map-v2/mobile/MobileLayout.tsx` - Main mobile container
- `/src/components/map-v2/mobile/MobileBottomNav.tsx` - Navigation bar

**Mobile Layout Structure:**
```
┌─────────────────────────┐
│ Header (48px)           │ ← Compact header
│ Search icon | Back      │
├─────────────────────────┤
│                         │
│   FULLSCREEN MAP        │ ← Main content area
│   or Plan View          │   (switches based on tab)
│                         │
│                         │
├─────────────────────────┤
│ [Map] [Plan]            │ ← Bottom nav (60px)
│  Icon    Icon           │   with safe-area-inset
└─────────────────────────┘
```

**Bottom Navigation Design:**
- Two tabs only: Map | Plan
- Height: 60px + safe-area-inset-bottom (iOS)
- Each tab:
  - Icon (24px)
  - Label below icon
  - Badge count (for Plan: show total items)
- Active state: Icon and text in accent color, bold
- Inactive state: Muted gray

**Tab Icons:**
- **Map:** Map/location icon
- **Plan:** List or itinerary icon

**Safe Area Handling:**
- Use env(safe-area-inset-bottom) for iOS notch
- Padding-bottom: calc(16px + env(safe-area-inset-bottom))
- Background extends into safe area

**Tab Switching:**
- Tap tab → switch view with fade transition (150ms)
- Persist active tab to sessionStorage
- Deep linking: ?tab=plan

**Tasks:**
- Create MobileLayout container component
- Build bottom navigation with 2 tabs
- Add tab icons and labels
- Implement active/inactive states
- Show badge count on Plan tab
- Handle safe-area-inset for iOS
- Add tab switching with smooth transition
- Persist active tab to sessionStorage
- Support URL parameter for deep linking

---

### 6.2 Mobile Map View

**Files to create:**
- `/src/components/map-v2/mobile/MapView.tsx` - Fullscreen map container
- `/src/components/map-v2/mobile/FloatingAIButton.tsx` - AI chat FAB
- `/src/components/map-v2/mobile/SearchOverlay.tsx` - Full-screen search
- `/src/components/map-v2/mobile/MobileHeader.tsx` - Compact header

**Mobile Map View Layout:**
```
┌─────────────────────────────┐
│ [☰] Search         [Back]   │ ← Compact header (48px)
├─────────────────────────────┤
│                             │
│     FULLSCREEN MAP          │
│     (100vh - header - nav)  │
│                             │
│  [Filter]           [AI✨]  │ ← Floating buttons
│                             │
└─────────────────────────────┘
```

**Header:**
- Left: Menu icon (future: open filter drawer)
- Center: Search icon → opens full-screen search overlay
- Right: "Back to Planning" link (if from conversationId)
- Height: 48px (compact for mobile)
- Fixed position, z-index above map

**Floating Buttons:**
- **Filter button** (bottom-left):
  - Icon: Funnel or sliders
  - Opens filter sheet (attractions/restaurants/all)
  - Shows active filter count badge
  - Position: 16px from left, 80px from bottom (above nav)

- **AI button** (bottom-right):
  - Icon: Sparkle or magic wand (✨)
  - Primary/accent color, stands out
  - Size: 56x56px (Material Design FAB size)
  - Subtle pulse animation to draw attention
  - Position: 16px from right, 80px from bottom
  - Action: Opens full-screen AI chat modal

**Map Interactions (Progressive Disclosure for Mobile):**

Mobile uses a simplified progressive disclosure approach:
- **No hover state** (touch devices don't have hover)
- **Tap marker** → Show ExpandedPlaceCard (skip mini card entirely)
- **Card positioning:** Bottom of screen (easier thumb access)
- **Larger touch targets:** All interactive elements 48px minimum height
- **Card dismissal:**
  - Swipe down on card
  - Tap outside card
  - Tap close button (×)
  - Tap another marker (switches card)

**ExpandedPlaceCard on Mobile:**
- Same design as desktop but positioned at bottom
- Fixed position at bottom of screen (not floating near marker)
- Full width with 16px side margins
- Buttons: 48px height for touch-friendly interaction
- Swipe down gesture to dismiss
- Bottom sheet opens only when "Details" button tapped
- Uses same component as desktop with platform-specific positioning

**Standard Map Touch Gestures:**
- Larger markers (24px vs 20px desktop) for better touch targets
- Touch-optimized: pinch to zoom, pan with finger
- Double-tap to zoom in
- Two-finger tap to zoom out

**Tasks:**
- Create MapView component with fullscreen map
- Build compact mobile header with search icon
- Add floating filter button (bottom-left)
- Create prominent AI FAB (bottom-right, with pulse)
- Adapt ExpandedPlaceCard for mobile (skip mini card)
- Position expanded card at bottom on mobile
- Implement swipe-to-dismiss gesture for card
- Ensure 48px minimum button heights
- Implement touch-optimized map interactions
- Increase marker sizes for mobile (24px)
- Ensure smooth performance on mobile devices
- Handle safe-area-inset for notched devices
- Test card interactions on actual mobile devices

---

### 6.3 Place Bottom Sheet

**Files to create:**
- `/src/components/map-v2/mobile/PlaceBottomSheet.tsx` - Sheet container (using vaul)
- `/src/components/map-v2/mobile/PlaceQuickView.tsx` - Preview at 30% height
- `/src/components/map-v2/mobile/PlaceFullView.tsx` - Full details at 85%

**Two-Stage Bottom Sheet:**

**Stage 1: Quick Preview (30% viewport height)**
```
┌──────────────────────────┐
│ [Drag handle]            │ ← Visual indicator to swipe
├──────────────────────────┤
│ Place Name               │
│                          │
│ [Hero Photo - 16:9]      │
│                          │
│ ★★★★☆ (123) • $$ • 2km  │
│ Italian Restaurant       │
│                          │
│ [Add] [Details] [More▼]  │ ← Three action buttons
└──────────────────────────┘
```

**Stage 2: Full Details (85% viewport height, swipe up)**
```
┌──────────────────────────┐
│ [Drag handle]            │
├──────────────────────────┤
│ [Photo Carousel]         │
│ ◀ 1 of 5 ▶              │
├──────────────────────────┤
│ Place Name               │
│ Category • Rating • $$$  │
│                          │
│ Description text...      │
│                          │
│ 📍 1.2km away           │
│ ⏰ Open until 10 PM     │
│ 📞 +33 1 23...          │
│                          │
│ ━━━━━━━━━━━━━━━━━━━     │
│                          │
│ Nearby Attractions (8)   │
│ [Preview list...]        │
│                          │
└──────────────────────────┘
│ [Add to Plan] (sticky)   │ ← Fixed at bottom
```

**Behavior:**
- Tap marker → sheet slides up to 30%
- Swipe up or tap "Details" → sheet expands to 85%
- Swipe down → collapse to 30% or close entirely
- Tap outside sheet → close (if at 30% only)
- Prevent map interaction when sheet is open

**Quick View Content:**
- Place name (bold, large)
- Single hero photo
- Rating, price, distance
- Category/type
- Three buttons: Add to Plan | View Details | Discover More

**Full View Content:**
- Photo carousel (swipe between photos)
- Full place details (description, hours, phone)
- Distance and directions
- Nearby attractions preview (quick links)
- Reviews snippet (optional)
- Sticky "Add to Plan" button at bottom

**Tasks:**
- Implement bottom sheet with vaul library
- Create two snap points: 30% and 85% height
- Build quick preview component (minimal info)
- Build full view component (complete details)
- Add photo carousel for full view
- Implement swipe gestures (up/down)
- Show drag handle for discoverability
- Add sticky "Add to Plan" button in full view
- Prevent map interaction when sheet open
- Handle safe-area-inset at bottom

---

### Expected Outcomes for Stage 6

After completing this stage, you should have:

- **Mobile bottom navigation** with 2 tabs (Map/Plan)
- **Fullscreen map view** optimized for touch
- **Floating AI button** with pulse animation
- **Filter button** for quick category switching
- **Bottom sheet** with two-stage reveal (30%/85%)
- **Touch-optimized interactions** throughout
- **Safe-area handling** for iOS notch devices

**Next Stage Preview:** Stage 7 will implement the mobile Plan view with touch-friendly hub cards and swipe-to-delete gestures.

---

### Stage 6 Completion Summary ✅

**Implementation Date:** 2025-01-15

**Files Created (11):**
1. `/src/components/map-v2/mobile/MobileLayout.tsx` - Main mobile container with tab switching
2. `/src/components/map-v2/mobile/MobileBottomNav.tsx` - Two-tab navigation (Map/Plan)
3. `/src/components/map-v2/mobile/MobileHeader.tsx` - Compact header with search icon
4. `/src/components/map-v2/mobile/MapView.tsx` - Fullscreen map container
5. `/src/components/map-v2/mobile/PlanView.tsx` - Full-screen plan view wrapper
6. `/src/components/map-v2/mobile/FloatingAIButton.tsx` - AI FAB with pulse animation
7. `/src/components/map-v2/mobile/FilterButton.tsx` - Filter button with badge
8. `/src/components/map-v2/mobile/SearchOverlay.tsx` - Full-screen search (placeholder)
9. `/src/components/map-v2/mobile/PlaceBottomSheet.tsx` - Bottom sheet using vaul
10. `/src/components/map-v2/mobile/PlaceQuickView.tsx` - 30% height quick preview
11. `/src/components/map-v2/mobile/PlaceFullView.tsx` - 85% height full details with photo carousel

**Key Features Implemented:**
- ✅ Two-tab bottom navigation with Map and Plan tabs
- ✅ Safe-area handling for iOS notch devices (env(safe-area-inset-bottom))
- ✅ Active/inactive tab states with badge count on Plan tab
- ✅ Tab switching with fade transition (150ms)
- ✅ Persistence to sessionStorage
- ✅ Deep linking support via URL parameter (?tab=plan)
- ✅ Fullscreen map optimized for mobile
- ✅ Compact 48px header with search icon and optional back button
- ✅ Floating AI button (bottom-right) with pulse animation
- ✅ Filter button (bottom-left) with active filter badge
- ✅ Two-stage bottom sheet with 30% and 85% snap points
- ✅ Quick preview with hero photo, key info, and three action buttons
- ✅ Full view with photo carousel, complete details, and sticky "Add to Plan" button
- ✅ Swipe gestures (up/down) for expand/collapse
- ✅ Drag handle for discoverability
- ✅ Non-modal overlay (allows map interaction when closed)
- ✅ Touch-optimized button sizes (48px+ minimum)

**Integration:**
- Enhanced MapStateContext with convenience methods (addToPlanning, setSelectedPlace, getSelectedPlace)
- Connected to existing MapCanvas and markers
- Integrated PlaceBottomSheet with vaul library
- Created barrel export index.ts for mobile components
- All components properly wired to state management

**Notes:**
- SearchOverlay created as placeholder for future implementation
- PlanView wraps existing PlanPanel for mobile display
- FilterButton shows active filter count but full filter UI deferred
- PlaceBottomSheet replaces ExpandedPlaceCard on mobile
- Photo carousel in PlaceFullView with prev/next navigation
- No linting errors

---

## Stage 7: Mobile Plan View

**Goal:** Build the mobile itinerary view with touch-optimized interactions, swipe gestures, and long-press reordering.

### 7.1 Full-Screen Plan View

**Files to create:**
- `/src/components/map-v2/mobile/PlanView.tsx` - Main plan container
- `/src/components/map-v2/mobile/MobileItineraryStats.tsx` - Stats header
- `/src/components/map-v2/mobile/MobileHubCard.tsx` - Hub card for mobile

**Mobile Plan View Layout:**
```
┌────────────────────────────┐
│ Your Itinerary             │ ← Sticky header
│ 3 hubs • 15 places         │
│ [By Hubs ▼]                │ ← View selector
├────────────────────────────┤
│                            │
│  [Scrollable hub cards]    │
│                            │
│  [Hub Card 1 - Paris]      │
│    ▼ Attractions (5)       │
│    ...expanded items...    │
│                            │
│  [Hub Card 2 - Lyon]       │
│    ▶ Collapsed             │
│                            │
│  [Hub Card 3 - Nice]       │
│                            │
└────────────────────────────┘
```

**Important: NOT a drawer!**
- Full-screen dedicated view (not sliding drawer)
- Activated by tapping "Plan" tab in bottom nav
- Replaces map view entirely (cleaner than overlay)
- Full scrollable height
- Better performance than drawer

**Sticky Header:**
- Itinerary stats: "X hubs • Y places"
- View toggle dropdown (future: By Hub, By Day, By Category)
- Background color distinguishes from cards
- Subtle shadow when scrolled

**Scrollable Area:**
- Vertical list of hub cards
- Sufficient padding/spacing between cards
- Pull-to-refresh (optional, future)
- Smooth scroll physics

**Empty State:**
- Show when no hubs in plan
- Message: "Your itinerary is empty"
- Visual: Simple illustration
- CTA: "Switch to Map to add places"

**Tasks:**
- Create full-screen PlanView component
- Build sticky stats header
- Add view toggle dropdown (By Hubs default)
- Implement scrollable hub cards list
- Add empty state with clear CTA
- Ensure smooth scrolling performance
- Handle safe-area-inset at bottom

---

### 7.2 Mobile Hub Cards

**Files to create:**
- `/src/components/map-v2/mobile/MobileHubCard.tsx` - Touch-optimized hub card
- `/src/components/map-v2/mobile/MobileHubHeader.tsx` - Card header with photo
- `/src/components/map-v2/mobile/CollapsibleSection.tsx` - Expandable sections

**Mobile Hub Card Design:**
```
┌────────────────────────────────┐
│ [Banner Photo]            [1]  │ ← Photo + number badge
├────────────────────────────────┤
│ Paris, France                  │ ← Hub name (large, bold)
│ 5 attractions • 3 restaurants  │
│                                │
│ ▼ Attractions (5)              │ ← Tap to collapse
│                                │
│   [Item card 1]                │ ← Swipe left to delete
│   [Item card 2]                │
│   [Item card 3]                │
│   ...                          │
│                                │
│ ▶ Restaurants (3)              │ ← Collapsed
│                                │
│ [+ Discover more here]         │
└────────────────────────────────┘
```

**Differences from Desktop:**
- Larger touch targets (minimum 44x44px)
- More padding and spacing
- NO visible drag handle by default (use long-press instead)
- Larger text for readability
- Simplified layout (less dense)

**Banner Photo:**
- Aspect ratio: 16:4 or 16:3 (shorter than desktop)
- Full width of card
- Number badge in top-right corner
- Tap photo → pan map to hub location (switch to Map tab)

**Collapsible Sections:**
- Tap section header to toggle
- Smooth height animation (200-250ms)
- Chevron rotates: ▼ (open) / ▶ (closed)
- Default: First hub expanded, others collapsed
- Haptic feedback on toggle (if supported)

**Reordering Hubs:**
- Long-press hub card (800ms) → enter reorder mode
- All hubs show drag handles when in reorder mode
- Drag to reorder with visual feedback
- Tap "Done" or tap outside to exit reorder mode
- Haptic feedback when entering reorder mode

**Tasks:**
- Create MobileHubCard with larger touch areas
- Build banner photo header (16:3 or 16:4 aspect)
- Add number badge to banner
- Implement collapsible sections (Attractions/Restaurants)
- Add long-press detection (800ms threshold)
- Show drag handles only in reorder mode
- Implement drag-to-reorder with @dnd-kit touch sensors
- Add haptic feedback (navigator.vibrate) where supported
- Ensure smooth animations

---

### 7.3 Mobile Planned Items with Swipe-to-Delete

**Files to create:**
- `/src/components/map-v2/mobile/MobilePlannedItem.tsx` - Item card
- `/src/components/map-v2/mobile/SwipeToDeleteWrapper.tsx` - Swipe gesture handler

**Mobile Planned Item Design:**
```
┌────────────────────────────────┐
│ [Photo  ] Place Name           │ ← Tap to view on map
│ [100x75 ] Category • $$        │
│           ★★★★☆ (123)          │
└────────────────────────────────┘
  ← Swipe left reveals:
┌────────────────────────────────┐
│ [Photo...] Place Name    [🗑️] │ ← Delete button
└────────────────────────────────┘
```

**Swipe-to-Delete Pattern:**
- Swipe left on item → reveal red delete button
- Swipe right → cancel/close delete button
- Tap delete button → remove item (with optional confirmation)
- Tap item itself while delete showing → close delete button
- Native iOS/Android pattern (familiar to users)

**Layout:**
- Larger photo: 100x75px (vs 80x60 desktop)
- More vertical spacing between items
- Category icon badge on photo (🏛️/🍽️)
- All text slightly larger for mobile

**Interactions:**
- **Tap item:** Pan map to location + switch to Map tab
- **Swipe left:** Reveal delete button
- **Tap delete:** Remove from plan (optional: confirm dialog)
- **Long-press item:** Show context menu (future: move to different hub)

**Reordering Items Within Category:**
- Long-press item (800ms) → enter drag mode
- Drag vertically to reorder within category
- Cannot drag across categories (Attractions vs Restaurants)
- Visual feedback: item lifts with shadow
- Drop indicator line shows where it will land
- Haptic feedback on grab and drop

**Tasks:**
- Create MobilePlannedItem with larger photo (100x75px)
- Implement swipe-to-delete with react-use-gesture or framer-motion
- Add delete button reveal animation
- Handle tap while delete showing (close delete)
- Implement tap-to-view-on-map action
- Add long-press for item reordering
- Enable drag within category (vertical only)
- Add haptic feedback for interactions
- Ensure smooth 60fps animations

---

### 7.4 Mobile-Specific Interactions

**Long-Press Implementation:**

**Files to create:**
- `/src/components/map-v2/hooks/useLongPress.ts` - Long-press detection hook

**useLongPress Hook:**
- Threshold: 800ms (standard long-press duration)
- Prevents triggering on scroll/drag
- Clears on touch move (user is scrolling)
- Provides haptic feedback when triggered
- Cancels on touch end before threshold

**Reorder Mode UI:**
```
┌────────────────────────────────┐
│ Reorder Hubs            [Done] │ ← Mode indicator
├────────────────────────────────┤
│ [≡] Hub 1                      │ ← Drag handles visible
│ [≡] Hub 2                      │
│ [≡] Hub 3                      │
└────────────────────────────────┘
```

**When in Reorder Mode:**
- Show "Reorder Hubs" header with "Done" button
- All hub cards show drag handles (left side, 44px wide)
- Disable other interactions (collapse, tap photo, etc.)
- Exit mode: Tap "Done" or tap outside cards
- Auto-exit after 30s of inactivity

**Haptic Feedback Points:**
- Long-press detected (enter reorder mode): Medium vibration
- Item grabbed for drag: Light vibration
- Item dropped: Light vibration
- Delete button revealed: Very light vibration
- Section collapsed/expanded: Very light vibration

**Tasks:**
- Create useLongPress hook with 800ms threshold
- Implement reorder mode UI with header and "Done" button
- Show drag handles only in reorder mode
- Disable other interactions while reordering
- Add auto-exit after 30s inactivity
- Implement haptic feedback (navigator.vibrate)
- Test on iOS and Android devices

---

### Expected Outcomes for Stage 7

After completing this stage, you should have:

- **Full-screen mobile plan view** (not a drawer)
- **Touch-optimized hub cards** with larger targets
- **Swipe-to-delete** for planned items
- **Long-press reordering** for hubs and items
- **Haptic feedback** for interactions
- **Collapsible sections** with smooth animations
- **Native mobile patterns** (swipe, long-press)

**Next Stage Preview:** Stage 8 will add the mobile AI chat modal with floating action button and full-screen interface.

---

### Stage 7 Completion Summary ✅

**Implementation Date:** 2025-01-15

**Files Created (10):**
1. `/src/components/map-v2/mobile/PlanView.tsx` - Full-screen plan view with sticky header and scroll detection
2. `/src/components/map-v2/mobile/MobileItineraryStats.tsx` - Stats header showing hub and place counts
3. `/src/components/map-v2/mobile/MobileViewToggle.tsx` - View mode selector (By Hubs/Day/Category)
4. `/src/components/map-v2/mobile/MobileHubCard.tsx` - Touch-optimized hub card with 48px+ targets
5. `/src/components/map-v2/mobile/MobileHubCardList.tsx` - Hub list with reorder mode and drag-drop
6. `/src/components/map-v2/mobile/MobilePlannedItem.tsx` - Item card with swipe-to-delete gesture
7. `/src/components/map-v2/mobile/MobilePlannedItemList.tsx` - List wrapper for planned items
8. `/src/components/map-v2/hooks/useSwipeToDelete.ts` - Swipe-to-delete gesture hook
9. `/src/components/map-v2/hooks/useLongPress.ts` - Long-press detection hook (800ms threshold)
10. Updated barrel exports in `hooks/index.ts` and `mobile/index.ts`

**Key Features Implemented:**
- ✅ Full-screen plan view (NOT a drawer) - activated by Plan tab
- ✅ Sticky header with itinerary stats ("X hubs • Y places")
- ✅ View toggle dropdown (By Hubs active, Category/Timeline marked as future)
- ✅ Scrollable hub cards list with padding and spacing
- ✅ Empty state with "Switch to Map" CTA when no places
- ✅ Scroll shadow on sticky header when scrolled
- ✅ Safe-area handling for iOS notch devices
- ✅ Mobile hub cards with larger touch targets (min 44-48px)
- ✅ Banner photo header (16:3 aspect ratio) with tap to pan map
- ✅ Number badge on banner showing hub order
- ✅ Collapsible sections for Attractions and Restaurants
- ✅ Smooth height animations (200ms) with chevron rotation
- ✅ First hub expanded by default, others collapsed
- ✅ Drag handles only visible in reorder mode
- ✅ Touch-optimized drag-drop using @dnd-kit TouchSensor
- ✅ Long-press detection (800ms threshold) to enter reorder mode
- ✅ Reorder mode UI with "Done" button and sticky header
- ✅ Auto-exit reorder mode after 30s inactivity
- ✅ Native swipe-to-delete pattern for planned items
- ✅ Larger photos on items (100x75px vs 80x60 desktop)
- ✅ Category icon badges on photos (🏛️/🍽️)
- ✅ Haptic feedback at key interaction points:
  - Medium vibration (50ms) when entering reorder mode
  - Light vibration (10ms) on item drop
  - Very light vibration (10ms) when delete revealed
- ✅ Scroll detection cancels long-press (prevents accidental triggers)
- ✅ All text larger for mobile readability
- ✅ More spacing and padding throughout

**Integration:**
- Connected to MapStateContext for state management
- Uses REORDER_PLACES action from context reducer
- Touch sensors configured for mobile drag-and-drop
- All components properly wired to state management
- Barrel exports updated for clean imports

**Notes:**
- Reorder mode enters via long-press on hub card (800ms threshold)
- Swipe-to-delete uses native iOS/Android pattern (swipe left reveals delete button)
- useLongPress hook detects scroll movement to prevent false triggers
- useSwipeToDelete hook provides haptic feedback when delete revealed
- All animations target 60fps performance
- No linting errors

---

## Stage 8: Mobile AI Chat Integration

**Goal:** Implement the mobile AI chat experience with floating action button, full-screen modal, and touch-optimized conversation interface.

### 8.1 Floating AI Button (FAB)

**Files to create:**
- `/src/components/map-v2/mobile/FloatingAIButton.tsx` - FAB component

**Button Design:**
- Size: 56x56px (Material Design standard FAB)
- Shape: Circle
- Icon: Sparkle/magic wand (✨) or AI icon
- Color: Accent/primary brand color (stands out)
- Shadow: Elevated (8dp elevation)
- Position: Bottom-right, 16px margins
  - Right: 16px
  - Bottom: 80px (60px nav + 20px spacing)

**Visual Effects:**
- **Entrance animation:** Scale up from 0 when map loads (200ms)
- **Pulse animation:** Subtle pulse every 3-5 seconds to draw attention
  - Scale 1.0 → 1.05 → 1.0
  - Duration: 600ms
  - Ease: ease-in-out
- **Hover/Press:** Scale down slightly (0.95) with shadow increase
- **Badge:** Optional dot indicator when new suggestions available

**States:**
- **Default:** Visible, pulsing
- **Pressed:** Scaled down, shadow increased
- **Hidden:** When bottom sheet is fully expanded (85%)
- **Loading:** Spinner inside button when AI is processing

**Accessibility:**
- ARIA label: "Get AI suggestions"
- Min touch target: 44x44px (FAB is 56x56, so ✓)
- Focus visible on keyboard navigation

**Tasks:**
- Create FloatingAIButton component
- Add entrance animation on mount
- Implement subtle pulse animation (every 3-5s)
- Position with safe-area-inset awareness
- Hide when bottom sheet is expanded (prevent overlap)
- Add press animation (scale down)
- Implement accessibility labels
- Add optional badge indicator
- Test on various screen sizes

---

### 8.2 Full-Screen AI Modal

**Files to create:**
- `/src/components/map-v2/mobile/AIChatModal.tsx` - Modal container
- `/src/components/map-v2/mobile/MobileChatHeader.tsx` - Modal header
- `/src/components/map-v2/mobile/MobileChatInput.tsx` - Input with keyboard handling

**Modal Layout:**
```
┌────────────────────────────┐
│ [×] AI Assistant    [Done] │ ← Fixed header (48px)
├────────────────────────────┤
│ Planning for: Paris        │ ← Context indicator
├────────────────────────────┤
│                            │
│  [Message history]         │ ← Scrollable area
│                            │
│  User: "Romantic places"   │
│  AI: "Here are 5..."       │
│  [Suggestion Card]         │
│  [Suggestion Card]         │
│                            │
│                            │
├────────────────────────────┤
│ [Input field]       [Send] │ ← Fixed footer
│ [Suggested prompt chips]   │   (above keyboard)
└────────────────────────────┘
```

**Modal Behavior:**
- **Open:** Slide up from bottom (300ms ease-out)
- **Close:** Slide down to bottom (250ms ease-in)
- **Trigger:** Tap floating AI button
- **Dismiss:** Tap "×" button, tap "Done", or swipe down
- **Full-screen:** Takes 100vh (minus status bar)
- **Overlay:** Semi-transparent dark background (0.4 opacity)

**Header:**
- Left: Close button (×)
- Center: "AI Assistant" title
- Right: "Done" button (alternative close)
- Fixed at top (doesn't scroll)
- Background color distinguishes from content

**Context Indicator:**
- Shows which hub/place AI is helping with
- Format: "Planning for: [Place Name]"
- Icon: 📍 or map pin
- If no place selected: "Select a place to get suggestions"
- Sticky below header

**Message Area:**
- Scrollable chat history
- Auto-scroll to bottom when new message arrives
- Pull-to-refresh to reload conversation (optional)
- Messages use mobile-optimized bubbles:
  - User: Right-aligned, accent color
  - AI: Left-aligned, neutral gray
  - Max width: 85% of screen
  - Padding: 12-16px
  - Border radius: 16-20px (more rounded than desktop)

**Input Area:**
- Fixed at bottom (above keyboard)
- Text input: Auto-expanding (1-4 lines)
- Send button: Disabled when empty
- Suggested prompts: Horizontal scrolling chips below input
- Keyboard handling:
  - Input focuses automatically on modal open
  - Modal content adjusts when keyboard shows
  - Scroll to bottom when keyboard appears

**Tasks:**
- Create full-screen modal with slide-up animation
- Build header with close and done buttons
- Add context indicator (sticky below header)
- Implement scrollable message area
- Design mobile-optimized message bubbles (larger, rounder)
- Create auto-expanding input field (1-4 lines)
- Add keyboard show/hide handling
- Adjust content height when keyboard appears
- Show suggested prompts as horizontal chips
- Implement swipe-down to dismiss (optional)
- Handle safe-area-inset for notched devices

---

### 8.3 Mobile Suggestion Cards

**Files to create:**
- `/src/components/map-v2/mobile/MobileSuggestionCard.tsx` - Optimized for mobile

**Mobile Suggestion Card Design:**
```
┌────────────────────────────────┐
│ [Photo 16:9 - larger]          │
│ [Must-See]                     │ ← Priority badge
├────────────────────────────────┤
│ Eiffel Tower                   │ ← Name (larger text)
│ Landmark • 9.2                 │
│                                │
│ "An iconic symbol of Paris..." │ ← AI reasoning
│ [Read more ▼]                  │
│                                │
│ [Add to Plan]                  │ ← Large button (44px)
└────────────────────────────────┘
```

**Mobile Optimizations:**
- **Larger photos:** Full width, more vertical space
- **Bigger text:** 16-18px for name (vs 14-16 desktop)
- **Touch-friendly buttons:** 44px minimum height
- **More spacing:** Increased padding throughout
- **Simplified info:** Less metadata, focus on essentials

**Priority Badges:**
- Slightly larger: 90x28px (vs 80x24 desktop)
- More prominent positioning
- Higher contrast for outdoor mobile use

**Reasoning Section:**
- Collapsible by default (start collapsed on mobile)
- "Read more" expands inline
- Limit excerpt to 2 lines on mobile (vs 3 desktop)

**Add to Plan Button:**
- Full width
- Height: 44px (touch-friendly)
- Bold, clear label
- Haptic feedback on tap
- Immediate state change to "Added ✓"

**Tasks:**
- Create MobileSuggestionCard component
- Increase photo size (more vertical height)
- Enlarge text for mobile readability
- Make buttons 44px height minimum
- Increase padding and spacing
- Start reasoning collapsed by default
- Add haptic feedback on button tap
- Optimize for one-handed mobile use

---

### 8.4 Mobile Keyboard & Input Handling

**Keyboard Behavior:**

**Files to create:**
- `/src/components/map-v2/hooks/useKeyboardHeight.ts` - Detect keyboard height

**Challenges on Mobile:**
- Virtual keyboard takes 30-50% of screen height
- Input can be hidden behind keyboard
- Content needs to shift up when keyboard appears
- Different behavior on iOS vs Android

**Solutions:**

**1. Detect Keyboard:**
- Listen to `visualViewport` resize events (modern browsers)
- Fallback: `window.innerHeight` changes
- Calculate keyboard height
- Store in state for layout adjustments

**2. Adjust Layout:**
- When keyboard shows:
  - Reduce modal content height by keyboard height
  - Scroll to bottom of messages
  - Keep input field visible above keyboard
- When keyboard hides:
  - Restore full modal height
  - Smooth transition (200ms)

**3. iOS-Specific Handling:**
- Use `env(safe-area-inset-bottom)` for home indicator
- Handle iOS keyboard toolbar (suggestions bar)
- Prevent zoom on input focus (font-size ≥16px)

**4. Android-Specific Handling:**
- Handle back button (should close modal)
- Different keyboard animations (instant vs gradual)

**Auto-Expanding Input:**
- Start as single line
- Expand as user types (up to 4 lines max)
- Auto-resize based on content
- Shift-Enter not needed on mobile (Enter sends)

**Tasks:**
- Create useKeyboardHeight hook
- Detect keyboard show/hide events
- Adjust modal content height when keyboard appears
- Scroll to bottom when keyboard shows
- Prevent zoom on focus (font-size ≥16px)
- Handle iOS safe-area-inset
- Implement auto-expanding textarea
- Test on iOS Safari and Android Chrome
- Handle back button on Android (close modal)

---

### Expected Outcomes for Stage 8

After completing this stage, you should have:

- **Floating AI button** with pulse animation
- **Full-screen AI modal** with smooth animations
- **Mobile-optimized chat interface** with larger text/buttons
- **Keyboard handling** that adjusts layout properly
- **Touch-friendly suggestion cards** (44px buttons)
- **Haptic feedback** for interactions
- **iOS and Android** compatibility

**Next Stage Preview:** Stage 9 will implement shared component enhancements including photo optimization, score badges, and empty states.

---

## Stage 9: Shared Component Enhancements

**Goal:** Build reusable components for photos, scores, loading states, and errors that work across desktop and mobile.

### 9.1 Photo Loading & Optimization

**Files to create:**
- `/src/components/map-v2/shared/LazyImage.tsx` - Optimized image component
- `/src/components/map-v2/shared/PhotoCarousel.tsx` - Swipeable carousel
- `/src/lib/map-v2/imageOptimization.ts` - Image URL generation utilities

**LazyImage Component:**

**Features:**
- **Lazy loading:** Only load when in viewport (IntersectionObserver)
- **Blur-up placeholder:** Show tiny blurred preview while loading
- **Responsive images:** Use srcset for different screen sizes
- **Format optimization:** Prefer WebP, fallback to JPEG
- **Loading skeleton:** Show shimmer animation while loading
- **Error handling:** Show fallback placeholder on load error
- **Fade-in animation:** Smooth transition when loaded (200ms)

**Image Sizes:**
Generate multiple sizes for responsive loading:
- Thumbnail: 200px wide (list view)
- Small: 400px wide (cards on mobile)
- Medium: 800px wide (cards on desktop)
- Large: 1200px wide (lightbox, full view)

**Blur-up Technique:**
- Store tiny base64 preview (20x20px, ~1KB)
- Show blurred version while full image loads
- Fade to full image when loaded
- Provides instant visual feedback

**Google Photos API Integration:**
- Request appropriate size from Google Places Photos API
- Add `maxwidth` and `maxheight` parameters
- Cache URLs for 24 hours (Photos API URLs expire)

**Tasks:**
- Create LazyImage with IntersectionObserver
- Implement blur-up placeholder technique
- Generate srcset for responsive images
- Add WebP support with JPEG fallback
- Build loading skeleton with shimmer
- Handle image load errors gracefully
- Add fade-in animation on load
- Optimize Google Photos API requests
- Cache photo URLs with expiration

---

### 9.2 Photo Carousel Component

**Files to create:**
- `/src/components/map-v2/shared/PhotoCarousel.tsx` - Carousel with navigation
- `/src/components/map-v2/shared/PhotoLightbox.tsx` - Full-screen viewer

**Carousel Features:**
- **Multiple photos:** Display array of images
- **Swipe navigation:** Swipe left/right to change photos (mobile)
- **Arrow navigation:** Previous/Next buttons (desktop)
- **Keyboard navigation:** Arrow keys (desktop)
- **Dot indicators:** Show current photo position
- **Counter:** "1 of 5" text indicator
- **Infinite loop:** Optional wrap-around to first/last

**Touch Gestures:**
- Swipe left: Next photo
- Swipe right: Previous photo
- Pinch to zoom: Zoom into photo (lightbox only)
- Double-tap: Toggle zoom (lightbox only)

**Lightbox Mode:**
- Full-screen overlay
- Dark background (0.95 opacity)
- Close button (top-right)
- ESC key to close
- Click outside to close
- Zoom controls
- Photo metadata sidebar (optional)

**Performance:**
- Preload adjacent photos (prev + next)
- Virtualize for many photos (only render visible + adjacent)
- Lazy load photos not yet viewed
- Smooth 60fps swipe animations

**Tasks:**
- Create PhotoCarousel with swipe support
- Add arrow buttons for desktop
- Implement keyboard navigation (arrows, ESC)
- Show dot indicators and counter
- Build PhotoLightbox full-screen viewer
- Add zoom functionality (pinch, double-tap)
- Preload adjacent photos
- Implement smooth swipe animations
- Handle focus trap in lightbox
- Test on touch and non-touch devices

---

### 9.3 Unified Score Badge System

**Files to create:**
- `/src/components/map-v2/shared/ScoreBadge.tsx` - Badge component
- `/src/lib/map-v2/scoreUtils.ts` - Scoring utilities

**Simplified Scoring:**
Consolidate scoring from v1 into single unified score (0-10):
- Quality score (60-70%): Rating + review volume
- Diversity score (25% for attractions): Uniqueness boost
- Confidence score (15-30%): Based on review count
- Persona boost (30%): Match with user travel style

**Color-Coded Badges:**
- **Green (9.0-10.0):** "Exceptional" - Must-see, top-tier
- **Blue (8.0-8.9):** "Excellent" - Highly recommended
- **Gray (7.0-7.9):** "Good" - Worth visiting
- **Hidden (<7.0):** Don't show (filter out low-quality)

**Badge Design:**
- **Desktop:** 40x24px, top-right of photo
- **Mobile:** 48x28px (slightly larger)
- Semi-transparent background
- White text, bold font
- Format: "8.7" or "9.2"
- Border radius: 4px

**Tooltip (Desktop Only):**
On hover, show breakdown:
```
Score: 8.7
─────────────
Quality: 8.9 ★★★★☆ (234 reviews)
Diversity: 7.5 (Unique type)
Confidence: 9.2 (High review count)
Persona: +0.3 (Matches your style)
```

**Mobile Behavior:**
- No tooltip (tap doesn't work well)
- Simple score display only
- Optional: Long-press for details (future)

**Tasks:**
- Consolidate scoring logic into scoreUtils
- Create ScoreBadge component with color coding
- Implement 3 color variants (green/blue/gray)
- Add tooltip with breakdown (desktop only)
- Position badge consistently (top-right of photos)
- Make badge larger on mobile (48x28px)
- Ensure badge is readable on all photo backgrounds
- Add semi-transparent background for contrast
- Test with various photo brightness levels

---

### 9.4 Empty States Library

**Files to create:**
- `/src/components/map-v2/shared/EmptyState.tsx` - Reusable empty state
- `/src/components/map-v2/shared/EmptyStateIllustrations.tsx` - SVG illustrations

**Empty State Variants:**

**1. No Place Selected (Discover mode):**
- Illustration: Map with location pin
- Heading: "Select a place to explore"
- Message: "Tap any location on the map to discover nearby attractions and restaurants"
- No CTA needed

**2. No Results (Discover mode with filters):**
- Illustration: Empty search/magnifying glass
- Heading: "No places found"
- Message: "Try adjusting your filters or search a different area"
- CTA: "Clear Filters" button

**3. Empty Itinerary (Plan mode):**
- Illustration: Empty list/clipboard
- Heading: "Your itinerary is empty"
- Message: "Start adding places to build your perfect trip"
- CTA: "Browse Places" (switches to Discover mode)

**4. No AI Conversation (AI mode):**
- Illustration: Sparkle/chat bubble
- Heading: "Ask me anything about [Place]"
- Message: "I can suggest attractions, restaurants, and hidden gems based on your preferences"
- Suggested prompts (chips): "Must-see spots", "Local favorites", etc.

**5. No Place Selected (AI mode):**
- Illustration: Map pin with question mark
- Heading: "Select a place first"
- Message: "Choose a location on the map to get personalized suggestions"
- No CTA needed

**6. Network Error:**
- Illustration: Disconnected WiFi symbol
- Heading: "Connection lost"
- Message: "Check your internet connection and try again"
- CTA: "Retry" button

**7. No Marker Selected (Map Interaction Context):**
- Illustration: Map with cursor/hand icon
- Heading: "Explore places on the map"
- Message: "Hover over or tap any marker to see details and add to your plan"
- No CTA needed
- Context: Shows subtly after user closes an expanded card, reminding them they can interact with other markers

**Empty State Structure:**
```
┌────────────────────────────────┐
│                                │
│     [Illustration - SVG]       │ ← Simple, minimal icon
│                                │
│     Heading Text               │ ← Bold, 18-20px
│                                │
│   Description message that     │ ← 14-16px, muted
│   explains the situation       │
│                                │
│     [Call to Action]           │ ← Optional button
│                                │
└────────────────────────────────┘
```

**Design Principles:**
- **Simple:** Minimal, not overwhelming
- **Helpful:** Explain why empty and what to do
- **Consistent:** Same structure across all variants
- **Friendly:** Warm, encouraging tone
- **Actionable:** Provide clear next step when possible

**Tasks:**
- Create reusable EmptyState component
- Design simple SVG illustrations for each variant
- Write clear, friendly copy for each state
- Add optional CTA button prop
- Ensure responsive sizing (smaller on mobile)
- Use consistent spacing and alignment
- Test accessibility (screen reader support)
- Make illustrations color-adaptive (light/dark mode)

---

### 9.5 Loading Skeletons

**Files to create:**
- `/src/components/map-v2/shared/Skeleton.tsx` - Base skeleton primitive
- `/src/components/map-v2/shared/PlaceCardSkeleton.tsx` - Card skeleton
- `/src/components/map-v2/shared/HubCardSkeleton.tsx` - Hub skeleton
- `/src/components/map-v2/shared/MessageSkeleton.tsx` - Chat message skeleton

**Skeleton Design:**
- Match exact layout of real component
- Gray blocks for text (different widths for variety)
- Rectangular block for images
- Shimmer animation: gradient sweep left-to-right
- Animation duration: 1.5-2s
- Subtle, not distracting

**Shimmer Animation:**
```
Background: Linear gradient
  - Stop 1: #f0f0f0 (0%)
  - Stop 2: #e0e0e0 (50%) ← Shimmer highlight
  - Stop 3: #f0f0f0 (100%)
Animate background-position left-to-right
```

**PlaceCardSkeleton (for card view):**
```
┌────────────────────────────────┐
│ [Gray rectangle - 16:9]        │ ← Photo placeholder
├────────────────────────────────┤
│ [████████████░░░░]             │ ← Name (80% width)
│ [██████░░░░░░░]                │ ← Meta (60% width)
│ [███████████░░]                │ ← Rating (70% width)
│                                │
│ [██████████████████]           │ ← Button shape
└────────────────────────────────┘
```

**HubCardSkeleton:**
- Banner photo placeholder (16:3 ratio)
- Hub name bar
- Two collapsible section headers
- 2-3 item placeholders per section

**MessageSkeleton (AI chat):**
- Message bubble outline
- 2-3 lines of text with varying widths
- For AI messages with suggestions: include card skeleton

**Best Practices:**
- Show skeleton immediately (don't wait)
- Match real component dimensions exactly
- Maintain layout (prevent content shift)
- Fade in real content when loaded (150ms)
- Use Suspense boundaries for code-split components

**Tasks:**
- Create base Skeleton component with shimmer
- Build skeleton variants for each component type
- Match exact dimensions of real components
- Implement smooth shimmer animation
- Add fade-in transition when real content loads
- Test that layout doesn't shift
- Ensure skeletons work with virtualized lists

---

### Expected Outcomes for Stage 9

After completing this stage, you should have:

- **LazyImage component** with blur-up and responsive srcset
- **Photo carousel** with swipe, keyboard, and zoom support
- **Unified score badge** system with color coding
- **Complete empty state library** for all scenarios
- **Loading skeletons** matching all component layouts
- **Consistent UX** across desktop and mobile

**Next Stage Preview:** Stage 10 will enhance search and filtering with autocomplete, smart filters, and "search area" functionality.

---

## Stage 10: Search & Filtering Improvements

**Goal:** Implement enhanced place search with autocomplete, improved filtering, and "search this area" functionality.

### 10.1 Enhanced Place Search

**Files to create:**
- `/src/components/map-v2/search/PlaceSearchBar.tsx` - Search input component
- `/src/components/map-v2/search/SearchResults.tsx` - Autocomplete results
- `/src/components/map-v2/search/RecentSearches.tsx` - Search history
- `/src/components/map-v2/hooks/usePlaceAutocomplete.ts` - Google Places autocomplete

**Desktop Search Bar (in header):**
```
┌─────────────────────────────────┐
│ [🔍] Search for a place...      │
└─────────────────────────────────┘
         ↓ (on focus/type)
┌─────────────────────────────────┐
│ Recent Searches                 │
│ • Paris, France           [×]   │
│ • Rome, Italy             [×]   │
├─────────────────────────────────┤
│ Suggestions                     │
│ 📍 Barcelona, Spain             │
│    City in Catalonia            │
│ 📍 Barcelona, Venezuela         │
│    City in Anzoátegui           │
└─────────────────────────────────┘
```

**Search Input Features:**
- Width: ~400px (desktop)
- Placeholder: "Search for a place..."
- Search icon (left side)
- Clear button "×" (right side, when text entered)
- Focus: Border highlight, dropdown appears
- Debounce: 300ms before autocomplete query

**Autocomplete Results:**
- Powered by Google Places Autocomplete API
- Types: Cities, regions, landmarks, addresses
- Show top 5-8 results
- Each result shows:
  - Place name (bold)
  - Description/location context (muted)
  - Icon: 📍 for all places
  - Distance from current map center (optional)

**Recent Searches:**
- Show above autocomplete results
- Store last 10 searches in localStorage
- Each with remove button (×)
- Click to search again
- Clear all button (if >3 recent searches)

**Keyboard Navigation:**
- Arrow down/up: Navigate results
- Enter: Select highlighted result
- ESC: Close dropdown
- Tab: Move focus out, close dropdown

**Selection Behavior:**
- Click/Enter result → Geocode place
- Add place to map (new hub)
- Pan and zoom map to show place
- Close dropdown
- Add to recent searches
- Switch to Discover mode (desktop) or Map tab (mobile)

**Tasks:**
- Create PlaceSearchBar with debounced input
- Integrate Google Places Autocomplete API
- Build autocomplete dropdown with results
- Implement recent searches (localStorage)
- Add keyboard navigation (arrows, enter, ESC)
- Handle selection → geocode → add to map
- Show loading state while autocomplete fetches
- Handle errors gracefully
- Clear button to reset input

---

### 10.2 Mobile Search Overlay

**Files to create:**
- `/src/components/map-v2/mobile/SearchOverlay.tsx` - Full-screen search

**Mobile Search Pattern:**
Tap search icon in header → Full-screen search overlay slides in

**Overlay Layout:**
```
┌─────────────────────────────┐
│ [←] Search...          [×]  │ ← Header with back
├─────────────────────────────┤
│ Recent                      │
│ • Paris           [×]       │
│ • Rome            [×]       │
├─────────────────────────────┤
│ Results                     │
│ 📍 Barcelona, Spain         │
│    City in Catalonia        │
│ 📍 Barcelona, Venezuela     │
│ ...                         │
└─────────────────────────────┘
```

**Mobile-Specific Features:**
- **Full-screen overlay:** Covers entire screen
- **Auto-focus input:** Opens keyboard automatically
- **Large touch targets:** 56px height for result items
- **Back button:** Android hardware back closes overlay
- **Swipe down:** Optional gesture to close
- **Clear button:** Large, easy to tap

**Recent Searches:**
- Larger item height (56px vs desktop)
- Full-width tap targets
- Swipe left on item to delete (like iOS pattern)

**Results:**
- Larger text for mobile readability
- More spacing between items
- Tap result → close overlay + add place + switch to map

**Tasks:**
- Create full-screen search overlay component
- Auto-focus input on open
- Implement slide-in animation
- Add back button handler (close overlay)
- Make result items 56px height minimum
- Support swipe-to-delete for recent searches
- Handle Android hardware back button
- Close overlay on result selection
- Ensure keyboard doesn't cover results

---

### 10.3 Smart Filtering

**Files to create:**
- `/src/components/map-v2/filters/FilterPanel.tsx` - Desktop filter UI
- `/src/components/map-v2/mobile/FilterBottomSheet.tsx` - Mobile filter sheet
- `/src/components/map-v2/hooks/useFilters.ts` - Filter state management

**Filter Categories:**

**1. Type Filter:**
- All (default)
- Attractions only
- Restaurants only
- Custom locations only

**2. Quality Filter:**
- Toggle: "High-quality only"
- Threshold selector: 7+ | 8+ | 9+
- Default: Off (show all)
- When on: Default threshold 8+

**3. Distance Filter (future):**
- Slider: 0-10km radius
- Default: 5km

**4. Price Range (restaurants only):**
- $ | $$ | $$$ | $$$$
- Multi-select checkboxes
- Default: All selected

**Desktop Filter Bar (in Discover panel):**
- Compact horizontal layout
- Category chips: [All] [Attractions] [Restaurants]
- Quality toggle switch with threshold dropdown
- Active filter count badge
- "Clear all" link when filters active

**Mobile Filter Sheet:**
- Opened by tapping filter button (bottom-left on map)
- Bottom sheet (not full-screen)
- Height: 50-60% of viewport
- Apply/Cancel buttons at bottom
- Shows filter count on filter button badge

**Filter Persistence:**
- Save to localStorage per place
- Key: `filters_${placeId}`
- Restore when place re-selected
- Clear when place removed from plan

**Filter Feedback:**
- Show result count: "Showing 12 of 45 places"
- Highlight active filters
- Smooth transition when filtering (fade out/in)
- No layout shift (maintain skeleton/space)

**Tasks:**
- Create FilterPanel for desktop (horizontal layout)
- Build FilterBottomSheet for mobile
- Implement category filter (radio-style selection)
- Add quality toggle with threshold selector
- Show active filter count badge
- Add "Clear all filters" action
- Persist filters to localStorage per place
- Update result count dynamically
- Smooth transitions when filtering
- Handle empty results gracefully

---

### 10.4 "Search This Area" Functionality

**Files to create:**
- `/src/components/map-v2/map/SearchAreaButton.tsx` - Button component
- `/src/components/map-v2/hooks/useMapPanDetection.ts` - Detect map movement

**Button Behavior:**
- **Hidden** by default
- **Appears** when user pans map >2km from selected place
- **Position:** Top-center of map
- **Animation:** Slide down from top (200ms)
- **Auto-hide:** Disappears after use or when panning back

**Detection Logic:**
- Track selected place coordinates
- On map pan/zoom end, calculate distance moved
- If distance > 2km threshold → show button
- Use Haversine formula for accurate distance
- Debounce detection (100ms) to avoid flickering

**Button Design:**
```
┌────────────────────┐
│ 🔍 Search this area│
└────────────────────┘
```
- Primary button styling
- Icon: Search or location target
- Text: "Search this area"
- Shadow for visibility on any map type

**Action:**
- Click → Fetch nearby places for current map center
- Show loading state on button ("Searching...")
- Clear existing discovery results
- Load new results for new location
- Pan map slightly to center results
- Switch to Discover mode (desktop) or keep on Map (mobile)

**Mobile Considerations:**
- Larger button (48px height)
- Position: Top-center, below header
- Ensure doesn't overlap with other controls
- Haptic feedback on tap

**Tasks:**
- Create SearchAreaButton component
- Implement pan detection with distance calculation
- Show button when >2km from selected place
- Add slide-down animation on appear
- Handle button click: fetch new results
- Show loading state while fetching
- Clear old results, show new ones
- Update selected place to map center
- Auto-hide button after use
- Test threshold on different zoom levels

---

### Expected Outcomes for Stage 10

After completing this stage, you should have:

- **Enhanced search** with Google autocomplete
- **Recent searches** with history management
- **Mobile search overlay** (full-screen)
- **Smart filtering** with quality threshold
- **"Search this area" button** with pan detection
- **Filter persistence** per place
- **Smooth filter transitions** without layout shift

**Next Stage Preview:** Stage 11 will focus on performance optimization with virtual scrolling, code splitting, and memoization.

---

## Stage 11: Performance Optimization

**Goal:** Optimize application performance through virtualization, code splitting, memoization, and bundle size reduction.

### 11.1 Virtual Scrolling

**Files to create:**
- `/src/components/map-v2/shared/VirtualList.tsx` - Reusable virtual list wrapper

**When to Use:**
- Lists with >50 items
- Compact list view (most important)
- Photo grid view (if many results)
- Hub cards list (if user has many hubs)

**Implementation:**
Use **react-window** or **@tanstack/react-virtual**:
- Only render visible items + buffer
- Dynamic item heights (for variable content)
- Smooth scrolling with momentum
- Scroll restoration when switching views

**VirtualList Component:**
Wraps react-window with sensible defaults:
- Auto-calculate container height
- Overscan: 3 items above/below viewport
- Dynamic sizing based on content
- Scroll to index method (for search/selection)

**Components to Virtualize:**

**1. Compact List View (highest priority):**
- Can have 100+ items easily
- Fixed item height: 70px
- Huge performance win

**2. Photo Grid:**
- Variable heights (masonry)
- More complex, use react-virtual
- Measure items dynamically

**3. Hub Cards (if >20 hubs):**
- Variable heights (collapsed vs expanded)
- Cache height measurements

**Challenges:**
- Dynamic heights require measurement
- Scroll position must persist when switching views
- Keyboard navigation needs adjustment
- Accessibility: Screen readers need full list

**Solutions:**
- Cache measured heights per item
- Store scroll position in state before unmount
- Restore scroll position on mount
- Provide "View All" option for screen readers

**Tasks:**
- Integrate react-window or @tanstack/react-virtual
- Create reusable VirtualList wrapper
- Virtualize compact list view
- Virtualize photo grid with dynamic heights
- Add scroll position persistence
- Test with 200+ items
- Ensure keyboard navigation still works
- Add accessibility fallback
- Measure performance improvement (60fps scrolling)

---

### 11.2 Code Splitting & Lazy Loading

**Files to create:**
- Update components to use React.lazy()
- Create loading fallbacks for lazy components

**Split Points:**

**1. Platform-Specific Layouts:**
```typescript
// Desktop layout - only load on desktop
const DesktopLayout = lazy(() => import('./layouts/DesktopLayout'));

// Mobile layout - only load on mobile
const MobileLayout = lazy(() => import('./mobile/MobileLayout'));
```
**Savings:** ~40-50% reduction for opposite platform

**2. Sidebar Panels (Desktop):**
```typescript
// Only load panel when switched to
const DiscoverPanel = lazy(() => import('./sidebar/discover/DiscoverPanel'));
const PlanPanel = lazy(() => import('./sidebar/plan/PlanPanel'));
const AIChatPanel = lazy(() => import('./sidebar/ai/AIChatPanel'));
```
**Savings:** ~30-40KB per panel not immediately needed

**3. Photo Lightbox:**
```typescript
// Only load when user opens lightbox
const PhotoLightbox = lazy(() => import('./shared/PhotoLightbox'));
```
**Savings:** ~20KB + dependencies

**4. Details Dialog:**
```typescript
// Only load when user views place details
const PlaceDetailsDialog = lazy(() => import('./shared/PlaceDetailsDialog'));
```
**Savings:** ~15-25KB

**5. Mobile AI Modal:**
```typescript
// Only load when user taps AI button
const AIChatModal = lazy(() => import('./mobile/AIChatModal'));
```
**Savings:** ~25-30KB

**Suspense Boundaries:**
Wrap lazy components in Suspense with fallbacks:
```
<Suspense fallback={<LoadingSkeleton />}>
  <LazyComponent />
</Suspense>
```

**Loading Fallbacks:**
- Use skeleton components (built in Stage 9)
- Match layout of real component
- Smooth transition when loaded

**Route-Level Splitting:**
- Split /map-v2 page from rest of app
- Async load Google Maps SDK
- Async load @dnd-kit (only needed for Plan mode)

**Bundle Analysis:**
- Use webpack-bundle-analyzer or similar
- Target: Initial bundle <200KB gzipped
- Each lazy chunk: <50KB gzipped

**Tasks:**
- Wrap DesktopLayout and MobileLayout in lazy()
- Lazy load sidebar panels (Discover, Plan, AI)
- Lazy load PhotoLightbox and PlaceDetailsDialog
- Lazy load mobile AI modal
- Add Suspense boundaries with skeleton fallbacks
- Analyze bundle sizes before/after
- Ensure smooth loading experience
- Test on slow 3G network
- Measure initial load time improvement

---

### 11.3 Memoization & Re-Render Optimization

**Files to create:**
- Audit components for unnecessary re-renders
- Add React.memo where beneficial

**React.memo Candidates:**

**1. PlaceCard (high priority):**
- Re-renders every time list changes
- Expensive: photos, animations
- Memo with props comparison
```
Props to compare: place.id, isAdded, viewMode
```

**2. HubCard:**
- Large component with many children
- Drag/drop can cause re-renders
- Memo with place.id comparison

**3. PlannedItem:**
- Many items in lists
- Memo to prevent cascade re-renders

**4. Map Markers:**
- Expensive to re-render all markers
- Memo individual marker components

**5. SuggestionCard (AI):**
- Multiple cards in chat
- Memo with suggestion.id

**useMemo for Expensive Calculations:**

**1. Filtered/Sorted Lists:**
```typescript
const filteredPlaces = useMemo(() => 
  places.filter(filter).sort(compareFn),
  [places, filters, sortBy]
);
```

**2. Score Calculations:**
```typescript
const placesWithScores = useMemo(() =>
  places.map(p => ({ ...p, score: calculateScore(p, personas) })),
  [places, personas]
);
```

**3. Map Bounds:**
```typescript
const bounds = useMemo(() =>
  calculateBounds(places),
  [places]
);
```

**useCallback for Event Handlers:**
Wrap callbacks passed to memoized children:
```typescript
const handleAddPlace = useCallback((placeId: string) => {
  dispatch({ type: 'ADD_PLACE', payload: placeId });
}, [dispatch]);
```

**Context Optimization:**
Split large contexts into smaller, focused ones:
- **MapDataContext:** places, selectedPlaceId, discoveryResults
- **MapUIContext:** activeMode, sidebarCollapsed, viewMode
- **MapFiltersContext:** filters

Prevents re-renders when unrelated state changes.

**React DevTools Profiler:**
- Identify components with frequent re-renders
- Measure render time
- Find bottlenecks
- Validate optimizations

**Tasks:**
- Add React.memo to PlaceCard, HubCard, PlannedItem
- Memo all map marker components
- Add useMemo for filtered/sorted lists
- Memoize score calculations
- Wrap event handlers in useCallback
- Consider splitting context into smaller contexts
- Profile with React DevTools
- Measure re-render reduction
- Ensure no performance regression

---

### 11.4 Image & Asset Optimization

**Image Optimization Strategies:**

**1. Responsive Images:**
- Use srcset for multiple sizes
- Let browser choose appropriate size
- Reduce bandwidth on mobile

**2. Format Selection:**
- Prefer WebP (smaller, better quality)
- Fallback to JPEG for compatibility
- Use `<picture>` element for format selection

**3. Lazy Loading:**
- Native lazy loading: `loading="lazy"`
- IntersectionObserver for custom control
- Only load images in/near viewport

**4. Compression:**
- Request compressed images from Google Photos API
- Use appropriate quality settings (80-85%)
- Balance quality vs file size

**5. Caching:**
- Cache-Control headers for long-term caching
- Service worker for offline access (future)
- IndexedDB for photo URL caching

**Asset Optimization:**

**1. Icons:**
- Use SVG instead of PNG/JPEG
- Inline small SVGs (< 2KB)
- SVG sprite for repeated icons
- Optimize SVGs with SVGO

**2. Fonts:**
- Subset fonts (only needed characters)
- Use font-display: swap
- Preload critical fonts
- Consider system font stack

**3. CSS:**
- Remove unused Tailwind classes (PurgeCSS)
- Minimize CSS bundle
- Critical CSS inline, rest async

**Google Maps Optimization:**
- Lazy load Maps SDK (only when needed)
- Use lightweight map controls
- Limit marker count (cluster if >100)
- Disable unnecessary map features

**Tasks:**
- Implement responsive images with srcset
- Add WebP support with JPEG fallback
- Enable native lazy loading for images
- Request compressed images from Google API
- Optimize and inline small SVG icons
- Subset and optimize fonts
- Purge unused Tailwind CSS
- Lazy load Google Maps SDK
- Test on slow 3G connection
- Measure Lighthouse performance score

---

### Expected Outcomes for Stage 11

After completing this stage, you should have:

- **Virtual scrolling** for long lists (60fps with 200+ items)
- **Code splitting** reducing initial bundle <200KB
- **Memoization** preventing unnecessary re-renders
- **Image optimization** with responsive images and WebP
- **Lazy loading** for off-screen content
- **60+ Lighthouse performance score**

**Next Stage Preview:** Stage 12 will focus on accessibility and polish including keyboard navigation, ARIA labels, and animations.

---

## Stage 12: Accessibility & Polish

**Goal:** Ensure the application is fully accessible, supports keyboard navigation, and has polished animations and transitions.

### 12.1 Keyboard Accessibility

**Files to create:**
- `/src/components/map-v2/hooks/useKeyboardShortcuts.ts` - Global shortcuts
- Update all interactive components with keyboard support

**Global Keyboard Shortcuts:**

**Desktop Shortcuts:**
- `Cmd/Ctrl + B` - Toggle sidebar collapse
- `Cmd/Ctrl + K` - Focus search bar
- `Cmd/Ctrl + F` - Open filter panel
- `1` - Switch to Discover mode
- `2` - Switch to Plan mode
- `3` - Switch to AI mode
- `Escape` - Close modals, dialogs, overlays
- `?` - Show keyboard shortcuts help (future)

**Navigation Shortcuts:**
- `Tab` - Move focus forward
- `Shift + Tab` - Move focus backward
- `Arrow keys` - Navigate lists, tabs
- `Enter` - Activate focused element
- `Space` - Toggle checkboxes, buttons

**List Navigation:**
- `Arrow Up/Down` - Navigate list items
- `Home` - First item
- `End` - Last item
- `Page Up/Down` - Skip 10 items
- `Enter` - Open selected item
- `Space` - Add to plan / toggle selection

**Modal/Dialog:**
- `Escape` - Close
- `Tab` - Cycle through focusable elements (trapped)
- `Shift + Tab` - Reverse cycle

**Map Navigation:**
- Google Maps provides built-in zoom controls (scroll wheel, +/- buttons, pinch gesture)
- `Arrow keys` - Pan map (optional, may conflict with other navigation)

**Focus Visible:**
- Show clear focus ring on keyboard focus
- Hide focus ring on mouse click
- Use `:focus-visible` CSS pseudo-class
- Consistent focus style: 2px solid accent color, 2px offset

**Skip Links:**
- "Skip to map" link at top (for screen readers)
- "Skip to sidebar" link
- Only visible on keyboard focus

**Tasks:**
- Implement useKeyboardShortcuts hook
- Add global shortcuts (Cmd+B, Cmd+K, etc.)
- Ensure all interactive elements are keyboard accessible
- Add arrow key navigation to lists
- Implement focus trap in modals
- Add clear focus-visible styles throughout
- Create skip links for main sections
- Test keyboard-only navigation
- Document shortcuts (help modal or page)

---

### 12.2 ARIA Labels & Screen Reader Support

**Landmark Roles:**

Apply ARIA landmarks to major sections:
- `<header role="banner">` - Page header
- `<nav role="navigation">` - Bottom nav (mobile)
- `<main role="main">` - Map canvas
- `<aside role="complementary">` - Sidebar (desktop)
- `<region aria-label="Discover panel">` - Sidebar panels
- `<search>` - Search bar

**Button Labels:**

Every icon-only button needs aria-label:
- Collapse sidebar: `aria-label="Collapse sidebar"`
- Close modal: `aria-label="Close"`
- Add to plan: `aria-label="Add [Place Name] to plan"`
- Remove: `aria-label="Remove [Place Name]"`
- Filter: `aria-label="Filter results"`

**Interactive Elements:**

**1. Mode Tabs:**
```html
<div role="tablist" aria-label="Sidebar modes">
  <button role="tab" aria-selected="true" aria-controls="discover-panel">
    Discover
  </button>
  ...
</div>
```

**2. Collapsible Sections:**
```html
<button 
  aria-expanded="true" 
  aria-controls="attractions-section"
>
  Attractions (5)
</button>
<div id="attractions-section">...</div>
```

**3. Score Badges:**
```html
<span aria-label="Score: 8.7 out of 10">8.7</span>
```

**4. Loading States:**
```html
<div aria-live="polite" aria-busy="true">
  Loading places...
</div>
```

**5. Progressive Disclosure Cards (Map Overlays):**

**HoverMiniCard:**
```html
<div 
  role="tooltip" 
  aria-label="Quick preview of [Place Name]"
  id="hover-card-[placeId]"
>
  <img src="..." alt="[Place Name]" />
  <h3>[Place Name]</h3>
  <span aria-label="Rating: 4 out of 5 stars">★★★★☆</span>
  <span aria-label="Score: 8.7 out of 10">8.7</span>
</div>
```

**ExpandedPlaceCard:**
```html
<div 
  role="dialog" 
  aria-modal="true"
  aria-labelledby="place-name-[placeId]"
  aria-describedby="place-description-[placeId]"
>
  <button 
    aria-label="Close place details"
    onClick={onClose}
  >
    ×
  </button>
  
  <img src="..." alt="[Place Name]" />
  <span aria-label="Score: 8.7 out of 10">8.7</span>
  
  <h2 id="place-name-[placeId]">[Place Name]</h2>
  <p id="place-description-[placeId]">
    Italian • $$ • 1.2km away
  </p>
  
  <span aria-label="Rating: 4.5 out of 5 stars with 234 reviews">
    ★★★★☆ (234 reviews)
  </span>
  
  <button 
    aria-label="Add [Place Name] to your plan"
    disabled={isAddedToPlan}
  >
    {isAddedToPlan ? 'Added ✓' : 'Add to Plan'}
  </button>
  
  <button 
    aria-label="View full details for [Place Name]"
  >
    Details
  </button>
</div>
```

**MapBackdrop:**
```html
<div
  role="presentation"
  aria-hidden="true"
  onClick={onClose}
  aria-label="Click to close place card"
>
</div>
```

**Live Regions:**

Use `aria-live` for dynamic updates:
- Save status: `<div aria-live="polite">Saving...</div>`
- New results: `<div aria-live="polite">Showing 12 places</div>`
- Errors: `<div aria-live="assertive">Error loading places</div>`

**Form Fields:**

All inputs need labels:
```html
<label for="search-input">Search for a place</label>
<input 
  id="search-input"
  type="text"
  aria-describedby="search-help"
/>
<div id="search-help">
  Search for cities, landmarks, or addresses
</div>
```

**Image Alt Text:**
- Place photos: `alt="[Place Name]"`
- Empty decorative images: `alt=""` or `aria-hidden="true"`
- Illustrations: Descriptive alt text

**Focus Management:**

**Opening Modals:**
1. Trap focus inside modal
2. Focus first interactive element (usually close button or heading)
3. Prevent focus on background elements

**Closing Modals:**
1. Return focus to triggering element
2. Re-enable background focus

**Screen Reader Announcements:**
- Announce mode changes: "Switched to Discover mode"
- Announce filter updates: "12 places match your filters"
- Announce items added: "Added Eiffel Tower to plan"

**Tasks:**
- Add ARIA landmarks to all major sections
- Label all icon-only buttons with aria-label
- Implement tablist pattern for mode selector
- Add aria-expanded to collapsible sections
- Create aria-live regions for status updates
- Ensure all forms have proper labels
- Add descriptive alt text to all images
- Add ARIA labels to HoverMiniCard (role="tooltip")
- Add ARIA labels to ExpandedPlaceCard (role="dialog", aria-modal)
- Ensure MapBackdrop has appropriate ARIA attributes
- Implement focus trap in ExpandedPlaceCard
- Manage focus on card open/close (return to marker)
- Handle ESC key to close card
- Announce card opening/closing to screen readers
- Test card interactions with VoiceOver (macOS/iOS)
- Test card interactions with NVDA (Windows)
- Implement focus trap in other modals
- Test with keyboard-only navigation
- Verify all interactive elements are reachable

---

### 12.3 Animations & Transitions

**Files to create:**
- `/src/components/map-v2/styles/transitions.css` - Shared transition utilities

**Animation Principles:**
- **Purposeful:** Every animation should have a purpose
- **Fast:** 150-300ms for most transitions (not too slow)
- **Natural:** Use easing functions (ease-out, ease-in-out)
- **Respectful:** Honor `prefers-reduced-motion`

**Transition Timing:**
- **Fast:** 150ms - hover states, button presses
- **Medium:** 200-250ms - panel switches, collapse/expand
- **Slow:** 300ms - page transitions, modal open/close

**Easing Functions:**
- `ease-out` - Starting fast, slowing down (most transitions)
- `ease-in-out` - Smooth start and end (modals, panels)
- `ease-in` - Rarely used (dismissing elements)
- Custom: `cubic-bezier(0.4, 0, 0.2, 1)` - Material Design

**Key Animations:**

**1. Sidebar Collapse/Expand:**
- Width transition: 200ms ease-out
- Opacity fade for content: 150ms
- Transform content slightly during transition

**2. Mode Switching:**
- Fade out old panel: 100ms
- Fade in new panel: 150ms (with 50ms delay)
- Total: 200ms transition

**3. Card Hover:**
- Scale: 1.0 → 1.01 (150ms ease-out)
- Shadow: Subtle lift (150ms)
- No transform on mobile (touch doesn't hover)

**4. Bottom Sheet (Mobile):**
- Slide up: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- Smooth spring physics for drag gestures
- Snap to positions with spring animation

**5. Modal Open/Close:**
- Backdrop fade: 200ms
- Modal slide up (mobile): 250ms ease-out
- Modal fade in (desktop): 200ms ease-out

**6. List Item Add/Remove:**
- Add: Fade + scale in (200ms)
- Remove: Scale + fade out (150ms)
- Height collapse: 200ms ease-in-out

**7. Loading Skeleton → Content:**
- Fade out skeleton: 100ms
- Fade in content: 150ms (50ms delay)
- No layout shift

**Reduced Motion:**
Honor user preference:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Performance:**
- Use `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left` (cause reflows)
- Use `will-change` sparingly (only during animation)
- Test on low-end devices (maintain 60fps)

**Tasks:**
- Define transition timing variables
- Create reusable animation utilities
- Implement sidebar collapse animation
- Add mode switch fade transitions
- Animate bottom sheet with spring physics
- Add card hover animations (desktop only)
- Implement modal open/close animations
- Add list item add/remove animations
- Respect prefers-reduced-motion
- Test all animations at 60fps
- Ensure no jank on low-end devices

---

### 12.4 Error Handling & Feedback

**Files to create:**
- `/src/components/map-v2/shared/ErrorBoundary.tsx` - React error boundary
- `/src/components/map-v2/shared/ErrorState.tsx` - Error display component
- `/src/components/map-v2/shared/Toast.tsx` - Toast notification system

**Error Boundary:**
Wrap entire app in error boundary to catch React errors:
- Log error to console (and analytics in production)
- Show friendly error UI
- Provide "Reload" button
- Option to report error (future)

**Error State Component:**
For expected errors (network, API failures):

**Network Error:**
```
┌────────────────────────────────┐
│     [📡 Icon]                  │
│                                │
│     Connection Lost            │
│                                │
│  Check your internet and retry │
│                                │
│     [Retry]                    │
└────────────────────────────────┘
```

**API Error:**
```
┌────────────────────────────────┐
│     [⚠️ Icon]                  │
│                                │
│     Something Went Wrong       │
│                                │
│  We couldn't load this data.   │
│  Please try again.             │
│                                │
│     [Retry]                    │
└────────────────────────────────┘
```

**No Results / Empty State:**
(Already covered in Stage 9)

**Toast Notifications:**
For transient feedback:

**Success Toast:**
- "Place added to plan" ✓
- "Changes saved" ✓
- Green accent, checkmark icon

**Error Toast:**
- "Failed to save. Retrying..." ⚠️
- "Couldn't load places. Check connection" ⚠️
- Red accent, warning icon

**Info Toast:**
- "Switched to Discover mode" ℹ️
- "Filters cleared" ℹ️
- Blue accent, info icon

**Toast Design:**
- Position: Bottom-right (desktop), Top (mobile)
- Duration: 3-5 seconds (dismiss on tap/swipe)
- Max 1-2 toasts at a time
- Stack vertically if multiple
- Swipe to dismiss (mobile)
- Accessible: aria-live="polite"

**Retry Logic:**
- Automatic retry with exponential backoff
- Show retry count: "Retrying... (attempt 2 of 3)"
- Manual retry button
- Cancel retry option

**Offline Detection:**
- Monitor `navigator.onLine`
- Show persistent banner when offline
- Queue actions for when back online
- Toast when connectivity restored: "Back online ✓"

**Tasks:**
- Create ErrorBoundary component
- Build ErrorState for network/API errors
- Implement toast notification system
- Add retry logic with exponential backoff
- Handle offline state with persistent banner
- Queue actions when offline
- Show appropriate error messages (user-friendly, no tech jargon)
- Test error scenarios (network loss, API failure, etc.)
- Ensure errors are logged for debugging

---

### Expected Outcomes for Stage 12

After completing this stage, you should have:

- **Full keyboard accessibility** with shortcuts
- **Comprehensive ARIA labels** for screen readers
- **Smooth animations** at 60fps
- **Reduced motion support** for accessibility
- **Error handling** with retry logic
- **Toast notifications** for feedback
- **Offline support** with action queuing

**Next Stage Preview:** Stage 13 will focus on testing and quality assurance across browsers, devices, and accessibility tools.

---

## Stage 13: Testing & Quality Assurance

**Goal:** Comprehensive testing across browsers, devices, and accessibility tools to ensure a production-ready application.

### 13.1 Cross-Browser Testing

**Browsers to Test:**

**Desktop:**
- Chrome (latest) - Primary
- Firefox (latest)
- Safari (latest macOS)
- Edge (latest)

**Mobile:**
- Safari iOS (latest)
- Chrome Android (latest)

**Test Matrix:**
- macOS: Safari, Chrome, Firefox
- Windows: Chrome, Edge, Firefox
- iOS: Safari (on actual device)
- Android: Chrome (on actual device)

**Browser-Specific Issues to Check:**

**1. CSS Compatibility:**
- Container queries (newer feature)
- CSS Grid support
- Flexbox quirks
- CSS variables (custom properties)
- Backdrop-filter (for blurs)

**2. JavaScript APIs:**
- IntersectionObserver (lazy loading)
- ResizeObserver (responsive detection)
- matchMedia (responsive hooks)
- navigator.vibrate (haptics - optional)
- visualViewport (keyboard detection)

**3. Touch Events:**
- Touch gestures (swipe, pinch, long-press)
- Hover states on touch devices
- Click vs touch event handling

**4. Map Integration:**
- Google Maps rendering
- Marker interactions
- Map controls

**Testing Checklist Per Browser:**
- [ ] Layout renders correctly
- [ ] Sidebar collapse/expand works
- [ ] Map interactions (pan, zoom, markers)
- [ ] Search autocomplete functions
- [ ] Filters apply correctly
- [ ] Drag-and-drop works
- [ ] Modals/dialogs open and close
- [ ] Animations are smooth
- [ ] Images load properly
- [ ] Forms submit correctly
- [ ] AI chat functions
- [ ] Mobile bottom sheet works (mobile browsers)

**Tools:**
- BrowserStack or similar for cross-browser testing
- Chrome DevTools device emulation (for quick checks)
- Actual devices for final testing (especially mobile)

**Tasks:**
- Test in all major browsers (Chrome, Firefox, Safari, Edge)
- Test on actual iOS device (Safari)
- Test on actual Android device (Chrome)
- Document any browser-specific issues
- Add polyfills if needed (though modern stack shouldn't need many)
- Test touch gestures on actual devices
- Verify map performance across browsers
- Check console for errors/warnings

---

### 13.2 Accessibility Audit

**Automated Testing:**

**Tools:**
- **axe DevTools** (browser extension)
- **Lighthouse** accessibility score (Chrome DevTools)
- **Pa11y** (CLI tool for CI/CD)

**Run On:**
- Each major view/mode (Discover, Plan, AI)
- Modals and dialogs
- Mobile and desktop layouts
- Forms and interactive elements

**Target:** 100/100 Lighthouse accessibility score

**Manual Testing:**

**Screen Readers:**
- **VoiceOver** (macOS): Cmd + F5 to enable
- **VoiceOver** (iOS): Settings → Accessibility
- **NVDA** (Windows): Free screen reader

**Test Scenarios:**
1. Navigate entire app with screen reader only
2. Add place to plan
3. Use AI chat
4. Filter and search
5. Reorder items
6. Open and close modals

**Keyboard-Only Navigation:**
1. Unplug mouse
2. Navigate using Tab, arrows, Enter, Escape
3. Complete full user flow:
   - Search for place
   - Browse discovery results
   - Add items to plan
   - Use AI suggestions
   - Reorder itinerary

**Color Contrast:**
Use browser extension or Figma plugin:
- All text must meet WCAG AA (4.5:1 ratio)
- Large text (18px+): 3:1 ratio
- Interactive elements: 3:1 ratio

**Focus Indicators:**
- Tab through all interactive elements
- Verify clear, visible focus ring
- Ensure focus order is logical
- No focus traps (except modals)

**Accessibility Checklist:**
- [ ] All images have alt text
- [ ] All buttons have labels (text or aria-label)
- [ ] All forms have labels
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works everywhere
- [ ] Focus indicators are visible
- [ ] Screen reader announces all content correctly
- [ ] ARIA landmarks are present
- [ ] Live regions announce updates
- [ ] Modals trap focus properly
- [ ] No accessibility errors in axe/Lighthouse

**Tasks:**
- Run axe DevTools on all major views
- Run Lighthouse accessibility audit
- Test with VoiceOver (macOS/iOS)
- Test with NVDA (Windows)
- Navigate app keyboard-only
- Check color contrast throughout
- Fix all accessibility issues found
- Achieve 100/100 Lighthouse accessibility score
- Document accessibility features

---

### 13.3 Performance Testing

**Metrics to Measure:**

**Lighthouse Performance Audit:**
- First Contentful Paint (FCP): <1.5s
- Time to Interactive (TTI): <3.5s
- Speed Index: <3.0s
- Total Blocking Time (TBT): <200ms
- Largest Contentful Paint (LCP): <2.5s
- Cumulative Layout Shift (CLS): <0.1

**Target:** >90 Lighthouse performance score

**Real-World Testing:**

**Network Conditions:**
- Fast 3G (throttled)
- Slow 3G (throttled)
- Offline (test offline handling)
- Wifi (baseline)

**Device Performance:**
- High-end (modern desktop/phone)
- Mid-range (2-3 year old device)
- Low-end (budget Android phone)

**Test Scenarios:**

**1. Initial Load:**
- Measure time to interactive
- Check bundle size (<200KB initial)
- Verify lazy loading works
- Check Google Maps loads properly

**2. Large Dataset:**
- Load itinerary with 50+ places
- Scroll long lists (should be 60fps)
- Test virtual scrolling performance
- Drag-drop with many items

**3. Image Loading:**
- Discovery results with 100+ places
- Photo grid view
- Measure lazy loading effectiveness
- Check for layout shift

**4. Map Performance:**
- 100+ markers on map
- Pan and zoom smoothness
- Marker clustering (if implemented)
- Map tile loading

**Chrome DevTools Profiling:**
- Performance tab: Record user interactions
- Identify long tasks (>50ms)
- Check for memory leaks
- Profile React renders

**React DevTools Profiler:**
- Measure component render times
- Identify unnecessary re-renders
- Check memo/callback effectiveness

**Bundle Analysis:**
- Analyze bundle sizes
- Identify large dependencies
- Check code splitting effectiveness
- Look for duplicate code

**Performance Budget:**
- Initial JS bundle: <200KB gzipped
- Initial CSS: <50KB gzipped
- Lazy chunks: <50KB each gzipped
- Images: Responsive, lazy-loaded
- Fonts: Subset, <100KB total

**Tasks:**
- Run Lighthouse performance audit (desktop and mobile)
- Test on Fast 3G and Slow 3G
- Test on low-end Android device
- Profile with Chrome DevTools Performance tab
- Profile with React DevTools Profiler
- Analyze bundle sizes
- Test large datasets (50+ places, 100+ results)
- Check for memory leaks (24h stress test)
- Verify 60fps scrolling
- Measure actual user experience
- Achieve >90 Lighthouse performance score

---

### 13.4 User Acceptance Testing

**Goal:** Test with real users to validate UX and discover issues.

**Test Participants:**
- 5-10 users (internal team + external beta testers)
- Mix of experience levels (power users + beginners)
- Different devices (iOS, Android, desktop)

**Test Scenarios:**

**Scenario 1: Plan a Trip to Paris**
1. Open /map-v2
2. Search for "Paris, France"
3. Browse nearby attractions
4. Add 5 places to plan
5. Reorder them
6. Get AI suggestions for restaurants

**Scenario 2: Discover Hidden Gems**
1. Select a city
2. Use AI to find "hidden gems locals love"
3. Add 2-3 suggestions to plan
4. View place details
5. Remove one place

**Scenario 3: Mobile Trip Planning**
1. Open on mobile device
2. Search for destination
3. Browse photo grid
4. Add places via bottom sheet
5. Switch to Plan view
6. Reorder using long-press
7. Swipe to delete an item

**Observation Points:**
- Where do users get confused?
- What features are discoverable?
- What features are hidden/missed?
- Are error messages helpful?
- Is the AI feature intuitive?
- Are interactions smooth and natural?

**Feedback Collection:**
- Post-test survey (1-5 ratings + comments)
- Screen recording (with permission)
- Think-aloud protocol during testing
- Specific questions:
  - "How intuitive was feature X?"
  - "Did you understand what AI Suggestions does?"
  - "Was anything frustrating?"

**Metrics to Track:**
- Task completion rate
- Time to complete each task
- Number of errors/retries
- Feature discovery (did they find AI, filters, etc.)
- User satisfaction (1-5 scale)

**Iterate Based on Feedback:**
- Prioritize issues by severity and frequency
- Quick fixes: Improve labels, add tooltips
- Medium changes: Adjust layouts, reorder elements
- Major changes: Redesign confusing flows

**Tasks:**
- Recruit 5-10 test participants
- Prepare test scenarios and questions
- Conduct user testing sessions
- Record observations and feedback
- Analyze results (task completion, time, errors)
- Identify top 3-5 issues to fix
- Implement improvements
- Retest if major changes made

---

### Expected Outcomes for Stage 13

After completing this stage, you should have:

- **Cross-browser compatibility** (Chrome, Firefox, Safari, Edge)
- **100/100 accessibility score** on Lighthouse
- **>90 performance score** on Lighthouse
- **Tested on actual devices** (iOS, Android)
- **User feedback** incorporated
- **Production-ready quality**

**Next Stage Preview:** Stage 14 will plan the migration, rollout strategy, and deprecation of v1.

---

## Stage 14: Migration & Deployment

**Goal:** Plan and execute the migration from /map v1 to v2, with gradual rollout and eventual deprecation of the old version.

### 14.1 Feature Flags & A/B Testing

**Files to create:**
- `/src/lib/common/featureFlags.ts` - Feature flag utilities
- Environment variable: `ENABLE_MAP_V2`

**Feature Flag Implementation:**

**Environment Variable:**
```
ENABLE_MAP_V2=true   # Enable for everyone
ENABLE_MAP_V2=false  # Disable (use v1)
ENABLE_MAP_V2=beta   # Enable for beta testers only
```

**Beta Tester Detection:**
- Check user ID against beta list
- Or check localStorage flag: `map_v2_beta_enabled`
- Or URL parameter: `?map_v2=true`

**Navigation Logic:**
- If feature flag off → always redirect to `/map`
- If feature flag on → show v2 link in navigation
- If beta mode → show v2 link only for beta users

**Banner on V2:**
Show at top of page:
```
┌─────────────────────────────────────────┐
│ ℹ️ New Map Experience - Beta            │
│ You're trying our redesigned map.       │
│ [Give Feedback] [Back to Classic]  [×] │
└─────────────────────────────────────────┘
```
- Dismissible (store in localStorage)
- "Give Feedback" → opens feedback form/modal
- "Back to Classic" → navigates to `/map` (v1)

**A/B Testing (Optional):**
For gradual rollout:
- 25% of users see v2
- 75% see v1
- Track engagement metrics for both groups
- Compare:
  - Time on page
  - Places added to plan
  - AI feature usage
  - Error rates
  - Bounce rate

**Tasks:**
- Create feature flag system
- Add ENABLE_MAP_V2 environment variable
- Implement beta tester detection
- Show conditional navigation link
- Add banner on v2 with feedback link
- Set up A/B test (optional)
- Track analytics separately for v1 and v2
- Monitor error rates during rollout

---

### 14.2 Data Compatibility & Migration

**Backward Compatibility:**
v2 must work with existing data:
- Trips created in v1
- Places added via /plan
- User preferences

**Database Schema:**
- No schema changes needed
- Same API endpoints
- Same data structures (Place, Trip, Conversation)

**URL Parameters:**
Both versions support:
- `?tripId=xxx` - Load specific trip
- `?conversationId=xxx` - Load from /plan session

**Validation:**
Test v2 with v1 data:
1. Create trip in v1
2. Open same trip in v2 (via tripId)
3. Verify all data displays correctly
4. Make changes in v2
5. Re-open in v1, verify compatibility

**Data Migration Path:**
None needed - data is compatible as-is.

**API Compatibility:**
v2 uses same API endpoints:
- `/api/trips/:id`
- `/api/attractions/nearby`
- `/api/attractions/suggest`
- No backend changes required

**Tasks:**
- Test v2 with existing v1 trip data
- Verify tripId and conversationId parameters work
- Ensure changes in v2 don't break v1
- Test round-trip: v1 → v2 → v1
- Document any limitations

---

### 14.3 User Communication & Documentation

**In-App Announcement:**
When v2 launches, show one-time modal:
```
┌──────────────────────────────────────┐
│  ✨ Introducing the New Map View     │
│                                      │
│  [Screenshot/GIF of v2]              │
│                                      │
│  • Larger photos & cleaner design   │
│  • AI-powered suggestions           │
│  • Better mobile experience         │
│                                      │
│  [Try It Now] [Maybe Later]          │
│                                      │
│  You can always switch back          │
└──────────────────────────────────────┘
```

**What's New Page:**
Document at `/docs/map-v2-user-guide.md`:
- Feature overview
- Screenshots comparing v1 and v2
- Migration guide
- FAQ

**Key Changes to Highlight:**

**1. Visual Improvements:**
- Larger, more prominent photos
- Cleaner card design
- Better use of whitespace

**2. New Features:**
- AI-powered suggestions
- Photo grid view
- Mobile bottom sheets
- Swipe gestures

**3. Improved Workflows:**
- Easier filtering
- Better itinerary organization
- Faster place addition

**4. Mobile Enhancements:**
- Full-screen map
- Touch-optimized interactions
- Bottom navigation

**Feedback Collection:**
Add feedback mechanism:
- "Give Feedback" button in header
- Simple form: "What do you think?" + free text
- Rating: 1-5 stars
- Track in database or send to email

**Help & Support:**
- Link to user guide
- Tooltip hints for new features (first-time only)
- "?" icon for help

**Tasks:**
- Write user guide documentation
- Create comparison screenshots (v1 vs v2)
- Draft announcement modal
- Add feedback collection mechanism
- Create FAQ section
- Plan email announcement (if applicable)
- Add help tooltips for key features

---

### 14.4 Rollout Plan & V1 Deprecation

**Phase 1: Internal Testing (1 week)**
- Team members only
- Feature flag: `ENABLE_MAP_V2=beta`
- Test all features thoroughly
- Fix critical bugs
- Gather internal feedback

**Phase 2: Beta Testing (2 weeks)**
- Invite 50-100 beta testers
- Email announcement with link
- URL parameter bypass: `?map_v2=true`
- Collect feedback actively
- Monitor error logs
- Iterate based on feedback

**Phase 3: Soft Launch (1 week)**
- 25% of users see v2
- A/B test setup
- Monitor metrics closely:
  - Error rates
  - Engagement (time on page, actions)
  - AI usage
  - User feedback sentiment
- Be ready to rollback if issues

**Phase 4: Gradual Rollout (2 weeks)**
- Week 1: 50% of users
- Week 2: 75% of users
- Continue monitoring
- Address issues as they arise
- Compare metrics to v1

**Phase 5: Full Launch (Ongoing)**
- 100% of users on v2
- Feature flag: `ENABLE_MAP_V2=true`
- v1 still accessible (for 1-2 months)
- Banner on v1: "Try the new map experience"

**Phase 6: V1 Deprecation (2 months after full launch)**
- Announce deprecation date
- Redirect `/map` to `/map-v2`
- Remove v1 code from codebase
- Update all links and navigation

**Rollback Plan:**
If critical issues found:
1. Set feature flag to `false` immediately
2. All users revert to v1
3. Fix issues
4. Resume rollout when stable

**Metrics to Monitor:**

**Engagement:**
- Time spent on /map-v2
- Number of places added
- AI suggestions requested
- Filter usage

**Performance:**
- Page load time
- Error rate
- Crash rate
- Lighthouse scores

**User Satisfaction:**
- Feedback ratings
- Bounce rate
- Return visits
- Feature adoption

**Success Criteria:**
- Error rate <1%
- Feedback rating >4/5
- AI usage >30% of sessions
- Engagement ≥ v1 levels

**V1 Deprecation Timeline:**
- Month 1: Beta testing
- Month 2: Gradual rollout
- Month 3-4: Full launch, v1 accessible
- Month 5: Deprecate v1, redirect to v2
- Month 6: Remove v1 code

**Tasks:**
- Create rollout schedule
- Set up feature flags for gradual rollout
- Implement A/B testing infrastructure
- Define success metrics
- Set up monitoring dashboards
- Plan rollback procedure
- Announce beta testing program
- Execute rollout phases
- Monitor metrics at each phase
- Communicate deprecation timeline
- Redirect /map to /map-v2
- Remove v1 code after deprecation period

---

### Expected Outcomes for Stage 14

After completing this stage, you should have:

- **Feature flag system** for controlled rollout
- **Beta testing program** with user feedback
- **A/B testing** comparing v1 and v2
- **User documentation** and announcement
- **Gradual rollout plan** (25% → 50% → 75% → 100%)
- **Metrics monitoring** for success tracking
- **V1 deprecation timeline** and execution plan

---

## Implementation Complete!

You now have a comprehensive, 14-stage implementation plan for /map-v2 that covers:

✅ **Foundation** (Stages 1-2): Architecture, state management, layout
✅ **Desktop Features** (Stages 3-5): Discover, Plan, AI modes
✅ **Mobile Features** (Stages 6-8): Bottom nav, plan view, AI modal
✅ **Shared Components** (Stage 9): Photos, scores, empty states, skeletons
✅ **Search & Filters** (Stage 10): Enhanced search, filtering, "search area"
✅ **Performance** (Stage 11): Virtual scrolling, code splitting, optimization
✅ **Accessibility** (Stage 12): Keyboard, ARIA, animations, errors
✅ **Testing** (Stage 13): Cross-browser, accessibility, performance, user testing
✅ **Deployment** (Stage 14): Feature flags, rollout, v1 deprecation

This plan provides a clear roadmap from initial setup to production deployment, with detailed descriptions of what needs to be built at each stage without prescribing specific code implementations.

