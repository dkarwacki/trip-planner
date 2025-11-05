# Photo Proxy Implementation - Summary

## Problem
Photos were causing excessive Google Places API billing (12k+ calls yesterday) because:
1. Photo URLs included the API key directly in the browser
2. Every photo view made a billable API call
3. No caching was implemented
4. Photos were embedded in list views with many attractions

## Solution Implemented

### Architecture Changes

#### 1. Domain Model Update
- **File**: `src/domain/common/models/Place.ts`
- **Change**: `PlacePhoto` interface now stores `photoReference` instead of `url`
- **Impact**: Photos are no longer loaded automatically; references are stored for on-demand fetching

#### 2. Backend Photo Cache Layer
- **New File**: `src/infrastructure/map/cache/PhotoCache.ts`
- **Features**:
  - Server-side caching with 48-hour TTL
  - Capacity: 500 photos (~50MB)
  - Effect-based implementation
  - Returns binary photo data with content type

#### 3. Photo Use Case
- **New Files**: `src/application/map/photos/` (GetPhoto.ts, inputs.ts, outputs.ts)
- **Purpose**: Business logic for fetching photos from cache
- **Validation**: Zod schema for photo reference and max width

#### 4. Photo Proxy API Endpoint
- **New File**: `src/pages/api/photos.ts`
- **Method**: POST
- **Input**: `{ photoReference: string, maxWidth: number }`
- **Output**: Binary photo data with appropriate Content-Type
- **Cache Headers**: `Cache-Control: public, max-age=172800` (48 hours)
- **Security**: API key never exposed to browser

#### 5. GoogleMapsClient Updates
- **File**: `src/infrastructure/common/google-maps/GoogleMapsClient.ts`
- **Changes**:
  - `nearbySearch()`: Stores photo references, not URLs
  - `placeDetails()`: Stores photo references, not URLs
  - `textSearch()`: Stores photo references, not URLs
- **Impact**: No API key in response data

#### 6. Frontend Photo Loading
- **New Files**:
  - `src/lib/common/photo-utils.ts`: Fetch helper function
  - `src/lib/common/use-photo.ts`: React hook for photo loading
  - `src/components/common/PhotoImage.tsx`: Reusable photo component

- **Updated Components**:
  - `src/components/map/AttractionsPanel.tsx`
  - `src/components/map/AttractionDetailsDialog.tsx`
  - `src/components/map/PhotoLightbox.tsx`
  - `src/components/PhotoLightbox.tsx`
  - `src/components/map/PlaceSuggestionItem.tsx`
  - `src/components/map/PlaceSuggestionsButton.tsx`

#### 7. Runtime Configuration
- **File**: `src/infrastructure/common/runtime.ts`
- **Change**: Added `PhotoCacheLayer` to application runtime

## How It Works

### Old Flow (Expensive):
```
1. GoogleMapsClient.nearbySearch() → Returns attractions with photo URLs containing API key
2. Browser displays: <img src="https://maps.googleapis.com/.../photo?key=YOUR_API_KEY">
3. Every page load/refresh = new API calls
4. Cost: ~$7 per 1000 photo loads
```

### New Flow (Cost-Effective):
```
1. GoogleMapsClient.nearbySearch() → Returns attractions with photo REFERENCES only
2. Browser renders: <PhotoImage photoReference="xyz...">
3. PhotoImage hook calls: POST /api/photos { photoReference: "xyz..." }
4. Server checks cache → If hit: return cached, If miss: fetch from Google + cache
5. Cost: ~$7 per 1000 UNIQUE photos (first load only, then cached for 48h)
```

## Expected Impact

### Cost Reduction
- **Before**: Every photo view = 1 API call
- **After**: Only first view of each unique photo = 1 API call
- **Savings**: ~90-95% reduction in photo API calls

### Performance
- **First Load**: Slightly slower (photo fetch is separate)
- **Subsequent Loads**: Much faster (served from cache)
- **Network**: Reduced browser bandwidth (cached server-side)

### Security
- API key no longer exposed to browser
- Photos served through controlled backend endpoint

## Testing Instructions

### 1. Test Photo Display in List View
- Navigate to `/map`
- Add a location
- Verify attractions list shows photo thumbnails
- Check browser network tab: should see POST requests to `/api/photos`
- Verify NO requests to `maps.googleapis.com` for photos

### 2. Test Photo Caching
- View an attraction with photos
- Close and reopen the attraction
- Check network tab: second load should be instant (cached)
- Verify cache headers in response: `Cache-Control: public, max-age=172800`

### 3. Test Detail View Photos
- Click on an attraction
- Verify photos load in the detail dialog
- Click on a photo to open lightbox
- Verify navigation between photos works
- Check all photos load correctly

### 4. Test AI Suggestions Photos
- Use "Get AI Suggestions" button
- Verify suggestion cards show photos
- Test photo lightbox from suggestions
- Verify photos load correctly

### 5. Test Error Handling
- Check browser console for any errors
- Verify broken photo references are handled gracefully
- Test with slow network connection

### 6. Verify API Usage Reduction
- Check Google Cloud Console after 24 hours
- Compare Places API Photo requests to previous days
- Should see ~90% reduction in photo API calls

## Monitoring

### Check These Metrics:
1. **Google Cloud Console → Places API → Metrics**
   - Photo requests per day
   - Should drop from ~12k to ~1-2k per day

2. **Server Logs**
   - Photo cache hit rate
   - Photo fetch errors

3. **Browser Performance**
   - Photo load times
   - Network waterfall for photo requests

## Rollback Plan (If Needed)

If issues arise, you can temporarily disable photos by:
1. Comment out photo rendering in `PhotoImage.tsx`
2. Or set `includePhotos` to `false` in all API calls
3. Or revert the entire branch

## Files Changed Summary

### New Files (9):
- `src/infrastructure/map/cache/PhotoCache.ts`
- `src/application/map/photos/GetPhoto.ts`
- `src/application/map/photos/inputs.ts`
- `src/application/map/photos/outputs.ts`
- `src/application/map/photos/index.ts`
- `src/pages/api/photos.ts`
- `src/lib/common/photo-utils.ts`
- `src/lib/common/use-photo.ts`
- `src/components/common/PhotoImage.tsx`

### Modified Files (12):
- `src/domain/common/models/Place.ts`
- `src/infrastructure/common/google-maps/GoogleMapsClient.ts`
- `src/infrastructure/common/runtime.ts`
- `src/infrastructure/map/cache/index.ts`
- `src/components/map/AttractionsPanel.tsx`
- `src/components/map/AttractionDetailsDialog.tsx`
- `src/components/map/PhotoLightbox.tsx`
- `src/components/PhotoLightbox.tsx`
- `src/components/map/PlaceSuggestionItem.tsx`
- `src/components/map/PlaceSuggestionsButton.tsx`

## Next Steps

1. ✅ All code changes complete
2. ⏳ Deploy to staging/production
3. ⏳ Monitor API usage for 24-48 hours
4. ⏳ Verify cost reduction in billing
5. ⏳ Consider increasing cache TTL if needed (currently 48h)

