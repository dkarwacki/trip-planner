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

## Architecture Overview: Layers and Data Flow

### Layered Architecture

The application follows Clean Architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│ HTTP Layer (Astro API Routes)                               │
│ - Receive HTTP requests                                     │
│ - Return HTTP responses                                     │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ Infrastructure Layer (DTOs, Validation, Repositories)       │
│ - API sublayer: Schemas, DTOs, Mappers                     │
│ - Database sublayer: DAOs, Repositories                    │
│ - External services: Google Maps, OpenAI                   │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ Domain Layer (Pure Business Types)                          │
│ - Commands: Write operations (ChatRequestCommand)          │
│ - Queries: Read operations (SearchPlaceQuery)              │
│ - Models: Core entities (Place, Attraction, Persona)       │
│ - Errors: Tagged error types                               │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ Application Layer (Use Cases with Effect)                   │
│ - TravelPlanningChat                                        │
│ - GetTopAttractions                                         │
│ - SearchPlace                                               │
└─────────────────────────────────────────────────────────────┘
```

### Naming Conventions

**Infrastructure Types (DTOs):**
- Command inputs: `*CommandDTO` (e.g., `ChatRequestCommandDTO`, `CreateTripCommandDTO`)
- Query parameters: `*QueryParamsDTO` (e.g., `AttractionsQueryParamsDTO`)
- Response data: `*DTO` or `*ResponseDTO` (e.g., `PlaceDTO`, `ConversationDetailDTO`)
- All defined in `infrastructure/*/api/types.ts`
- Derived from Zod schemas using `z.infer<typeof Schema>`
- Include branded types from schema transforms

**Domain Types (Commands/Queries):**
- Command types: `*Command` (e.g., `ChatRequestCommand`, `ReverseGeocodeCommand`)
- Query types: `*Query` (e.g., `SearchPlaceQuery`, `GetPhotoQuery`)
- All defined in `domain/*/models/types.ts`
- Pure TypeScript interfaces (no Zod, no infrastructure dependencies)
- Use branded types from domain models

**Database Types (DAOs):**
- Data access objects: `*DAO` (e.g., `ConversationDAO`, `TripDAO`, `PlaceDAO`)
- All defined in `infrastructure/*/database/types.ts`
- camelCase interfaces matching database rows
- Converters handle snake_case ↔ camelCase

### Complete Data Flow

**Inbound (Request → Response):**

```
1. HTTP Request
   ↓
2. API Route validates with Schema
   → Result: DTO (infrastructure type)
   ↓
3. API Route maps with toDomain.mapper()
   → Result: Command/Query (domain type)
   ↓
4. Use Case executes business logic
   → Receives: Domain Command/Query
   → May use: Repositories (returns DAOs)
   → Converts: DAO → Domain models if needed
   → Returns: Domain result
   ↓
5. API Route maps result to DTO if needed
   ↓
6. HTTP Response
```

**Key Principles:**
- **Infrastructure owns validation**: Zod schemas validate at the boundary
- **Infrastructure owns DTOs**: API layer types with `DTO` suffix
- **Infrastructure owns DAOs**: Database layer types for persistence
- **Domain owns Commands/Queries**: Pure business types
- **Application uses only domain types**: No DTOs, no DAOs in use cases
- **Mappers bridge layers**: `toDomain` for DTO → Domain, converters for DAO → Domain

### Type Safety Flow

**Branded types flow through all layers:**

```
Schema transform → DTO → Domain mapper → Domain type
    ↓               ↓          ↓              ↓
PlaceSchema    PlaceDTO   toDomain    Place (domain)
  .transform   (includes    .toPlace   (PlaceId,
  (PlaceId)    PlaceId)               Lat, Lng)
```

**Example: Place ID flows from HTTP to domain:**
1. `PlaceSchema` has `.transform((data) => ({ ...data, id: PlaceId(data.id) }))`
2. `PlaceDTO = z.infer<typeof PlaceSchema>` includes `PlaceId` branded type
3. Mapper preserves the branded type: `toDomain.toPlace(dto)` → `Place` with `PlaceId`
4. Use case receives: `Place` with `PlaceId` branded type

## New Infrastructure Components

**Organization by Domain:**
- `src/infrastructure/plan/database/` - User-facing data (conversations, trips, personas)
- `src/infrastructure/map/database/` - Map/cache data (places, attractions)
- `src/infrastructure/plan/api/` - Plan feature API contracts (validation, DTOs, mappers)
- `src/infrastructure/map/api/` - Map feature API contracts (validation, DTOs, mappers)
- `src/domain/plan/models/types.ts` - Plan domain commands/queries
- `src/domain/map/models/types.ts` - Map domain commands/queries

### 1. API Layer (Request/Response Contracts)

The infrastructure layer includes an API sublayer that handles HTTP request/response validation and transformation. This layer sits between API routes and the application layer.

#### Plan API Layer (`src/infrastructure/plan/api/`)

**Purpose:** Validate and transform HTTP requests/responses for plan feature

**Files:**
- `schemas.ts` - Zod validation schemas
  - Command schemas (inputs): No transforms, used for request validation
  - Response schemas (outputs): Include `.transform()` to branded domain types
  - Examples: `ChatRequestCommandSchema`, `CreateConversationCommandSchema`
- `types.ts` - DTO type definitions derived from schemas
  - All types use `z.infer<typeof Schema>` 
  - All API types have `DTO` suffix (e.g., `ChatRequestCommandDTO`, `ConversationDetailDTO`)
  - Include branded types from schema transforms
- `mappers.ts` - DTO to Domain converters
  - Export `toDomain` object with mapping functions
  - Transform infrastructure DTOs to domain command/query types
  - Example: `toDomain.chatRequest(dto)` → `ChatRequestCommand`
- `index.ts` - Barrel exports for convenient imports

**Data Flow Example:**
```
HTTP Request
  ↓ validate with ChatRequestCommandSchema
ChatRequestCommandDTO (infrastructure type)
  ↓ toDomain.chatRequest(dto)
ChatRequestCommand (domain type)
  ↓ passed to use case
TravelPlanningChat use case
```

#### Map API Layer (`src/infrastructure/map/api/`)

**Purpose:** Validate and transform HTTP requests/responses for map feature

**Files:**
- `schemas.ts` - Zod validation schemas
  - Command schemas: `ReverseGeocodeCommandSchema`, `SearchPlaceCommandSchema`, `GetPhotoCommandSchema`
  - Query params: `AttractionsQueryParamsSchema`, `RestaurantsQueryParamsSchema`
  - Response schemas with transforms: `AttractionSchema`, `RestaurantSchema`, `PlaceSchema`
- `types.ts` - DTO type definitions
  - Command DTOs: `ReverseGeocodeCommandDTO`, `SearchPlaceCommandDTO`, `GetPhotoCommandDTO`
  - Query DTOs: `AttractionsQueryParamsDTO`, `RestaurantsQueryParamsDTO`
  - Data DTOs: `AttractionDTO`, `RestaurantDTO`, `PlaceDTO` (include branded types)
- `mappers.ts` - DTO to Domain converters
  - `toDomain.reverseGeocode(dto)` → `ReverseGeocodeCommand`
  - `toDomain.getAttractions(dto)` → `GetAttractionsQuery`
  - `toDomain.searchPlace(dto)` → `SearchPlaceQuery`
  - `toDomain.getPhoto(dto)` → `GetPhotoQuery`
- `index.ts` - Barrel exports

**Key Patterns:**
- Command schemas have NO transforms (validation only)
- Response schemas use `.transform()` to convert to branded domain types
- DTOs are infrastructure types, never used in application layer
- Mappers bridge the gap: DTO (infrastructure) → Command/Query (domain)

### 2. Domain Command/Query Types

Domain types define the contracts for application layer use cases. These are pure business types with NO infrastructure dependencies.

#### Plan Domain Types (`src/domain/plan/models/types.ts`)

**Purpose:** Define input contracts for plan feature use cases

**Types:**
- `ChatRequestCommand` - Send message to AI assistant
  - Fields: `message`, `personas`, `conversationHistory`
  - Used by: `TravelPlanningChat` use case
- `ConversationMessage` - Message in conversation history
  - Fields: `role`, `content`
  - Shared type for chat context

**Pattern:**
- Commands: Write operations (mutations)
- Queries: Read operations (lookups, searches)
- Application layer uses ONLY these types, never DTOs
- Infrastructure layer maps DTOs to these types via `toDomain` mappers

#### Map Domain Types (`src/domain/map/models/types.ts`)

**Purpose:** Define input contracts for map feature use cases

**Types:**
- Commands (write operations):
  - `ReverseGeocodeCommand` - Convert coordinates to place info
  - `SuggestNearbyAttractionsCommand` - Get AI suggestions for attractions
- Queries (read operations):
  - `SearchPlaceQuery` - Search for place by name
  - `GetPhotoQuery` - Fetch photo by reference
  - `GetAttractionsQuery` - Get attractions near location
  - `GetRestaurantsQuery` - Get restaurants near location

**Supporting Types:**
- `ConversationMessage` - For AI context
- `PlannedAttraction`, `PlannedRestaurant` - For trip context
- `CurrentPlace` - Place with planned items

**Key Principles:**
- Domain types use branded types (e.g., `Latitude`, `Longitude`, `PlaceId`)
- No infrastructure dependencies (no Zod, no HTTP concepts)
- Application layer signature: `UseCase(domainCommand/Query): Effect<Result, Error>`
- Clean separation: Infrastructure validates & maps, Domain defines contracts, Application orchestrates

### 3. DAO Types

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

### 4. Repositories

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

### 5. Cache Layer Integration

The existing in-memory cache (`src/infrastructure/map/cache/`) provides 30-minute TTL for active sessions. The new database repositories add persistent 7-day caching:

**Integration Strategy:**
1. **In-memory cache (30 min)** - Stays as-is for hot data during active sessions
2. **Database cache (7 days)** - New persistent layer via PlaceRepository and AttractionRepository
3. **Google Maps API** - Fallback when both caches miss

**Future Enhancement:**
`AttractionsCache` and `RestaurantsCache` can be updated to check database repositories before calling Google Maps API, creating a two-tier cache system that minimizes API costs while maintaining fast response times.

### 6. Runtime Updates

Add repository layers to `src/infrastructure/common/runtime.ts`:
- Wire up repositories with SupabaseClient dependency
- Include in AppLayer for dependency injection

## Migration Strategy

### Phase 1: Infrastructure Setup ✅ COMPLETED
- ✅ Created DAO types (`src/infrastructure/plan/database/types.ts`)
- ✅ Created DAO types (`src/infrastructure/map/database/types.ts`)
- ✅ Created repositories (`src/infrastructure/plan/database/repositories.ts`)
- ✅ Created repositories (`src/infrastructure/map/database/repositories.ts`)
- ✅ Wired up in runtime (`src/infrastructure/common/runtime.ts`)
- ✅ **No behavior changes yet - all existing code still uses localStorage**
- ✅ **Decision: Use repositories directly, no service layer wrappers needed for simple CRUD**

### Phase 2: Direct Replacement (NEXT)
- **Decision: Skip parallel operation phase - replace localStorage directly**
- Use repositories directly where persistence is needed:
  - API routes can use repositories with Effect
  - Complex use cases can compose multiple repositories
  - Browser components call API routes
- Replace localStorage usage for:
  - Personas → `UserPersonasRepository`
  - Trip History → `TripRepository`
  - Conversations → `ConversationRepository`
- Keep localStorage for transient state:
  - Current itinerary (session scratchpad)

### Phase 3: Cleanup
- Remove deprecated localStorage code for persisted data
- Update tests
- Keep localStorage for current itinerary
- **Note:** No data migration needed - start fresh with database

## User ID Handling (Development Phase)

**Current implementation:** Hardcoded test user ID
- Constant defined in each repository file: `const DEV_USER_ID = "00000000-0000-0000-0000-000000000000"`
- Used in all repository calls (scopes queries to this user)
- **TODO:** Replace with real auth later (see cleanup phase)

**Future:** Replace with proper authentication
- Supabase Auth integration
- Extract user ID from session/context
- Pass userId as parameter to repository calls
- Proper user management and RLS enforcement

## API Surface Changes

### Data Flow Architecture

The application now follows a layered architecture with clear boundaries:

**HTTP Request → API Layer → Domain Layer → Application Layer**

#### Complete Data Flow Example (Chat Request):

```
1. HTTP POST /api/plan
   Body: { message: "...", personas: [...], conversationHistory: [...] }

2. API Route (src/pages/api/plan.ts)
   - Validates with: ChatRequestCommandSchema.safeParse(body)
   - Gets: ChatRequestCommandDTO (infrastructure type with validation)
   - Maps with: toDomain.chatRequest(dto) from infrastructure/plan/api/mappers.ts
   - Gets: ChatRequestCommand (domain type)

3. Application Layer (src/application/plan/TravelPlanningChat.ts)
   - Receives: ChatRequestCommand (pure domain type)
   - Executes: Business logic with Effect
   - Returns: Domain result (AgentResponse)

4. API Route
   - Maps domain result to DTO if needed
   - Returns: HTTP response
```

**Key Pattern:**
- **API routes** handle HTTP concerns (validation, error mapping, response formatting)
- **Infrastructure mappers** bridge DTO ↔ Domain types
- **Application layer** works with pure domain types only
- **Domain types** have no infrastructure dependencies

### Storage.ts Functions (After Migration)

**Will be REPLACED with API routes + repositories:**

**Personas:**
- `savePersonas()` → API route using `UserPersonasRepository.save()`
- `loadPersonas()` → API route using `UserPersonasRepository.find()`

**Trips:**
- `saveTripToHistory()` → API route using `TripRepository.create()`
- `loadTripHistory()` → API route using `TripRepository.findAll()`
- `loadTripById()` → API route using `TripRepository.findById()`
- `updateTripInHistory()` → API route using `TripRepository.updatePlaces()`
- `deleteTripFromHistory()` → API route using `TripRepository.delete()`

**Conversations:**
- `saveConversation()` → API route using `ConversationRepository.create/updateMessages()`
- `loadConversation()` → API route using `ConversationRepository.findById()`
- `loadAllConversations()` → API route using `ConversationRepository.findAll()`
- `deleteConversation()` → API route using `ConversationRepository.delete()`

**Stay Same (localStorage for transient state):**
- `saveCurrentItinerary()`
- `loadCurrentItinerary()`
- `clearCurrentItinerary()`

**Architecture Notes:**
- API routes validate requests using schemas from `infrastructure/*/api/schemas.ts`
- Mappers convert DTOs to domain types using `toDomain` from `infrastructure/*/api/mappers.ts`
- Repositories work with DAOs (use converters from `infrastructure/*/database/types.ts`)
- Browser components call API routes, never use repositories directly
- Application use cases receive domain Commands/Queries, never DTOs

## Rollout Plan

### Step 1: Create Infrastructure ✅ COMPLETED

**API Layer (Validation, DTOs, Mappers):**
- ✅ Created `src/infrastructure/plan/api/` (schemas, types, mappers, index)
  - Zod schemas for all plan endpoints (conversations, trips, personas, chat)
  - DTOs derived from schemas with branded types
  - `toDomain` mappers: DTO → Domain Commands/Queries
- ✅ Created `src/infrastructure/map/api/` (schemas, types, mappers, index)
  - Zod schemas for all map endpoints (places, attractions, restaurants, photos, geocoding)
  - DTOs derived from schemas with branded types
  - `toDomain` mappers for all map operations
- ✅ Created `src/infrastructure/common/api/` (schemas, types, index)
  - Shared schemas: `CoordinatesSchema`, `PhotoSchema`, `UUIDSchema`
  - Common DTOs used across features
- ✅ Created `src/domain/plan/models/types.ts` - Domain commands/queries for plan feature
- ✅ Created `src/domain/map/models/types.ts` - Domain commands/queries for map feature

**Database Layer (Repositories, DAOs):**
- ✅ Created `src/infrastructure/plan/database/` (types, repositories, index)
  - ConversationRepository - CRUD for chat history
  - TripRepository - CRUD for saved trips
  - UserPersonasRepository - find/save for user preferences
  - DAOs with camelCase interfaces, converters for snake_case ↔ camelCase
- ✅ Created `src/infrastructure/map/database/` (types, repositories, index)
  - PlaceRepository - Cache layer with batch operations
  - AttractionRepository - Cache layer with type discrimination
  - DAOs with converters to/from domain models
- ✅ Created `src/infrastructure/common/database/` (SupabaseClient, types, index)
  - Type-safe Supabase client with database schema
  - Effect Context.Tag + Layer for dependency injection

**Integration:**
- ✅ Updated `src/infrastructure/common/runtime.ts`
  - Wired up all repositories with SupabaseClient dependency
  - Included in AppLayer for dependency injection
- ✅ Updated all API routes to use new pattern:
  - Validate with schemas → Get DTO → Map with toDomain → Pass to use case
  - Examples: `/api/plan`, `/api/attractions`, `/api/places/search`, etc.
- ✅ Updated all use cases to use domain Commands/Queries:
  - Removed old `*Input` types from application layer
  - Use cases now receive pure domain types

**Architecture:**
- ✅ Type-safe DAOs with proper converters (database layer)
- ✅ Type-safe DTOs with Zod validation (API layer)
- ✅ Type-safe Commands/Queries (domain layer)
- ✅ Clean separation: Infrastructure validates & maps, Domain defines contracts, Application orchestrates
- ✅ Branded types flow through all layers via schema transforms
- ✅ **No behavior changes to end users - all existing code works as before**

### Step 2: Replace Personas (NEXT - Simple)
- [ ] Use `UserPersonasRepository` directly where personas are loaded/saved
- [ ] Update plan page to use repository
- [ ] Remove localStorage persona functions

### Step 3: Replace Trips (Medium)
- [ ] Use `TripRepository` directly for trip CRUD operations
- [ ] Handle conversation-trip linking (one-to-one relationship)
- [ ] Update map and plan pages
- [ ] Remove localStorage trip functions

### Step 4: Replace Conversations (Complex)
- [ ] Use `ConversationRepository` directly for conversation CRUD
- [ ] Handle message updates carefully
- [ ] Test chat functionality thoroughly
- [ ] Remove localStorage conversation functions

### Step 5: Cleanup
- [ ] Remove old localStorage code (except current itinerary)
- [ ] Update documentation

## Open Questions

1. How to handle offline mode? Ignore that for now
2. When to implement real authentication? Yes, but ignore that for now
3. Should we cache DB data in memory? Thats something we can do later
4. How to handle concurrent updates? Not an issue with single user for now

## Success Criteria

- ✅ All user data persists across browser sessions
- ✅ No perceived performance degradation
- ✅ All existing features work as before
- ✅ Code follows existing Effect patterns
- ✅ Type-safe at all boundaries
- ✅ Place and attraction data cached in database (7-day policy)
- ✅ Reduced Google Maps API calls through persistent caching
- ✅ Batch loading optimized for trip reconstruction
- ✅ Users can start fresh with database persistence

