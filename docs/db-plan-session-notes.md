# Database Planning Summary

This document contains the complete database planning decisions and schema design for the Trip Planner MVP.

## Decisions Made

1. **Use Supabase Auth's built-in users table** - Do not create a custom users table; rely on `auth.users` provided by Supabase
2. **user_personas structure** - Single record per user with `persona_types JSONB` array instead of multiple records per persona
3. **Coordinate data types** - Use `FLOAT` for latitude/longitude instead of `DECIMAL(10,8)` and `DECIMAL(11,8)`
4. **Row Level Security (RLS)** - Skip RLS policies for MVP; handle security at application layer
5. **Denormalized counts** - Calculate message counts and place counts on application side instead of storing in database with triggers
6. **Messages storage** - Embed messages as JSONB array inside `conversations` table instead of separate `messages` table
7. **Trip places storage** - Embed places as JSONB array with references inside `trips` table instead of separate `trip_places` junction table
8. **Planned items storage** - Embed planned attractions/restaurants within the place objects in trips JSONB instead of separate `planned_items` table
9. **Places table normalization** - Keep separate normalized `places` table to cache Google Maps API data and enable reuse across trips
10. **Attractions table normalization** - Keep separate normalized `attractions` table to cache API data
11. **Attractions vs Restaurants** - Single `attractions` table with `type` column (`'attraction'` or `'restaurant'`) instead of separate tables
12. **Index strategy** - Add unique indexes on `google_place_id` columns for efficient cache lookups
13. **Data freshness strategy** - Add `last_updated_at` timestamp; refresh data from API if older than 30 days
14. **API caching strategy** - Store ALL Google Maps API data in database to minimize API calls and enable offline fallback
15. **Auto-save implementation** - Update entire trip object (atomic JSONB replacement) with 500ms debounce on client side
16. **Conversation loading** - Load entire conversation at once (no message pagination needed for MVP)
17. **Message search** - No search/filter functionality needed; only chronological display
18. **Cross-trip queries** - No analytics across trips needed; only view trips individually
19. **Conversation-trip relationship** - Enforce one-to-one relationship at database level with unique constraint on `trips.conversation_id`
20. **Personas storage** - Store in user context table (`user_personas`), not per-conversation; conversations snapshot personas at creation time
21. **Timestamp management** - Handle `updated_at` at application layer (set `updated_at = NOW()` on UPDATE) instead of using database triggers

## Key Recommendations Applied

1. **Enforce one-to-one conversation-trip relationship at database level** - Use unique constraint on `trips.conversation_id` (nullable) to prevent data integrity issues
2. **Create separate places and attractions tables** - Enable data reuse across multiple trips, API response caching, and efficient updates
3. **Use FLOAT with CHECK constraints for coordinates** - Latitude: `>= -90 AND <= 90`, Longitude: `>= -180 AND <= 180`
4. **Store personas as JSONB** - Use `JSONB` for `persona_types` in `user_personas` and personas snapshot in `conversations`
5. **Message content as TEXT with JSONB metadata** - Use TEXT for unlimited content, JSONB for suggested places and thinking process
6. **Strategic indexing for common queries** - User-scoped indexes on `user_id` with timestamp DESC for conversations and trips
7. **Unique index on google_place_id** - Enable efficient "does this exist?" cache lookups before calling Google Maps API
8. **30-day staleness detection** - Use `last_updated_at` with index to identify and refresh old cached data
9. **Auto-update timestamps at application layer** - Explicitly set `updated_at = NOW()` on every UPDATE operation (simpler than triggers)
10. **UPSERT operations for auto-save** - Use `INSERT ... ON CONFLICT DO UPDATE` for trip updates to handle concurrent saves
11. **Debounced client-side saves** - 500ms debounce to batch rapid changes and reduce database writes
12. **Hybrid normalized + JSONB architecture** - Normalize reference data (places, attractions) while using JSONB for relationships and embedded data

---

## Database Schema Design

### Architecture Overview

The database schema uses a **hybrid architecture** combining:

- **Normalized tables** for cacheable reference data (places, attractions)
- **JSONB columns** for flexible, embedded structures (messages, trip places)
- **Supabase Auth** for user management

This design optimizes for:

- API call efficiency (persistent cache)
- Data reuse across trips
- Simple atomic updates
- Easy migration from localStorage

---

## Tables

### 1. user_personas

Stores persona preferences per user (user context, not conversation-specific).

**Columns:**

- `user_id`: UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
- `persona_types`: JSONB NOT NULL DEFAULT '["general_tourist"]'
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Purpose:** Store user's selected persona preferences that persist across sessions. Conversations snapshot these at creation time.

**Example data:**

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "persona_types": ["foodie", "adventure_seeker"],
  "created_at": "2025-11-09T14:30:00Z",
  "updated_at": "2025-11-09T14:30:00Z"
}
```

---

### 2. conversations

Stores chat conversations with messages embedded as JSONB.

**Columns:**

- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id`: UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- `title`: TEXT NOT NULL
- `personas`: JSONB NOT NULL DEFAULT '["general_tourist"]' (snapshot at creation)
- `messages`: JSONB NOT NULL DEFAULT '[]' (array of message objects)
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Message structure in JSONB:**

```json
[
  {
    "id": "uuid",
    "role": "user|assistant|system",
    "content": "text content",
    "timestamp": "2025-11-09T14:30:00Z",
    "suggestedPlaces": [
      {
        "place_id": "ChIJ...",
        "name": "Eiffel Tower",
        "reason": "Iconic landmark..."
      }
    ],
    "thinkingProcess": [
      /* array of thinking steps */
    ]
  }
]
```

**Loading strategy:** Entire conversation loaded at once (no pagination for MVP).

---

### 3. places

Normalized cache table for Google Maps place data.

**Columns:**

- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `google_place_id`: TEXT UNIQUE NOT NULL
- `name`: TEXT NOT NULL
- `latitude`: FLOAT NOT NULL CHECK (latitude >= -90 AND latitude <= 90)
- `longitude`: FLOAT NOT NULL CHECK (longitude >= -180 AND longitude <= 180)
- `photos`: JSONB (array of photo references)
- `validation_status`: TEXT CHECK (validation_status IN ('verified', 'not_found', 'partial'))
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `last_updated_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes:**

- `CREATE UNIQUE INDEX idx_places_google_place_id ON places(google_place_id);`
- `CREATE INDEX idx_places_last_updated ON places(last_updated_at);`

**Purpose:**

- Cache Google Maps API responses to minimize API calls
- Enable data reuse when same place appears in multiple trips
- Track validation status and data freshness

**Example data:**

```json
{
  "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "google_place_id": "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
  "name": "Paris, France",
  "latitude": 48.856614,
  "longitude": 2.3522219,
  "photos": [{ "photoReference": "AeJxP..." }],
  "validation_status": "verified",
  "last_updated_at": "2025-11-09T14:30:00Z"
}
```

---

### 4. attractions

Normalized cache table for attractions AND restaurants from Google Maps API.

**Columns:**

- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `google_place_id`: TEXT UNIQUE NOT NULL
- `type`: TEXT NOT NULL CHECK (type IN ('attraction', 'restaurant'))
- `name`: TEXT NOT NULL
- `rating`: FLOAT
- `user_ratings_total`: INTEGER
- `types`: JSONB (array of place type strings)
- `vicinity`: TEXT
- `price_level`: INTEGER CHECK (price_level >= 0 AND price_level <= 4)
- `latitude`: FLOAT NOT NULL CHECK (latitude >= -90 AND latitude <= 90)
- `longitude`: FLOAT NOT NULL CHECK (longitude >= -180 AND longitude <= 180)
- `photos`: JSONB (array of photo objects)
- `quality_score`: FLOAT
- `diversity_score`: FLOAT
- `confidence_score`: FLOAT
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `last_updated_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes:**

- `CREATE UNIQUE INDEX idx_attractions_google_place_id ON attractions(google_place_id);`
- `CREATE INDEX idx_attractions_last_updated ON attractions(last_updated_at);`

**Purpose:**

- Cache expensive Google Maps API responses for attractions and restaurants
- Enable reuse of popular attractions across multiple users/trips
- Track scoring metrics (quality, diversity, confidence)

**Example data:**

```json
{
  "id": "b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e",
  "google_place_id": "ChIJLU7jZClu5kcR4PcOOO6p3I0",
  "type": "attraction",
  "name": "Eiffel Tower",
  "rating": 4.7,
  "user_ratings_total": 234567,
  "types": ["tourist_attraction", "point_of_interest"],
  "vicinity": "Champ de Mars, 5 Avenue Anatole France",
  "price_level": 2,
  "latitude": 48.85837,
  "longitude": 2.294481,
  "photos": [{ "photoReference": "AeJxP...", "width": 1600, "height": 1200 }],
  "quality_score": 0.95,
  "diversity_score": 0.87,
  "confidence_score": 0.92,
  "last_updated_at": "2025-11-09T14:30:00Z"
}
```

---

### 5. trips

Stores user trip plans with embedded JSONB references to places/attractions.

**Columns:**

- `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id`: UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- `conversation_id`: UUID UNIQUE REFERENCES conversations(id) ON DELETE SET NULL
- `title`: TEXT NOT NULL (format: "Trip Plan - YYYY-MM-DD HH:MM")
- `places_data`: JSONB NOT NULL DEFAULT '[]'
- `created_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at`: TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes:**

- `CREATE INDEX idx_trips_user_id ON trips(user_id, created_at DESC);`
- `CREATE UNIQUE INDEX idx_trips_conversation_id ON trips(conversation_id) WHERE conversation_id IS NOT NULL;`

**places_data structure:**

```json
[
  {
    "placeId": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "displayOrder": 0,
    "attractionIds": ["b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e", "c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f"],
    "restaurantIds": ["d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a"]
  }
]
```

**Auto-save:** Entire `places_data` JSONB replaced atomically on each save (500ms debounce on client side).

**Loading strategy:** Batch join places and attractions via UUID arrays extracted from `places_data`.

---

## Entity Relationships

```
auth.users (Supabase Auth)
  |
  +--- user_personas (1:1)
  |      +--- persona_types: JSONB array
  |
  +--- conversations (1:N)
  |      +--- personas: JSONB snapshot
  |      +--- messages: JSONB array
  |      +--- trips (1:0..1) via conversation_id
  |
  +--- trips (1:N)
         +--- conversation_id: UUID (nullable, unique)
         +--- places_data: JSONB
                 +--- placeId -> places.id (N:1)
                 +--- attractionIds -> attractions.id (N:N)
                 +--- restaurantIds -> attractions.id (N:N)

places (normalized cache)
  +--- Referenced by trips.places_data[].placeId

attractions (normalized cache)
  +--- Referenced by trips.places_data[].attractionIds/restaurantIds
```

**Key relationship rules:**

- **User to Personas**: 1:1 (one record per user with JSONB array)
- **User to Conversations**: 1:N (user owns many conversations)
- **User to Trips**: 1:N (user owns many trips)
- **Conversation to Trip**: 1:0..1 (conversation can have at most one trip, enforced by unique constraint)
- **Trip to Places**: N:N via JSONB references (trips reference place UUIDs)
- **Trip to Attractions**: N:N via JSONB references (trips reference attraction UUIDs)

---

## Data Flow & Caching Logic

### Adding a Place to a Trip

```typescript
// 1. Check cache (DB first)
let place = await db.from("places").select("id, last_updated_at").eq("google_place_id", googlePlaceId).single();

// 2. If missing or stale (> 30 days), fetch from API
if (!place || isStale(place.last_updated_at, 30)) {
  const apiData = await googleMapsAPI.getPlaceDetails(googlePlaceId);

  place = await db
    .from("places")
    .upsert({
      google_place_id: googlePlaceId,
      name: apiData.name,
      latitude: apiData.geometry.location.lat,
      longitude: apiData.geometry.location.lng,
      photos: apiData.photos,
      validation_status: "verified",
      last_updated_at: new Date(),
    })
    .select("id")
    .single();
}

// 3. Update trip JSONB
const updatedPlacesData = [
  ...existingPlacesData,
  {
    placeId: place.id,
    displayOrder: nextOrder,
    attractionIds: [],
    restaurantIds: [],
  },
];

await db.from("trips").update({ places_data: updatedPlacesData }).eq("id", tripId);
```

### Adding an Attraction to a Trip Place

```typescript
// 1. Check cache
let attraction = await db
  .from("attractions")
  .select("id, last_updated_at")
  .eq("google_place_id", googlePlaceId)
  .single();

// 2. Fetch if missing/stale
if (!attraction || isStale(attraction.last_updated_at, 30)) {
  const apiData = await googleMapsAPI.getPlaceDetails(googlePlaceId);

  attraction = await db
    .from("attractions")
    .upsert({
      google_place_id: googlePlaceId,
      type: "attraction", // or 'restaurant'
      name: apiData.name,
      rating: apiData.rating,
      user_ratings_total: apiData.user_ratings_total,
      types: apiData.types,
      vicinity: apiData.vicinity,
      price_level: apiData.price_level,
      latitude: apiData.geometry.location.lat,
      longitude: apiData.geometry.location.lng,
      photos: apiData.photos,
      quality_score: calculateQualityScore(apiData),
      diversity_score: calculateDiversityScore(apiData),
      confidence_score: calculateConfidenceScore(apiData),
      last_updated_at: new Date(),
    })
    .select("id")
    .single();
}

// 3. Update trip JSONB (append to attractionIds)
const updatedPlacesData = trip.places_data.map((p) =>
  p.placeId === targetPlaceId ? { ...p, attractionIds: [...p.attractionIds, attraction.id] } : p
);

await db.from("trips").update({ places_data: updatedPlacesData }).eq("id", tripId);
```

### Loading a Trip for Display

```typescript
// 1. Load trip
const trip = await db.from("trips").select("*").eq("id", tripId).single();

// 2. Extract all place/attraction IDs from JSONB
const placeIds = trip.places_data.map((p) => p.placeId);
const attractionIds = trip.places_data.flatMap((p) => [...p.attractionIds, ...p.restaurantIds]);

// 3. Batch load places and attractions
const [places, attractions] = await Promise.all([
  db.from("places").select("*").in("id", placeIds),
  db.from("attractions").select("*").in("id", attractionIds),
]);

// 4. Map back to full trip structure
const placesMap = new Map(places.data.map((p) => [p.id, p]));
const attractionsMap = new Map(attractions.data.map((a) => [a.id, a]));

const fullTrip = {
  id: trip.id,
  title: trip.title,
  conversationId: trip.conversation_id,
  places: trip.places_data
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((pd) => ({
      ...placesMap.get(pd.placeId),
      plannedAttractions: pd.attractionIds.map((id) => attractionsMap.get(id)),
      plannedRestaurants: pd.restaurantIds.map((id) => attractionsMap.get(id)),
    })),
};
```

### Staleness Check Utility

```typescript
function isStale(lastUpdatedAt: Date, maxAgeDays: number): boolean {
  const now = new Date();
  const diffDays = (now.getTime() - lastUpdatedAt.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > maxAgeDays;
}
```

---

## Indexing Strategy

### User-Scoped Queries (Most Common)

```sql
-- Conversations list page
CREATE INDEX idx_conversations_user_id
  ON conversations(user_id, created_at DESC);

-- Trip history page
CREATE INDEX idx_trips_user_id
  ON trips(user_id, created_at DESC);
```

These indexes optimize the primary user flows: viewing conversation history and trip history.

### Cache Lookups (Critical for Performance)

```sql
-- Check if place exists in cache
CREATE UNIQUE INDEX idx_places_google_place_id
  ON places(google_place_id);

-- Check if attraction exists in cache
CREATE UNIQUE INDEX idx_attractions_google_place_id
  ON attractions(google_place_id);
```

These unique indexes enable efficient "does this Google Maps place already exist?" queries before calling the API.

### Staleness Tracking

```sql
-- Find stale places that need refreshing
CREATE INDEX idx_places_last_updated
  ON places(last_updated_at);

-- Find stale attractions that need refreshing
CREATE INDEX idx_attractions_last_updated
  ON attractions(last_updated_at);
```

These indexes support background jobs to refresh old cached data.

### Relationship Enforcement

```sql
-- Enforce one-to-one conversation-trip relationship
CREATE UNIQUE INDEX idx_trips_conversation_id
  ON trips(conversation_id)
  WHERE conversation_id IS NOT NULL;
```

This partial unique index ensures a conversation can link to at most one trip.

---

## Timestamp Management

### Updated Timestamps (Application Layer)

Instead of using database triggers, `updated_at` timestamps are managed at the application layer by explicitly setting `updated_at = NOW()` on every UPDATE operation.

**Example UPDATE queries:**

```sql
-- Update trip
UPDATE trips
SET
  places_data = $1,
  updated_at = NOW()
WHERE id = $2;

-- Update conversation
UPDATE conversations
SET
  messages = $1,
  updated_at = NOW()
WHERE id = $2;

-- Update place (cache refresh)
UPDATE places
SET
  name = $1,
  latitude = $2,
  longitude = $3,
  photos = $4,
  last_updated_at = NOW(),
  updated_at = NOW()
WHERE google_place_id = $5;
```

**Benefits:**

- Simpler schema (no triggers to maintain)
- More explicit (UPDATE statements clearly show timestamp updates)
- Easier to understand and debug
- No hidden side effects

---

## Auto-Save Implementation

### Client-Side (Debounced)

```typescript
import { debounce } from "lodash";

const saveTrip = debounce(async (trip: SavedTrip) => {
  try {
    await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trip),
    });
  } catch (error) {
    console.error("Auto-save failed:", error);
    // Show error toast to user
  }
}, 500); // 500ms debounce

// Usage
function addAttractionToPlace(tripId, placeId, attraction) {
  // Update local state immediately (optimistic update)
  const updatedTrip = updateLocalTripState(tripId, placeId, attraction);

  // Trigger debounced save
  saveTrip(updatedTrip);
}
```

### Server-Side (UPSERT)

```typescript
// API route: POST /api/trips
export async function POST({ request, locals }) {
  const trip = await request.json();
  const userId = locals.user.id;

  // Validate input with Zod
  const validatedTrip = TripSchema.parse(trip);

  // UPSERT trip (insert or update)
  const { data, error } = await locals.supabase
    .from("trips")
    .upsert({
      id: validatedTrip.id,
      user_id: userId,
      title: validatedTrip.title,
      places_data: validatedTrip.places_data,
      conversation_id: validatedTrip.conversation_id,
    })
    .select("id, updated_at")
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
  });
}
```

---

## Performance & Scalability

### Benefits of This Architecture

✅ **API Efficiency** - Check DB cache before calling expensive Google Maps API
✅ **Cost Savings** - Reuse cached place/attraction data across trips and users
✅ **Data Freshness** - 30-day refresh policy ensures reasonably current information
✅ **Simple Updates** - Atomic JSONB replacement (no complex join updates or partial updates)
✅ **Offline Capability** - Fallback to cached data if API unavailable
✅ **Migration Simplicity** - JSONB structure mirrors localStorage for easy migration
✅ **Developer Experience** - Fewer tables, simpler queries, matches existing mental model

### Tradeoffs Accepted for MVP

⚠️ **No cross-trip analytics** - Can't efficiently query "all trips containing Paris" without JSONB array scan
⚠️ **Partial update complexity** - Entire `places_data` JSONB replaced on save (acceptable for typical trip sizes)
⚠️ **No RLS** - Security enforced at application layer only (can add RLS policies post-MVP)
⚠️ **No message pagination** - Assumes conversations stay reasonably short for MVP (< 100 messages)
⚠️ **Place data duplication in JSONB** - Display order and attraction IDs duplicated per trip (minimal overhead)

### When to Refactor

Consider refactoring to fully normalized schema if:

- Average conversation length exceeds 100 messages (implement message pagination)
- Need to search messages across conversations (add full-text search)
- Need cross-trip analytics ("which trips include this place?")
- Message/trip JSONB size causes performance issues (unlikely for MVP)
- Need multi-user collaboration features (sharing, real-time editing)

---

## Security Considerations

### Deferred for MVP

**Row Level Security (RLS)** - Not implemented initially. Security enforced at application layer:

```typescript
// All queries filtered by user_id
const trips = await supabase.from("trips").select("*").eq("user_id", userId); // Always filter by authenticated user
```

**Future Enhancement:** Add RLS policies when multi-user features are introduced:

```sql
-- Example RLS policy (not implemented in MVP)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own trips"
  ON trips
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Data Validation

**CHECK Constraints:**

- Latitude: `>= -90 AND <= 90`
- Longitude: `>= -180 AND <= 180`
- `validation_status`: `IN ('verified', 'not_found', 'partial')`
- `type`: `IN ('attraction', 'restaurant')`
- `price_level`: `>= 0 AND <= 4`

**UNIQUE Constraints:**

- `google_place_id` in `places` and `attractions` tables (prevents duplicates)
- `conversation_id` in `trips` table (enforces one-to-one relationship)

**Foreign Key Constraints:**

- All `user_id` columns reference `auth.users(id)` with `ON DELETE CASCADE`
- `trips.conversation_id` references `conversations(id)` with `ON DELETE SET NULL`

---

## Migration from localStorage

### Current localStorage Structure

```typescript
// Current localStorage keys
const STORAGE_KEYS = {
  PERSONAS: "trip-planner:personas",
  CURRENT_ITINERARY: "trip-planner:current-itinerary",
  TRIP_HISTORY: "trip-planner:trip-history",
  CONVERSATIONS: "trip-planner:conversations",
};
```

### Migration Mapping

| localStorage Key    | Database Table                | Notes                               |
| ------------------- | ----------------------------- | ----------------------------------- |
| `personas`          | `user_personas.persona_types` | Move from browser to user account   |
| `conversations`     | `conversations` table         | Messages nested in JSONB            |
| `trip-history`      | `trips` table                 | Places normalized, JSONB references |
| `current-itinerary` | Temporary UI state            | Not persisted in DB                 |

### Migration Strategy

1. **User authentication** - User must sign in/sign up before migration
2. **Export localStorage** - Read all localStorage data
3. **Upload to API** - POST data to migration endpoint
4. **Server processing:**
   - Insert personas into `user_personas`
   - Insert conversations with embedded messages
   - Insert trips with places normalization:
     - Extract unique places → insert into `places` table
     - Extract unique attractions → insert into `attractions` table
     - Build `places_data` JSONB with references
5. **Clear localStorage** - After successful migration
6. **Verify migration** - Load data from DB to confirm

### Example Migration Code

```typescript
async function migrateUserData() {
  const userId = await getCurrentUserId();

  // 1. Export localStorage
  const personas = JSON.parse(localStorage.getItem("trip-planner:personas"));
  const conversations = JSON.parse(localStorage.getItem("trip-planner:conversations"));
  const trips = JSON.parse(localStorage.getItem("trip-planner:trip-history"));

  // 2. Upload to migration endpoint
  const response = await fetch("/api/migrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personas, conversations, trips }),
  });

  if (response.ok) {
    // 3. Clear localStorage after successful migration
    localStorage.removeItem("trip-planner:personas");
    localStorage.removeItem("trip-planner:conversations");
    localStorage.removeItem("trip-planner:trip-history");

    // 4. Reload from database
    window.location.reload();
  }
}
```

---

## Unresolved Issues

**None** - All major architectural decisions have been finalized for MVP implementation.

The schema is ready for implementation with clear specifications for:

- Table structures and constraints
- Indexing strategy
- Data flow and caching logic
- Auto-save implementation
- Migration from localStorage

---

## Next Steps

1. **Create Supabase migration file** - Generate DDL SQL statements for all tables and indexes
2. **Run migration** - Apply schema to Supabase instance (local + production)
3. **Generate TypeScript types** - Use Supabase CLI to generate types from schema
4. **Implement Supabase client** - Setup client in `src/infrastructure/supabase/`
5. **Create API routes** - CRUD operations for personas, conversations, trips
6. **Build migration utility** - Client-side script to migrate localStorage → database
7. **Update components** - Replace localStorage calls with API calls
8. **Testing** - Verify all flows work with database persistence

---

## References

- **PRD**: `.ai/prd.md`
- **Tech Stack**: `.ai/tech-stack.md`
- **Existing Storage**: `src/lib/common/storage.ts`
- **Supabase Config**: `supabase/config.toml`
