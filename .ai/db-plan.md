# TripGenie Database Schema

## Overview

This schema implements a hybrid architecture combining:
- **Normalized tables** for cacheable reference data (places, attractions)
- **JSONB columns** for flexible, embedded structures (messages, trip places)
- **Supabase Auth** for user management

This design optimizes for:
- API call efficiency through persistent caching
- Data reuse across trips and users
- Simple atomic updates for auto-save
- Easy migration from localStorage

---

## 1. Tables

### 1.1 user_personas

Stores persona preferences per user (user context, not conversation-specific).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | User identifier from Supabase Auth |
| persona_types | JSONB | NOT NULL, DEFAULT '["general_tourist"]' | Array of selected persona types |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last modification timestamp |

**Purpose:** Store user's selected persona preferences that persist across sessions. Conversations snapshot these at creation time.

**Valid persona types:**
- `general_tourist`
- `nature_lover`
- `art_enthusiast`
- `foodie_traveler`
- `adventure_seeker`
- `digital_nomad`
- `history_buff`
- `photography_enthusiast`

**Example:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "persona_types": ["foodie_traveler", "adventure_seeker"],
  "created_at": "2025-11-09T14:30:00Z",
  "updated_at": "2025-11-09T14:30:00Z"
}
```

---

### 1.2 conversations

Stores chat conversations with messages embedded as JSONB.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique conversation identifier |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Owner of the conversation |
| title | TEXT | NOT NULL | Conversation title |
| personas | JSONB | NOT NULL, DEFAULT '["general_tourist"]' | Persona snapshot at creation time |
| messages | JSONB | NOT NULL, DEFAULT '[]' | Array of message objects |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last modification timestamp |

**Purpose:** Store complete conversation history with AI chat. Messages are embedded for atomic updates and simple loading.

**Message structure (JSONB):**
```json
[
  {
    "id": "msg-uuid",
    "role": "user|assistant|system",
    "content": "text content",
    "timestamp": "2025-11-09T14:30:00Z",
    "suggestedPlaces": [
      {
        "place_id": "ChIJ...",
        "name": "Paris, France",
        "reason": "Iconic destination with rich culture..."
      }
    ],
    "thinkingProcess": ["step 1", "step 2"]
  }
]
```

**Loading strategy:** Entire conversation loaded at once (no pagination for MVP).

---

### 1.3 places

Normalized cache table for Google Maps place data (cities, landmarks, districts, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Internal place identifier |
| google_place_id | TEXT | UNIQUE NOT NULL | Google Maps Place ID |
| name | TEXT | NOT NULL | Place name |
| latitude | FLOAT | NOT NULL, CHECK (latitude >= -90 AND latitude <= 90) | Latitude coordinate |
| longitude | FLOAT | NOT NULL, CHECK (longitude >= -180 AND longitude <= 180) | Longitude coordinate |
| photos | JSONB | | Array of photo references from Google Maps |
| validation_status | TEXT | CHECK (validation_status IN ('verified', 'not_found', 'partial')) | Validation status from Google Maps |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last modification timestamp |
| last_updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last API data refresh timestamp |

**Purpose:**
- Cache Google Maps API responses to minimize API calls
- Enable data reuse when same place appears in multiple trips
- Track validation status and data freshness (7-day refresh policy)

**Example:**
```json
{
  "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "google_place_id": "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
  "name": "Paris, France",
  "latitude": 48.856614,
  "longitude": 2.3522219,
  "photos": [{"photoReference": "AeJxP123...", "width": 1600, "height": 1200}],
  "validation_status": "verified",
  "last_updated_at": "2025-11-09T14:30:00Z"
}
```

---

### 1.4 attractions

Normalized cache table for attractions AND restaurants from Google Maps API.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Internal attraction identifier |
| google_place_id | TEXT | UNIQUE NOT NULL | Google Maps Place ID |
| type | TEXT | NOT NULL, CHECK (type IN ('attraction', 'restaurant')) | Attraction or restaurant |
| name | TEXT | NOT NULL | Attraction/restaurant name |
| rating | FLOAT | | Google Maps rating (0-5) |
| user_ratings_total | INTEGER | | Number of user ratings |
| types | JSONB | | Array of Google Maps place types |
| vicinity | TEXT | | Address or vicinity description |
| price_level | INTEGER | CHECK (price_level >= 0 AND price_level <= 4) | Price level (0-4) |
| latitude | FLOAT | NOT NULL, CHECK (latitude >= -90 AND latitude <= 90) | Latitude coordinate |
| longitude | FLOAT | NOT NULL, CHECK (longitude >= -180 AND longitude <= 180) | Longitude coordinate |
| photos | JSONB | | Array of photo objects from Google Maps |
| quality_score | FLOAT | | Calculated quality score |
| diversity_score | FLOAT | | Calculated diversity score |
| confidence_score | FLOAT | | Calculated confidence score |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last modification timestamp |
| last_updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last API data refresh timestamp |

**Purpose:**
- Cache expensive Google Maps API responses for attractions and restaurants
- Enable reuse of popular attractions across multiple users/trips
- Store calculated scoring metrics (quality, diversity, confidence)

**Example:**
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
  "latitude": 48.858370,
  "longitude": 2.294481,
  "photos": [{"photoReference": "AeJxP...", "width": 1600, "height": 1200}],
  "quality_score": 0.95,
  "diversity_score": 0.87,
  "confidence_score": 0.92,
  "last_updated_at": "2025-11-09T14:30:00Z"
}
```

---

### 1.5 trips

Stores user trip plans with embedded JSONB references to places and attractions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique trip identifier |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Owner of the trip |
| conversation_id | UUID | UNIQUE, REFERENCES conversations(id) ON DELETE SET NULL | Optional link to source conversation |
| title | TEXT | NOT NULL | Trip title (format: "Trip Plan - YYYY-MM-DD HH:MM") |
| places_data | JSONB | NOT NULL, DEFAULT '[]' | Array of place references with planned items |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last modification timestamp |

**Purpose:**
- Store user's trip plans with ordered places
- Embed references to places and planned attractions/restaurants
- Enable atomic updates for auto-save functionality

**places_data structure (JSONB):**
```json
[
  {
    "placeId": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "displayOrder": 0,
    "attractionIds": [
      "b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e",
      "c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f"
    ],
    "restaurantIds": [
      "d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a"
    ]
  }
]
```

**Auto-save:** Entire `places_data` JSONB replaced atomically on each save with 500ms debounce on client side.

**Loading strategy:** Batch join places and attractions via UUID arrays extracted from `places_data`.

---

## 2. Relationships

```
auth.users (Supabase Auth)
  │
  ├─→ user_personas (1:1)
  │     └─→ persona_types: JSONB array
  │
  ├─→ conversations (1:N)
  │     ├─→ personas: JSONB snapshot
  │     ├─→ messages: JSONB array
  │     └─→ trips (1:0..1) via conversation_id (unique constraint)
  │
  └─→ trips (1:N)
        ├─→ conversation_id: UUID (nullable, unique)
        └─→ places_data: JSONB array
              ├─→ placeId → places.id (N:1)
              ├─→ attractionIds → attractions.id (N:N)
              └─→ restaurantIds → attractions.id (N:N)

places (normalized cache)
  └─→ Referenced by trips.places_data[].placeId

attractions (normalized cache)
  └─→ Referenced by trips.places_data[].attractionIds/restaurantIds
```

### Cardinality

- **User → Personas**: 1:1 (one record per user with JSONB array)
- **User → Conversations**: 1:N (user owns many conversations)
- **User → Trips**: 1:N (user owns many trips)
- **Conversation → Trip**: 1:0..1 (conversation can have at most one trip, enforced by unique constraint on `trips.conversation_id`)
- **Trip → Places**: N:N via JSONB references (trips reference place UUIDs in `places_data`)
- **Trip → Attractions**: N:N via JSONB references (trips reference attraction UUIDs in `places_data`)

---

## 3. Indexes

### 3.1 User-Scoped Query Indexes

**Purpose:** Optimize primary user flows (conversation history, trip history).

```sql
-- Conversations list page
CREATE INDEX idx_conversations_user_id
  ON conversations(user_id, created_at DESC);

-- Trip history page
CREATE INDEX idx_trips_user_id
  ON trips(user_id, created_at DESC);
```

---

### 3.2 Cache Lookup Indexes

**Purpose:** Enable efficient "does this place already exist?" queries before calling Google Maps API.

```sql
-- Check if place exists in cache
CREATE UNIQUE INDEX idx_places_google_place_id
  ON places(google_place_id);

-- Check if attraction exists in cache
CREATE UNIQUE INDEX idx_attractions_google_place_id
  ON attractions(google_place_id);
```

---

### 3.3 Staleness Tracking Indexes

**Purpose:** Support background jobs to refresh old cached data (7-day policy).

```sql
-- Find stale places that need refreshing
CREATE INDEX idx_places_last_updated
  ON places(last_updated_at);

-- Find stale attractions that need refreshing
CREATE INDEX idx_attractions_last_updated
  ON attractions(last_updated_at);
```

---

### 3.4 Relationship Enforcement Indexes

**Purpose:** Enforce one-to-one conversation-trip relationship at database level.

```sql
-- Enforce one-to-one conversation-trip relationship
CREATE UNIQUE INDEX idx_trips_conversation_id
  ON trips(conversation_id)
  WHERE conversation_id IS NOT NULL;
```

---

## 4. PostgreSQL Policies (Row Level Security)

**Row Level Security (RLS)** policies:

```sql
-- Enable RLS on all user tables
ALTER TABLE user_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Users can only access their own personas
CREATE POLICY "Users can manage their own personas"
  ON user_personas
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only access their own conversations
CREATE POLICY "Users can manage their own conversations"
  ON conversations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only access their own trips
CREATE POLICY "Users can manage their own trips"
  ON trips
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Places and attractions are globally readable (shared cache)
CREATE POLICY "Places are globally readable"
  ON places
  FOR SELECT
  USING (true);

CREATE POLICY "Attractions are globally readable"
  ON attractions
  FOR SELECT
  USING (true);
```

---

## 5. Design Decisions & Notes

### 5.1 Architecture Choices

#### Hybrid Normalized + JSONB Architecture

**Rationale:**
- **Normalized tables** (`places`, `attractions`) for cacheable reference data enable efficient API caching and data reuse across trips and users
- **JSONB columns** (`messages`, `places_data`) for flexible, embedded structures enable atomic updates and mirror localStorage structure for easy migration
- **Best of both worlds:** Normalized data for caching, JSONB for relationships

#### Single `attractions` Table for Attractions + Restaurants

**Rationale:**
- Both share identical schema (name, rating, location, photos, scores)
- Discriminated by `type` column ('attraction' or 'restaurant')
- Simplifies queries and reduces table count
- Allows type filtering via `WHERE type = 'attraction'`

#### JSONB Message Storage in Conversations

**Rationale:**
- Atomic updates (entire message array replaced)
- No pagination needed for MVP (conversations stay reasonably short)
- Simpler queries (no joins required to load conversation)
- Matches existing localStorage structure for easy migration

#### JSONB Places Storage in Trips

**Rationale:**
- Simple atomic updates for auto-save (entire array replaced)
- Maintains display order without complex sorting queries
- Embeds planned attractions/restaurants within place context
- Easy to implement 500ms debounced auto-save

---

### 5.2 Data Types

#### FLOAT for Coordinates (not DECIMAL)

**Rationale:**
- Sufficient precision for mapping applications (±0.00001° ≈ 1.1 meters)
- Smaller storage footprint than DECIMAL(10,8)
- Faster arithmetic operations
- CHECK constraints enforce valid ranges: latitude `[-90, 90]`, longitude `[-180, 180]`

#### TEXT for Content (not VARCHAR)

**Rationale:**
- No length limit (important for AI responses and conversations)
- PostgreSQL internally handles TEXT and VARCHAR identically
- Simpler schema (no arbitrary length decisions)

#### JSONB for Arrays and Objects

**Rationale:**
- Efficient binary storage (faster than JSON)
- Supports indexing and querying (if needed later)
- Schema flexibility (personas, photos, messages)
- Native PostgreSQL support for JSON operations

---

### 5.3 Timestamp Management

#### Application Layer Updates (No Triggers)

**Rationale:**
- Explicit `updated_at = NOW()` in UPDATE queries
- No hidden side effects from database triggers
- Easier to understand and debug
- Simpler schema maintenance

**Example:**
```sql
UPDATE trips
SET
  places_data = $1,
  updated_at = NOW()
WHERE id = $2;
```

#### 7-Day Cache Freshness Policy

**Rationale:**
- Balance between API cost and data freshness
- `last_updated_at` timestamp tracks last API refresh
- Background job can identify and refresh stale data
- Fallback to cached data if API unavailable

---

### 5.4 Security Decisions

#### No RLS for MVP

**Rationale:**
- Simpler initial implementation
- Application layer filtering by `user_id` sufficient for single-user flows
- Can add RLS policies later when needed (collaboration features, sharing)
- All foreign keys use `ON DELETE CASCADE` for data cleanup

#### CHECK Constraints for Data Validation

**Rationale:**
- Database-level enforcement of valid data ranges
- Prevents invalid coordinates, price levels, validation statuses
- Complements application-layer Zod validation
- Ensures data integrity even if application layer fails

---

### 5.5 Performance Optimizations

#### API Call Minimization

**Cache-first strategy:**
1. Check database cache (`places`, `attractions`)
2. If missing or stale (> 7 days), fetch from API
3. UPSERT to cache
4. Reuse cached data across trips and users

**Benefits:**
- Reduced API costs (Google Maps API is expensive)
- Faster response times (database faster than API)
- Offline capability (fallback to cached data)

#### Strategic Indexing

**User-scoped indexes** optimize common user flows:
- `(user_id, created_at DESC)` for conversation/trip history

**Cache lookup indexes** enable efficient existence checks:
- Unique index on `google_place_id` for O(1) cache lookups

**Staleness tracking** supports background refresh jobs:
- Index on `last_updated_at` for identifying old cache entries

#### Auto-Save Optimization

**Client-side debouncing:**
- 500ms debounce batches rapid changes
- Reduces database write operations
- Optimistic UI updates for instant feedback

**Atomic JSONB updates:**
- Entire `places_data` array replaced (no partial updates)
- Simpler than managing JOIN table updates
- Acceptable for typical trip sizes (< 50 places)

---

### 5.6 Migration from localStorage

#### Current localStorage Keys

```javascript
const STORAGE_KEYS = {
  PERSONAS: "trip-planner:personas",
  CURRENT_ITINERARY: "trip-planner:current-itinerary",
  TRIP_HISTORY: "trip-planner:trip-history",
  CONVERSATIONS: "trip-planner:conversations"
};
```

#### Migration Mapping

| localStorage Key | Database Table | Mapping Strategy |
|------------------|----------------|------------------|
| `personas` | `user_personas.persona_types` | Direct copy to JSONB array |
| `conversations` | `conversations.messages` | Nest messages in JSONB |
| `trip-history` | `trips` + `places` + `attractions` | Normalize places/attractions, build JSONB references |
| `current-itinerary` | Temporary UI state | Not persisted (session-only) |

#### Migration Process

1. **User authenticates** (required before migration)
2. **Export localStorage data** to JSON
3. **POST to migration endpoint** `/api/migrate`
4. **Server processing:**
   - Insert user personas
   - Insert conversations with embedded messages
   - Extract unique places → insert into `places` table
   - Extract unique attractions → insert into `attractions` table
   - Build `places_data` JSONB with references
   - Insert trips with JSONB references
5. **Clear localStorage** after successful migration
6. **Reload from database** to verify

---

### 5.7 Scalability Considerations

#### Benefits of This Architecture

✅ **API Efficiency** - Check DB cache before calling expensive Google Maps API
✅ **Cost Savings** - Reuse cached place/attraction data across trips and users
✅ **Data Freshness** - 7-day refresh policy ensures reasonably current information
✅ **Simple Updates** - Atomic JSONB replacement (no complex join updates)
✅ **Offline Capability** - Fallback to cached data if API unavailable
✅ **Migration Simplicity** - JSONB structure mirrors localStorage
✅ **Developer Experience** - Fewer tables, simpler queries

#### Tradeoffs Accepted for MVP

⚠️ **No cross-trip analytics** - Can't efficiently query "all trips containing Paris" without JSONB array scan
⚠️ **Partial update complexity** - Entire `places_data` JSONB replaced on save (acceptable for typical trip sizes)
⚠️ **No RLS** - Security enforced at application layer only (can add later)
⚠️ **No message pagination** - Assumes conversations stay reasonably short (< 100 messages)

#### When to Refactor

Consider refactoring to fully normalized schema if:
- Average conversation length exceeds 100 messages → implement message pagination
- Need to search messages across conversations → add full-text search
- Need cross-trip analytics ("which trips include this place?") → normalize trip_places junction table
- Message/trip JSONB size causes performance issues → unlikely for MVP scale
- Need multi-user collaboration features → add sharing tables and RLS policies

---

## 6. Example Queries

### 6.1 Cache Lookup Before API Call

```sql
-- Check if place exists in cache
SELECT id, last_updated_at
FROM places
WHERE google_place_id = 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ';

-- If missing or stale (> 7 days), fetch from API and UPSERT
INSERT INTO places (
  google_place_id, name, latitude, longitude, photos, validation_status, last_updated_at
)
VALUES (
  'ChIJD7fiBh9u5kcRYJSMaMOCCwQ',
  'Paris, France',
  48.856614,
  2.3522219,
  '[{"photoReference": "AeJxP..."}]'::JSONB,
  'verified',
  NOW()
)
ON CONFLICT (google_place_id)
DO UPDATE SET
  name = EXCLUDED.name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  photos = EXCLUDED.photos,
  validation_status = EXCLUDED.validation_status,
  last_updated_at = NOW(),
  updated_at = NOW()
RETURNING id;
```

---

### 6.2 Load Trip with All Places and Attractions

```sql
-- Step 1: Load trip
SELECT id, title, conversation_id, places_data, created_at, updated_at
FROM trips
WHERE id = 'trip-uuid' AND user_id = 'user-uuid';

-- Step 2: Extract place IDs from places_data JSONB
-- (done in application layer)

-- Step 3: Batch load places
SELECT *
FROM places
WHERE id = ANY(ARRAY['place-uuid-1', 'place-uuid-2', ...]::UUID[]);

-- Step 4: Batch load attractions
SELECT *
FROM attractions
WHERE id = ANY(ARRAY['attraction-uuid-1', 'attraction-uuid-2', ...]::UUID[]);

-- Step 5: Map back to full trip structure (in application layer)
```

---

### 6.3 Auto-Save Trip Update

```sql
-- UPSERT trip (insert or update)
INSERT INTO trips (
  id, user_id, conversation_id, title, places_data
)
VALUES (
  'trip-uuid',
  'user-uuid',
  'conversation-uuid',
  'Trip Plan - 2025-11-09 14:30',
  '[{"placeId": "...", "displayOrder": 0, "attractionIds": [...], "restaurantIds": [...]}]'::JSONB
)
ON CONFLICT (id)
DO UPDATE SET
  places_data = EXCLUDED.places_data,
  updated_at = NOW()
RETURNING id, updated_at;
```

---

### 6.4 User Trip History

```sql
-- Load user's trip history (most recent first)
SELECT id, title, created_at, updated_at,
       jsonb_array_length(places_data) AS place_count
FROM trips
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 50;
```

---

### 6.5 Find Stale Cache Entries

```sql
-- Find places needing refresh (> 7 days old)
SELECT id, google_place_id, name, last_updated_at
FROM places
WHERE last_updated_at < NOW() - INTERVAL '7 days'
ORDER BY last_updated_at ASC
LIMIT 100;

-- Find attractions needing refresh (> 7 days old)
SELECT id, google_place_id, name, type, last_updated_at
FROM attractions
WHERE last_updated_at < NOW() - INTERVAL '7 days'
ORDER BY last_updated_at ASC
LIMIT 100;
```

---

## 7. SQL Schema Definition

### Complete DDL

```sql
-- ============================================================================
-- TripGenie Database Schema
-- ============================================================================

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE: user_personas
-- ============================================================================
CREATE TABLE user_personas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_types JSONB NOT NULL DEFAULT '["general_tourist"]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: conversations
-- ============================================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  personas JSONB NOT NULL DEFAULT '["general_tourist"]',
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: places
-- ============================================================================
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  latitude FLOAT NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude FLOAT NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  photos JSONB,
  validation_status TEXT CHECK (validation_status IN ('verified', 'not_found', 'partial')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: attractions
-- ============================================================================
CREATE TABLE attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('attraction', 'restaurant')),
  name TEXT NOT NULL,
  rating FLOAT,
  user_ratings_total INTEGER,
  types JSONB,
  vicinity TEXT,
  price_level INTEGER CHECK (price_level >= 0 AND price_level <= 4),
  latitude FLOAT NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude FLOAT NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  photos JSONB,
  quality_score FLOAT,
  diversity_score FLOAT,
  confidence_score FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: trips
-- ============================================================================
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID UNIQUE REFERENCES conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  places_data JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User-scoped query indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id, created_at DESC);
CREATE INDEX idx_trips_user_id ON trips(user_id, created_at DESC);

-- Cache lookup indexes
CREATE UNIQUE INDEX idx_places_google_place_id ON places(google_place_id);
CREATE UNIQUE INDEX idx_attractions_google_place_id ON attractions(google_place_id);

-- Staleness tracking indexes
CREATE INDEX idx_places_last_updated ON places(last_updated_at);
CREATE INDEX idx_attractions_last_updated ON attractions(last_updated_at);

-- Relationship enforcement index
CREATE UNIQUE INDEX idx_trips_conversation_id ON trips(conversation_id)
  WHERE conversation_id IS NOT NULL;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE user_personas IS 'Stores user persona preferences that persist across sessions';
COMMENT ON TABLE conversations IS 'Stores chat conversations with AI, messages embedded as JSONB';
COMMENT ON TABLE places IS 'Normalized cache for Google Maps place data (cities, landmarks, etc.)';
COMMENT ON TABLE attractions IS 'Normalized cache for Google Maps attractions and restaurants';
COMMENT ON TABLE trips IS 'Stores user trip plans with JSONB references to places and attractions';

COMMENT ON COLUMN places.last_updated_at IS 'Last API data refresh timestamp (7-day refresh policy)';
COMMENT ON COLUMN attractions.last_updated_at IS 'Last API data refresh timestamp (7-day refresh policy)';
COMMENT ON COLUMN trips.places_data IS 'JSONB array: [{"placeId": "uuid", "displayOrder": 0, "attractionIds": [...], "restaurantIds": [...]}]';
COMMENT ON COLUMN conversations.messages IS 'JSONB array: [{"id": "uuid", "role": "user|assistant", "content": "...", "timestamp": "...", "suggestedPlaces": [...]}]';
```

---

## Summary

This schema is production-ready for MVP implementation with:
- ✅ Clear separation between cacheable data (normalized) and user data (JSONB)
- ✅ Efficient API caching strategy (7-day refresh policy)
- ✅ Simple atomic updates for auto-save
- ✅ Strategic indexing for common queries
- ✅ Data validation via CHECK constraints
- ✅ Easy migration path from localStorage
- ✅ Security via application layer filtering (RLS deferred for MVP)
- ✅ Scalability through normalized cache tables and JSONB flexibility

Ready for Supabase migration creation and TypeScript type generation.