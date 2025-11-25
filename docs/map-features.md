# `/map` Route Features

A comprehensive guide to all features available on the `/map` page of the Trip Planner application.

**Audience:** End users and developers working on the application.

**Note:** This document describes features specific to the `/map` route. Other routes (e.g., `/` homepage) have separate functionality not covered here.

## Overview

The `/map` page is an interactive map-based tool for discovering and organizing travel destinations with AI-powered recommendations for attractions and restaurants.

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
- **Photo previews**: See high-quality image preview for each suggested place (click to view all photos in lightbox)

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

### 3. Place Autocomplete

**User capabilities:**

- Search for places using Google Places autocomplete
- Keyboard navigation (arrow keys, Enter, Escape)
- Clear input after selection
- Duplicate prevention

**Technical details:**

- Uses Google Places API New (`AutocompleteSuggestion.fetchAutocompleteSuggestions`)
- Text-based autocomplete with predictive suggestions
- 300ms debounce on input for performance
- Keyboard accessible with ARIA attributes

### 4. Discover Attractions & Restaurants

**User capabilities:**

- Browse nearby attractions and restaurants when a place is selected
- **View photo thumbnails directly in the list** - Each item shows a preview image on the right (when available)
- View ratings, reviews, price levels, open/closed status
- See quality scores with detailed breakdowns on hover (positioned inline with ratings)
- Interactive map markers that sync with list items
- **Hover over map markers to see instant tooltips** with key information (desktop only)
- Click list items or map markers to open a rich details dialog
- Preview up to two top-rated photos in details dialog before adding items to a plan
- Add items directly from the details dialog without leaving context
- Filter results to show only high-scoring items (scores ≥8.5)

**Technical details:**

- Two-tab interface with lazy loading (restaurants load on first tab open)
- **Photo integration:**
  - List view displays 60x60px thumbnail (800px source) fetched from Google Places Nearby Search API
  - Limited to 1 photo per item in list for performance
  - Details dialog shows 1 high-quality photo (800px, aspect 4:3) with click-to-expand lightbox for all photos
  - Graceful fallback when photos unavailable or fail to load
- Smart scoring system:
  - **Quality Score (50% for attractions, 70% for restaurants):** rating (60%) + log₁₀(reviews) (40%)
  - **Persona Score (10% for attractions only):** 100 points if attraction matches your travel style, 0 otherwise
  - **Diversity Score (20% for attractions only):** Rewards places with unique/rare types
  - **Confidence Score (20% for attractions, 30% for restaurants):** Based on review volume reliability
    - High confidence: >100 reviews
    - Medium confidence: 20-100 reviews
    - Low confidence: <20 reviews
  - Score badge displayed inline with rating information for better visual hierarchy
- **High-score filter:** Toggle button to show only items with scores ≥8.5
  - Shows filtered count (e.g., "15 of 42 results")
  - Applies independently to attractions and restaurants tabs
  - Note: Scores are calculated on 0-100 scale, displayed as 0-10 (divided by 10)
- Results cached per place selection, sorted by score, duplicates filtered
- Details dialog fetches Google Place photos on demand (effect runtime) and reuses them across openings
- Dialog exposes `Add to Plan` as the primary action
- Marker hover/click synchronization with list items
- **Hover tooltips:** Display name, star rating, review count, price level, address, and open/closed status
  - Desktop only (hover not available on mobile touch devices)
- **Layout optimizations:**
  - Address with MapPin icon only shown when vicinity data is available
  - Open/closed status positioned below address for better information flow
  - Checkmark indicator for already-planned items
- **Persona-aware scoring:** Results personalized based on user's travel style preferences
  - 10% of score weight on persona matching for attractions
  - Eight personas: General Tourist, Nature Lover, Art Enthusiast, Foodie, Adventure Seeker, Digital Nomad, History Buff, Photography Enthusiast
  - Persona score is additive component of total 0-100 score, not a multiplier

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
  - **Cross-feature navigation:** "Back to Chat" button appears when arriving from `/plan` route conversation
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
- "Back to conversation" button (when conversationId present) for navigation to `/plan` chat

**Technical details:**

- Chevron buttons positioned outside sidebar edges
- Transition animations (300ms ease-in-out)
- Collapsed width: 12px (48px), Expanded: 320-384px depending on screen size
- Auto-expand triggers:
  - Right sidebar: When selecting a place or viewing attractions
  - Left sidebar: Manual control only
- Responsive width classes with Tailwind container queries
- Hidden on mobile (uses drawer navigation instead)

### 9. Trip Persistence & Auto-save

**User capabilities:**

- Automatic saving of all places and planned items to database
- No manual save required - works seamlessly in background
- Visual save status indicator (saving/saved/error)
- Retry option if save fails
- Resume trips from history via URL parameters

**Technical details:**

- Auto-save with 750ms debounce after changes
- Creates new trip on first place add
- Updates existing trip incrementally
- URL parameters: `?tripId={id}&conversationId={id}`
- Trip association with `/plan` conversations via conversationId
- Save states: idle → saving → saved/error
- Database persistence via Supabase

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
