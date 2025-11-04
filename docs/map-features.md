# `/map` Route Features

A comprehensive guide to all features available on the `/map` page of the Trip Planner application.

**Audience:** End users and developers working on the application.

**Note:** This document describes features specific to the `/map` route. Other routes (e.g., `/` homepage) have separate functionality not covered here.

## Overview

The `/map` page is an interactive map-based tool for discovering and organizing travel destinations with AI-powered recommendations for attractions and restaurants.

**Tech Stack:** Astro 5, React 19, TypeScript, Google Maps API, OpenRouter API (AI), Effect (error handling)

---

## Core Features

### 1. AI-Powered Suggestions

Get intelligent recommendations tailored to your travel plan using conversational AI with priority-based suggestions.

**User capabilities:**

- Click "Suggest" button on any place to get AI recommendations
- Have multi-turn conversations to refine suggestions ("Show me more affordable restaurants")
- View AI's step-by-step reasoning (collapsible chain-of-thought)
- Accept or reject individual suggestions
- Get three types of suggestions: Attractions (🎯), Restaurants (🍽️), Tips (💡)
- See priority badges on suggestions:
  - **Must-see**: Essential, iconic attractions
  - **Highly recommended**: Great options if you have time
  - **Hidden gem**: Lesser-known authentic local experiences
- **Photo previews**: See up to two high-rated images for each suggested place with lightbox viewing

**Technical details:**

- Uses OpenRouter API with function calling (compatible with Claude, GPT-4, etc.)
- AI calls `searchAttractions`, `searchRestaurants`, and `getPlaceDetails` tools
- Parallel tool execution for performance
- Conversation history maintained for context-aware refinements
- Accepted suggestions are added to place-specific itineraries
- AI required to suggest: 5 attractions (≥1 hidden gem) + 2 restaurants max
- Uses current map center for location-aware suggestions
- Pulls Google Places photo metadata directly from Text Search results and surfaces top 2 photos per suggestion

### 2. Interactive Map

**User capabilities:**

- Search for places using autocomplete search bar
- Click anywhere on map to add custom locations (with reverse geocoding)
- Pan and zoom to explore different areas
- Click "Search this area" button to find attractions/restaurants in current view
- Click markers to select places and view details

**Technical details:**

- Google Maps JavaScript API with `AdvancedMarkerElement`
- Reverse geocoding for click-to-add functionality
- Distance-based trigger (~500m threshold) for "Search this area" button
- Uses map's `idle` event to detect when user stops panning
- Button fetches new results centered on current viewport
- Automatic viewport management with bounds fitting
- Custom markers with color coding: blue (attractions), red (restaurants), green (temporary)

### 3. Smart Place Autocomplete

**User capabilities:**

- Search adapts to map zoom level (streets vs. cities vs. regions)
- Results prioritized based on current map view
- Duplicate prevention
- Clear input after selection

**Technical details:**

- Zoom-aware filtering: zoom >14 shows only establishments, <14 includes geocode results
- Viewport-based biasing with dynamic search radius expansion:
  - Zoom 15-18 (streets): ±1km
  - Zoom 11-14 (city): ±5km
  - Zoom 7-10 (region): ±20km
  - Zoom 0-6 (world): ±50km
- Uses Google Places Autocomplete API

### 4. Discover Attractions & Restaurants

**User capabilities:**

- Browse nearby attractions and restaurants when a place is selected
- View ratings, reviews, price levels, open/closed status
- See quality scores with detailed breakdowns on hover
- Interactive map markers that sync with list items
- **Hover over map markers to see instant tooltips** with key information (desktop only)
- Click list items or map markers to open a rich details dialog
- Preview up to two top-rated photos before adding items to a plan
- Add items directly from the details dialog without leaving context

**Technical details:**

- Two-tab interface with lazy loading (restaurants load on first tab open)
- Smart scoring system:
  - **Quality Score (60% for attractions, 70% for restaurants):** rating (60%) + log₁₀(reviews) (40%)
  - **Diversity Score (25% for attractions only):** Rewards places with unique/rare types
  - **Confidence Score (15% for attractions, 30% for restaurants):** Based on review volume reliability
    - High confidence: >100 reviews
    - Medium confidence: 20-100 reviews  
    - Low confidence: <20 reviews
- Results cached per place selection, sorted by score, duplicates filtered
- Details dialog fetches Google Place photos on demand (effect runtime) and reuses them across openings
- Dialog exposes `Add to Plan` as the primary action
- Marker hover/click synchronization with list items
- **Hover tooltips:** Display name, star rating, review count, price level, address, and open/closed status
  - Desktop only (hover not available on mobile touch devices)
- Google Places API (Nearby Search + Place Details)

### 5. Build Your Itinerary

**User capabilities:**

- Add attractions/restaurants to plan with confirmation dialog
- Drag-and-drop reordering of places and planned items
- Expand/collapse place cards to view inline planned items
- Click planned items to jump to location on map
- Remove items from plan

**Technical details:**

- Uses `@dnd-kit` for drag-and-drop functionality
- Separate lists for planned attractions and restaurants per place
- Numbered badges and color coding (blue: attractions, red: restaurants)
- Checkmark indicators for already-planned items
- Auto-expansion of place cards when items are added
- Tab switching when clicking planned items (attractions vs. restaurants)

### 6. Click-to-Add Custom Locations

**User capabilities:**

- Click anywhere on map to place a marker
- View coordinates for selected location
- Automatically resolve to address and place name
- Confirm or cancel before adding

**Technical details:**

- Temporary green marker with custom styling
- Google Maps Geocoding API for reverse geocoding
- Popover UI with loading states and error handling
- Duplicate detection before adding
- Effect-based error handling with tagged errors

### 7. Responsive Mobile Experience

**User capabilities:**

- Native mobile bottom navigation with 4 tabs:
  - **Places:** View and manage all your saved places
  - **Map:** Interactive map view with touch-optimized markers
  - **Explore:** Discover attractions and restaurants for selected place
  - **Plan:** View all planned items across all places
- Badge indicators showing counts on Places and Plan tabs
- Touch-friendly larger markers (24px vs 16px on desktop)
- Full-screen drawer panels for attractions/restaurants
- Smart tab switching (auto-switch to Explore when selecting place)
- Safe area support for devices with notches

**Technical details:**

- Mobile-first responsive design (shows on screens <640px)
- Uses `vaul` library for drawer animations
- Fixed bottom navigation with elevation shadow
- Disabled state for Explore (no place selected) and Plan (no items) tabs
- Dynamic marker sizing based on device type
- CSS safe area utilities (`safe-area-bottom`)
- Active tab indicator with colored accent bar

### 8. Collapsible Sidebars (Desktop)

**User capabilities:**

- Collapse left sidebar (places list) to maximize map space
- Collapse right sidebar (attractions panel) for focused map viewing
- Tooltip hints on collapsed sidebar buttons
- Smooth animations during collapse/expand
- Auto-expand sidebars when selecting places or attractions

**Technical details:**

- Chevron buttons positioned outside sidebar edges
- Transition animations (300ms ease-in-out)
- Collapsed width: 12px (48px), Expanded: 320-384px depending on screen size
- Auto-expand triggers:
  - Right sidebar: When selecting a place or viewing attractions
  - Left sidebar: Manual control only
- Responsive width classes with Tailwind container queries
- Hidden on mobile (uses drawer navigation instead)

---

## Data Flow

1. **Place Selection:** User searches or clicks → Place details fetched → Stored in state → Auto-expand sidebar/switch tab
2. **Attraction Discovery:** Place selected → Parallel fetch (attractions + restaurants) → Scored, sorted, deduplicated → Displayed in panel
3. **AI Suggestions:** User clicks "Suggest" → OpenRouter API with map center context → Function calls to Google Maps → Results with priority badges → Presented with reasoning
4. **Itinerary Building:** User accepts suggestion/clicks "+" → Added to place-specific plan → Merged with discovery results → Badge counts updated
5. **Area Search:** User pans map → Distance check → Button appears → Click → New search at current center → Results refresh
6. **Mobile Navigation:** Tab switch → Content changes → Map/drawers update → Auto-expansion triggers for relevant views

## State Management

- **Places:** Array of Place objects with planned attractions/restaurants
- **Selected Place:** Currently active place for viewing attractions
- **Attractions/Restaurants:** Cached results per place with scores (sorted, deduplicated)
- **UI State:** 
  - Desktop: Active tab, loading states, hovered/highlighted items, sidebar collapse states
  - Mobile: Active mobile tab (places/map/explore/plan), drawer open states
- **Search State:** Initial search center tracking for "Search this area" button
- **Map State:** Current map center coordinates for AI suggestions

## Error Handling

- Zod schemas for input/output validation
- Effect-based error handling with tagged errors
- User-friendly error messages
- Loading states for all async operations
- Empty states with helpful guidance
