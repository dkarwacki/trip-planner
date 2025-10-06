# Plan: Add Colored Circles for Attractions and Restaurants on Map

## Overview

When a place card is shown in the AttractionsPanel, display semi-transparent circles on the map for each attraction/restaurant based on their geographic location.

## Implementation Steps

### 1. **Add `location` field to `Attraction` type** (`src/types.ts`)

- Add `location: { lat: number; lng: number }` to the `Attraction` interface
- This will store coordinates for each attraction/restaurant returned from the API

### 2. **Update API endpoints to include location data**

- Modify `src/pages/api/attractions.ts` to include `geometry.location` from Google Places API
- Modify `src/pages/api/restaurants.ts` to include `geometry.location` from Google Places API

### 3. **Create circle markers in TripPlanner component** (`src/components/TripPlanner.tsx`)

- Add a new ref to track circle overlays: `circlesRef`
- Create new `useEffect` hook that triggers when:
  - Attractions/restaurants data changes
  - Active tab changes
- Use `google.maps.Circle` to render circles:
  - **Blue circles** for attractions (when attractions tab is active)
  - **Red circles** for restaurants (when restaurants tab is active)
- Circle styling:
  - `fillColor`: `#3B82F6` (blue) for attractions, `#EF4444` (red) for restaurants
  - `fillOpacity`: `0.2` (semi-transparent)
  - `strokeColor`: same as fillColor
  - `strokeOpacity`: `0.5`
  - `strokeWeight`: `1`
  - `radius`: ~100 meters (adjustable)
- Clear circles when:
  - Panel is closed
  - Place is changed
  - Tab switches

### 4. **Track active tab state**

- Add `activeTab` state to track which tab is currently visible
- Pass `activeTab` to `AttractionsPanel` via props
- Update circles based on active tab

## Files to Modify

- `src/types.ts` - Add location field to Attraction interface
- `src/pages/api/attractions.ts` - Include location in API response
- `src/pages/api/restaurants.ts` - Include location in API response
- `src/components/TripPlanner.tsx` - Add circle rendering logic
- `src/components/AttractionsPanel.tsx` - Report active tab changes

## Technical Details

- Use standard `google.maps.Circle` (not AdvancedMarkerElement) since we need overlay shapes
- Circles don't require map ID configuration
- Clean up circles properly to avoid memory leaks
