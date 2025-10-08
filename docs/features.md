# Trip View Features

This document describes the features implemented for the `/trip` view on the `trips-map-1` branch.

## Overview

The Trip Planner provides an interactive map-based interface for discovering and organizing travel destinations with integrated attraction and restaurant recommendations.

## Core Features

### 1. Interactive Google Maps Integration

- **Full-screen map interface** with Google Maps API
- **Advanced marker support** using `AdvancedMarkerElement` API
- **Automatic viewport management** - map adjusts bounds to show all added places
- **Gesture handling** enabled for smooth map interactions
- **Custom map styling** via optional Map ID configuration

### 2. Smart Place Autocomplete

**Adaptive Search Strategy:**
- **Zoom-aware filtering** - At zoom levels >14, only shows establishments; below that includes geocode results
- **Viewport-based biasing** - Prioritizes results near current map view
- **Dynamic expansion** - Expands search bounds based on zoom level:
  - Zoom 15-18 (streets): �1km
  - Zoom 11-14 (city): �5km
  - Zoom 7-10 (region): �20km
  - Zoom 0-6 (world/continent): �50km

**User Experience:**
- Clears input after selection
- Prevents duplicate places
- Real-time error feedback

### 3. Click-to-Add Places

- **Map click handler** - Click anywhere on the map to add a location
- **Temporary marker** - Green marker appears at clicked location
- **Reverse geocoding** - Automatically resolves coordinates to place details:
  - Place name
  - Formatted address
  - Place ID for deduplication
- **Interactive popover** with coordinates display and confirmation
- **Duplicate prevention** - Checks if location already exists in places list

### 4. Places Management Panel

**Left sidebar** (384px width) with:
- **Search input** at the top for place autocomplete
- **Places list card** showing:
  - Numbered badges (1, 2, 3...) for visual ordering
  - Place names with coordinate display (lat, lng to 4 decimals)
  - Remove button (X) for each place
  - Selection highlighting
  - Empty state message
- **Click interactions:**
  - Click place � Pan to location and zoom to level 14
  - Click place � Load attractions/restaurants automatically
  - Click remove � Delete place from list and clear related data
  - Double-click place � Expand planned items (if any exist)
- **Collapsible planned items:**
  - Chevron toggle button to expand/collapse planned attractions and restaurants
  - Auto-expands when items are added to the plan
  - Auto-collapses when place is deselected
  - Separate sections for "Planned Attractions" (blue) and "Planned Restaurants" (red)

### 5. Trip Planning & Itinerary

**Add attractions/restaurants to your place-specific plan:**

**Add to Plan Dialog:**
- Triggered by clicking the "+" button on any attraction/restaurant card
- Displays confirmation dialog with:
  - Attraction/restaurant name and details
  - Rating, review count, price level
  - Open/closed status badge
  - Full address
  - Confirm/Cancel buttons

**Planned Items Management:**
- **Drag-and-drop reordering** - Reorder attractions and restaurants within each place
- **Numbered badges** - Visual sequence indicators (blue for attractions, red for restaurants)
- **Quick access** - Click planned item to:
  - Switch to parent place
  - Switch to appropriate tab (attractions/restaurants)
  - Highlight the item on the map
  - Pan to item location
- **Remove items** - Hover to reveal X button for removal
- **Status indicators:**
  - "+" button for unplanned items
  - Check mark (✓) for already-planned items
  - Prevents duplicate additions

**Collapsible Place Cards:**
- Expand/collapse toggle (chevron icon) appears when planned items exist
- Shows inline planned items grouped by type
- Compact display with ratings and key info
- Color-coded backgrounds (blue for attractions, red for restaurants)

### 6. Attractions & Restaurants Discovery

**Right-side panel** (384px width) appears when a place is selected:

**Two-Tab Interface:**
- **Tourist Attractions** tab (blue markers)
- **Restaurants** tab (red markers)

**Lazy Loading:**
- Attractions load immediately on place selection
- Restaurants load only when tab is first opened
- Results cached per place selection

**Smart Scoring System:**
- **Quality Score** - Based on rating and review count
- **Diversity Score** - Rewards variety in attraction types (attractions only)
- **Locality Score** - Prioritizes well-known, frequently reviewed places
- **Total Score** - Weighted combination displayed in badge

**Score Badge UI:**
- Info icon with total score
- Hover tooltip showing breakdown
- Help icon (?) to explain calculation methodology
- Type-specific explanations for attractions vs. restaurants

### 7. Map Markers & Interactions

**Place Markers:**
- Default Google Maps markers
- Numbered automatically
- Clickable to select place

**Attraction/Restaurant Markers:**
- **Color coding:**
  - Blue (#3B82F6) for tourist attractions
  - Red (#EF4444) for restaurants
- **Size variations:**
  - Default: 16px circle
  - Hovered/highlighted: 24px circle with scale(1.2) transform
- **Interactive states:**
  - Hover on marker � Enlarge marker + scroll to item in panel
  - Hover on list item � Enlarge corresponding marker
  - Click marker � Scroll to and highlight item in panel
  - Click list item � Highlight marker on map

**Visual Effects:**
- White border (2px default, 3px hovered)
- Box shadow for depth
- Smooth transitions (0.2s ease-in-out)
- Z-index elevation on hover

### 8. Rich Attraction Details

Each attraction/restaurant card displays:

**Header:**
- Name (line-clamp-2 for overflow)
- External link icon � Opens in Google Maps
- Score badge with breakdown tooltip

**Metadata Row:**
- Star rating (filled yellow star icon)
- Review count (formatted: 1.5k, 2.3k, etc.)
- Price level ($, $$, $$$, $$$$)
- Open/Closed status badge (when available)

**Location:**
- Map pin icon
- Full address (vicinity, line-clamp-2)

**Categories:**
- Up to 3 type badges with color coding:
  - Museum � Purple
  - Restaurant � Orange
  - Cafe � Amber
  - Park � Green
  - Art Gallery � Pink
  - Tourist Attraction � Blue
  - Others � Gray
- "+N more" badge for additional types

**Interaction States:**
- Hover � Background highlight
- Selected � Accent background + primary ring
- Clickable � Cursor pointer
- Keyboard accessible (Enter/Space)

### 9. Error Handling & Loading States

**Loading States:**
- Skeleton loaders for attractions/restaurants
- Spinner for reverse geocoding
- Loading text for place details

**Error States:**
- Red error text for place autocomplete failures
- Error panels in attractions/restaurants tabs
- Geocoding error messages in click-to-add popover

**Edge Cases:**
- Duplicate detection with user-friendly messages
- Empty results with helpful messages
- API error handling with Effect-based error types

## Technical Implementation

### State Management
- React hooks (useState, useEffect, useRef, useCallback)
- Refs for managing marker instances
- Controlled component patterns

### Effect Integration
- Tagged errors for type-safe error handling
- `Effect.gen` for async operations
- Proper error discrimination with `_tag` field

### Performance Optimizations
- Lazy tab loading (restaurants only load on first view)
- Marker cleanup on unmount
- Debounced autocomplete
- RequestAnimationFrame for input clearing
- Map instance sharing via context

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support (Enter/Space)
- Role="button" for clickable cards
- Focus-visible states
- Screen reader friendly alt text

## Services & APIs Used

1. **Google Maps JavaScript API**
   - Places API (autocomplete, details)
   - Geocoding API (reverse geocoding)
   - Maps API (map display, markers)

2. **Custom Backend APIs**
   - `/api/places/search` - Place autocomplete
   - `/api/places/details` - Place details by ID
   - `/api/geocoding/reverse` - Reverse geocoding
   - `/api/attractions` - Tourist attractions with scoring
   - `/api/restaurants` - Restaurants with scoring

3. **Effect Services**
   - `places/client.ts` - Place operations
   - `attractions/client.ts` - Attraction fetching and scoring
   - `geocoding/client.ts` - Geocoding operations

## UI Components Used

- **shadcn/ui components:**
  - Card, CardHeader, CardTitle, CardContent
  - ScrollArea
  - Badge
  - Button
  - Input
  - Skeleton
  - Separator
  - Tabs, TabsList, TabsTrigger, TabsContent
  - Tooltip, TooltipProvider, TooltipTrigger, TooltipContent
  - Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
  - Collapsible, CollapsibleContent, CollapsibleTrigger

- **Lucide icons:**
  - X (close)
  - Star (ratings)
  - MapPin (location)
  - ExternalLink (Google Maps)
  - Info (score)
  - HelpCircle (help)
  - Plus (add to plan)
  - Check (planned status)
  - ChevronDown, ChevronUp (collapse/expand)

- **DnD Kit:**
  - @dnd-kit/core - Core drag and drop functionality
  - @dnd-kit/sortable - Sortable list utilities
  - @dnd-kit/utilities - CSS transform utilities
