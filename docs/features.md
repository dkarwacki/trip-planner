# Trip Planner Features

A comprehensive guide to all features available in the Trip Planner application.

**Audience:** End users and developers working on the application.

## Overview

Trip Planner is an interactive map-based tool for discovering and organizing travel destinations with AI-powered recommendations for attractions and restaurants.

**Tech Stack:** Astro 5, React 19, TypeScript, Google Maps API, OpenRouter API (AI), Effect (error handling)

---

## Core Features

### 1. AI-Powered Trip Suggestions

Get intelligent recommendations tailored to your trip plan using conversational AI.

**User capabilities:**
- Click "Suggest" button on any place to get AI recommendations
- Have multi-turn conversations to refine suggestions ("Show me more affordable restaurants")
- View AI's step-by-step reasoning (collapsible chain-of-thought)
- Accept or reject individual suggestions
- Get three types of suggestions: Attractions (🎯), Restaurants (🍽️), Tips (💡)

**Technical details:**
- Uses OpenRouter API with function calling (compatible with Claude, GPT-4, etc.)
- AI calls `searchAttractions`, `searchRestaurants`, and `getPlaceDetails` tools
- Parallel tool execution for performance
- Conversation history maintained for context-aware refinements
- Accepted suggestions are added to place-specific itineraries

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
- Click items or markers to highlight and navigate

**Technical details:**
- Two-tab interface with lazy loading (restaurants load on first tab open)
- Smart scoring system:
  - **Quality Score:** Based on rating × log(review_count)
  - **Diversity Score:** Rewards variety in attraction types (attractions only)
  - **Locality Score:** Prioritizes well-known places with many reviews
- Results cached per place selection
- Marker hover/click synchronization with list items
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

---

## Data Flow

1. **Place Selection:** User searches or clicks → Place details fetched → Stored in state
2. **Attraction Discovery:** Place selected → Parallel fetch (attractions + restaurants) → Scored and ranked → Displayed in panel
3. **AI Suggestions:** User clicks "Suggest" → OpenRouter API → Function calls to Google Maps → Results presented with reasoning
4. **Itinerary Building:** User accepts suggestion/clicks "+" → Added to place-specific plan → Merged with discovery results
5. **Area Search:** User pans map → Distance check → Button appears → Click → New search at current center → Results refresh

## State Management

- **Places:** Array of Place objects with planned attractions/restaurants
- **Selected Place:** Currently active place for viewing attractions
- **Attractions/Restaurants:** Cached results per place with scores
- **UI State:** Active tab, loading states, hovered/highlighted items
- **Search State:** Initial search center tracking for "Search this area" button

## Error Handling

- Zod schemas for input/output validation
- Effect-based error handling with tagged errors
- User-friendly error messages
- Loading states for all async operations
- Empty states with helpful guidance
