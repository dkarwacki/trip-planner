# Plan: Add Place via Map Click

## Overview

Add functionality to click anywhere on the map to show a context menu/popover with an option to add that location to the places list.

## Implementation Steps

### 1. Add Shadcn UI Components

- Install `popover` component from shadcn/ui for the context menu
- Install `dialog` component (if needed for confirmation)

### 2. Create Reverse Geocoding Service

#### Server-side (`src/lib/services/geocoding/index.ts`)
- Add Effect-based function to convert coordinates to place details
- Use Google Maps Geocoding API
- Define tagged errors: `GeocodingError`, `NoResultsError`
- Return Place object with formatted address and coordinates

#### Client-side (`src/lib/services/geocoding/client.ts`)
- Wrapper to call backend API endpoint
- Return Place object with coordinates and address
- Follow existing error handling patterns

#### API Route (`src/pages/api/geocoding/reverse.ts`)
- Accept lat/lng coordinates via POST
- Call server-side geocoding service
- Return place information
- Follow existing patterns from places API (validation with Zod)

### 3. Update TripPlanner Component

#### Add State Management
- `clickedLocation: { lat: number; lng: number } | null` - Store clicked coordinates
- `showAddPlacePopover: boolean` - Control popover visibility
- `isReverseGeocoding: boolean` - Loading state for geocoding

#### Add Map Click Handler
- Add `onClick` prop to `<Map>` component
- Extract lat/lng from `google.maps.MapMouseEvent`
- Set clicked location state
- Show popover at click position

#### Add Temporary Marker
- Create temporary marker ref for clicked location
- Show marker when location is clicked
- Clear marker when popover is closed or place is added

#### Add Popover UI
- Position popover absolutely over the map at click coordinates
- Display:
  - Coordinates (formatted)
  - "Add to Places" button
  - "Cancel" button
  - Loading spinner during reverse geocoding
  - Error message if geocoding fails

#### Handle "Add to Places" Flow
1. Call reverse geocoding service to get place details
2. Validate result (ensure placeId exists)
3. Check for duplicates (reuse existing logic)
4. Add place to places array using existing `setPlaces`
5. Clear temporary marker and popover
6. Show success/error feedback

#### Edge Cases
- Handle empty geocoding results
- Handle API errors gracefully
- Prevent duplicate additions
- Close popover when clicking elsewhere on map

### 4. Update Types (if needed)

- Ensure `Place` interface supports geocoded places
- Verify all required fields (id, name, lat, lng, placeId) are provided by geocoding service

## Technical Details

### Map Click Event
```tsx
<Map
  onClick={(e: google.maps.MapMouseEvent) => {
    const lat = e.detail.latLng?.lat;
    const lng = e.detail.latLng?.lng;
    if (lat && lng) {
      handleMapClick({ lat, lng });
    }
  }}
/>
```

### Geocoding API
- Use `google.maps.Geocoder` via geocoding library
- Call `geocode({ location: { lat, lng } })`
- Extract place_id, formatted_address, and coordinates from results
- Generate unique ID for the place

### UI Components
- Use shadcn Popover component
- Position with absolute coordinates
- Show loading state with Skeleton or Spinner
- Maintain consistent styling with existing UI

### Error Handling
- Use Effect pattern with tagged errors
- Display user-friendly error messages
- Fallback to coordinates if no address found
- Log errors for debugging

## Files to Create/Modify

### Create
- `src/lib/services/geocoding/index.ts`
- `src/lib/services/geocoding/client.ts`
- `src/pages/api/geocoding/reverse.ts`

### Modify
- `src/components/TripPlanner.tsx` - Add click handler, popover UI, state management
- `src/types.ts` - Verify Place interface (may not need changes)

## Dependencies

- Shadcn UI components: `popover` (possibly `dialog`)
- Google Maps Geocoding API (already available via Places API)
- Existing Effect patterns and error handling
