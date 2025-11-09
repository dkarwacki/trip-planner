# Storage Migration Plan: localStorage → PostgreSQL

## Overview

Migrate persistent user data from browser localStorage to PostgreSQL database while keeping transient session data in localStorage for optimal performance.

## Current State

All data is stored in browser localStorage via `src/lib/common/storage.ts`:
- **Personas** - User travel preferences
- **Current Itinerary** - Active work-in-progress places
- **Trip History** - Saved trips with places
- **Conversations** - Chat history with messages

**Problems:**
- Data lost on cache clear or device switch
- No cross-device synchronization
- No backup or data recovery
- Storage limits (~5-10MB)

## Goals

1. Move valuable persistent data to PostgreSQL
2. Keep transient session data in localStorage for performance
3. Enable future multi-device support
4. Maintain existing API compatibility where possible
5. Use Effect-based repositories following existing patterns

## What Moves Where

### ✅ PostgreSQL (Persistent, Multi-Device)

1. **User Personas** → `user_personas` table
   - Travel preferences should persist across sessions
   - Small data size, infrequent updates
   
2. **Trip History** → `trips` table
   - Primary user output - must be reliable
   - Enable search, sharing, backup in future
   
3. **Conversations** → `conversations` table
   - Chat history is valuable for context
   - Users expect conversation history to persist

4. **Place Cache** → `places` table
   - Shared infrastructure for API efficiency
   - Minimizing Google Maps API calls (7-day persistent cache)
   - Fast trip loading (batch queries by UUID)
   - Cross-user data reuse

5. **Attraction Cache** → `attractions` table
   - Shared infrastructure for API efficiency
   - Stores both attractions and restaurants (discriminated by type)
   - Persistent cache with 7-day refresh policy
   - Enables batch loading for trip reconstruction

### 🔵 localStorage (Session State, Fast Access)

1. **Current Itinerary**
   - Temporary scratchpad during planning
   - Zero-latency updates during map interaction
   - Automatically "cleaned up" when user abandons session
   - Only saved to DB when user explicitly saves

## Database Schema (Already Exists)

Tables are already defined in Supabase:

```
user_personas
  - user_id (PK)
  - persona_types (jsonb)
  - created_at, updated_at

conversations
  - id (PK, uuid)
  - user_id
  - title
  - messages (jsonb)
  - personas (jsonb)
  - created_at, updated_at

trips
  - id (PK, uuid)
  - user_id
  - title
  - places_data (jsonb)
  - conversation_id (FK, nullable, one-to-one)
  - created_at, updated_at

places
  - id (PK, uuid)
  - google_place_id (unique)
  - name, latitude, longitude
  - photos (jsonb)
  - validation_status
  - created_at, updated_at, last_updated_at

attractions
  - id (PK, uuid)
  - google_place_id (unique)
  - type (attraction | restaurant)
  - name, rating, user_ratings_total
  - types (jsonb), vicinity, price_level
  - latitude, longitude, photos (jsonb)
  - quality_score, diversity_score, confidence_score
  - created_at, updated_at, last_updated_at
```

## New Infrastructure Components

**Organization by Domain:**
- `src/infrastructure/plan/database/` - User-facing data (conversations, trips, personas)
- `src/infrastructure/map/database/` - Map/cache data (places, attractions)

### 1. DAO Types

#### Plan DAOs (`src/infrastructure/plan/database/types.ts`)

**Purpose:** Type-safe mapping between database rows and domain models

**Contents:**
- `ConversationDAO`, `TripDAO`, `UserPersonasDAO` - camelCase interfaces
- Converter functions: `toConversationInsert`, `toTripInsert`, etc.
- Converter functions: `rowToConversationDAO`, `rowToTripDAO` (snake_case → camelCase)
- Converter functions: `toSavedConversation`, `toSavedTrip` (DAO → domain models)

**Why camelCase:**
- Better TypeScript ergonomics
- Consistent with application code style
- Conversion happens at boundary (types.ts)

#### Map DAOs (`src/infrastructure/map/database/types.ts`)

**Purpose:** Type-safe mapping for cache infrastructure

**Contents:**
- `PlaceDAO`, `AttractionDAO` - camelCase interfaces
- Converter functions: `toPlaceInsert`, `toAttractionInsert`, etc.
- Converter functions: `rowToPlaceDAO`, `rowToAttractionDAO`
- Converter functions for domain models (places, attractions)

### 2. Repositories

#### Plan Repositories (`src/infrastructure/plan/database/repositories.ts`)

**Purpose:** Effect-based data access layer following existing patterns

**Repositories:**

#### ConversationRepository
- `findById(userId, conversationId)` - Get single conversation
- `findAll(userId)` - Get all user conversations (ordered newest first)
- `create(userId, conversation)` - Create new conversation
- `updateMessages(userId, conversationId, messages)` - Update messages
- `delete(userId, conversationId)` - Delete conversation

#### TripRepository
- `findById(userId, tripId)` - Get single trip
- `findAll(userId)` - Get all user trips (ordered newest first)
- `findByConversationId(userId, conversationId)` - Get trip for conversation (one-to-one)
- `create(userId, trip)` - Create new trip
- `updatePlaces(userId, tripId, places)` - Update trip places
- `delete(userId, tripId)` - Delete trip

#### UserPersonasRepository
- `find(userId)` - Get user personas (returns empty array if none)
- `save(userId, personas)` - Upsert user personas

**Error Types:**
- `ConversationNotFoundError`
- `TripNotFoundError`
- `DatabaseError` (generic DB failures)

**Key Patterns:**
- All methods return `Effect.Effect<Result, Error>`
- All queries scoped by `userId` for security
- Use `Effect.gen` for composition
- Tagged errors for type-safe error handling

#### Map Repositories (`src/infrastructure/map/database/repositories.ts`)

**Purpose:** Persistent cache layer for Google Maps API data

#### PlaceRepository
- `findByGooglePlaceId(googlePlaceId)` - Check if place exists in cache
- `upsert(placeData)` - Insert or update place (used after Google Maps API call)
- `findByIds(ids[])` - Batch load places by UUIDs (for trip reconstruction)
- `findStale(days)` - Find places needing refresh (for background jobs)

#### AttractionRepository
- `findByGooglePlaceId(googlePlaceId, type?)` - Check if attraction exists in cache
- `upsert(attractionData)` - Insert or update attraction (supports both attraction and restaurant types)
- `findByIds(ids[])` - Batch load attractions by UUIDs (for trip reconstruction)
- `findStale(days, type?)` - Find attractions needing refresh (optionally filter by type)

**Error Types:**
- `PlaceNotFoundError`
- `AttractionNotFoundError`
- `DatabaseError` (generic DB failures)

**Key Patterns:**
- All methods return `Effect.Effect<Result, Error>`
- No user scoping (global cache shared across users)
- Staleness tracking via `last_updated_at` timestamp
- Batch operations optimized for trip loading

### 3. Cache Layer Integration

The existing in-memory cache (`src/infrastructure/map/cache/`) provides 30-minute TTL for active sessions. The new database repositories add persistent 7-day caching:

**Integration Strategy:**
1. **In-memory cache (30 min)** - Stays as-is for hot data during active sessions
2. **Database cache (7 days)** - New persistent layer via PlaceRepository and AttractionRepository
3. **Google Maps API** - Fallback when both caches miss

**Future Enhancement:**
`AttractionsCache` and `RestaurantsCache` can be updated to check database repositories before calling Google Maps API, creating a two-tier cache system that minimizes API costs while maintaining fast response times.

### 4. Runtime Updates

Add repository layers to `src/infrastructure/common/runtime.ts`:
- Wire up repositories with SupabaseClient dependency
- Include in AppLayer for dependency injection

## Migration Strategy

### Phase 1: Infrastructure Setup ✅
- Create DAO types
- Create repositories
- Wire up in runtime
- **No behavior changes yet**

### Phase 2: Parallel Operation
- Keep existing localStorage code working
- Add new database operations alongside
- Test repositories independently
- Validate data mapping

### Phase 3: Gradual Replacement
- Replace storage.ts functions one-by-one
- Start with read operations (safer)
- Then write operations
- Keep localStorage as backup temporarily

### Phase 4: Data Migration
- Create migration utility to move existing localStorage → PostgreSQL
- Run on first authenticated session
- Preserve existing data

### Phase 5: Cleanup
- Remove deprecated localStorage code
- Update tests
- Remove migration code

## User ID Handling (Development Phase)

**For now:** Hardcode test user ID
- Simple constant: `const DEV_USER_ID = "test-user-uuid"`
- Used in all repository calls
- **TODO:** Replace with real auth later

**Future:** Replace with proper authentication
- Supabase Auth integration
- Extract user ID from session
- Proper user management

## API Surface Changes

### Storage.ts Functions (After Migration)

**Will Change (use repositories internally):**
- `savePersonas()` → calls `UserPersonasRepository.save()`
- `loadPersonas()` → calls `UserPersonasRepository.find()`
- `saveTripToHistory()` → calls `TripRepository.create()`
- `loadTripHistory()` → calls `TripRepository.findAll()`
- `loadTripById()` → calls `TripRepository.findById()`
- `updateTripInHistory()` → calls `TripRepository.updatePlaces()`
- `deleteTripFromHistory()` → calls `TripRepository.delete()`
- `saveConversation()` → calls `ConversationRepository.create/updateMessages()`
- `loadConversation()` → calls `ConversationRepository.findById()`
- `loadAllConversations()` → calls `ConversationRepository.findAll()`
- `deleteConversation()` → calls `ConversationRepository.delete()`

**Stay Same (localStorage):**
- `saveCurrentItinerary()`
- `loadCurrentItinerary()`
- `clearCurrentItinerary()`

**Note:** External API remains mostly compatible, but functions become async/return Effects

## Testing Strategy

1. **Unit tests** for converters (DAO ↔ Domain)
2. **Integration tests** for repositories (against local Supabase)
3. **Manual testing** with hardcoded user ID
4. **Data integrity** checks during migration

## Rollout Plan

### Step 1: Create Infrastructure (This PR)
- [ ] Create `src/infrastructure/plan/database/` (types, repositories, index)
  - ConversationRepository
  - TripRepository
  - UserPersonasRepository
- [ ] Create `src/infrastructure/map/database/` (types, repositories, index)
  - PlaceRepository
  - AttractionRepository
- [ ] Update `src/infrastructure/common/runtime.ts`
- [ ] Test all repositories independently

### Step 2: Replace Personas (Simple)
- [ ] Update `savePersonas()` to use repository
- [ ] Update `loadPersonas()` to use repository
- [ ] Test in plan page

### Step 3: Replace Trips (Medium)
- [ ] Update trip CRUD operations
- [ ] Update conversation-trip linking
- [ ] Test in plan and map pages

### Step 4: Replace Conversations (Complex)
- [ ] Update conversation CRUD operations
- [ ] Handle message updates carefully
- [ ] Test chat functionality thoroughly

### Step 5: Data Migration Utility
- [ ] Create one-time migration script
- [ ] Move existing localStorage data to DB
- [ ] Verify data integrity

### Step 6: Cleanup
- [ ] Remove old localStorage code
- [ ] Update documentation
- [ ] Remove hardcoded user ID placeholders

## Benefits After Migration

1. **Data Persistence**: Survives cache clears, browser changes
2. **Future-Ready**: Enables multi-device, sharing, collaboration
3. **Scalability**: No browser storage limits
4. **Backup**: Automatic database backups
5. **Analytics**: Can analyze usage patterns (anonymized)
6. **Search**: Enable server-side search in future

## Risks & Mitigations

**Risk:** Data loss during migration
- **Mitigation:** Keep localStorage as backup during transition

**Risk:** Performance degradation (network latency)
- **Mitigation:** Keep current itinerary in localStorage for fast updates

**Risk:** Breaking existing functionality
- **Mitigation:** Gradual rollout, maintain API compatibility where possible

**Risk:** Database connection failures
- **Mitigation:** Graceful error handling, fallback to localStorage temporarily

## Open Questions

1. How to handle offline mode? (Future consideration)
2. When to implement real authentication? (After migration proves stable)
3. Should we cache DB data in memory? (Optimize later if needed)
4. How to handle concurrent updates? (Not an issue with single user for now)

## Success Criteria

- ✅ All user data persists across browser sessions
- ✅ No data loss during migration
- ✅ No perceived performance degradation
- ✅ All existing features work as before
- ✅ Code follows existing Effect patterns
- ✅ Type-safe at all boundaries
- ✅ Place and attraction data cached in database (7-day policy)
- ✅ Reduced Google Maps API calls through persistent caching
- ✅ Batch loading optimized for trip reconstruction

