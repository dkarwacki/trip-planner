# REST API Plan - TripGenie

## 1. Overview

This document defines the REST API for TripGenie, an AI-powered trip planning application with persona-based place recommendations and interactive map exploration. The API follows RESTful principles and integrates with:

- **Supabase** for authentication and PostgreSQL database
- **Google Maps API** for geocoding, place validation, and nearby search
- **OpenAI** (via OpenRouter) for AI chat functionality

### Design Principles

- **Clean Architecture**: Separation of concerns with three layers
  - API endpoints (thin adapters in `src/pages/api/`)
  - Application services/use cases (`src/application/`)
  - Infrastructure/repositories (`src/infrastructure/`)
- **User-scoped data**: All resources are owned by users (hardcoded user ID for MVP, authentication later)
- **Cache-first strategy**: Check database cache before calling external APIs to minimize costs
- **7-day cache freshness**: Refresh stale data via background jobs
- **Effect-based error handling**: Use tagged errors for type-safe error discrimination
- **Zod validation**: Validate all inputs and outputs with type-safe schemas
- **Atomic updates**: Use JSONB for embedded structures (messages, places_data)

### MVP Authentication Strategy

For MVP development, we use a **hardcoded user ID** to bypass authentication while maintaining the user-scoped data structure:

- Hardcoded user ID: `00000000-0000-0000-0000-000000000001`
- All endpoints use this user ID without JWT validation
- RLS policies disabled in development (see migration: `20251109140001_disable_rls_policies_for_dev.sql`)
- Data structure ready for future Supabase Auth integration
- No middleware authentication checks

---

## 2. Architecture Layers

### 2.1 API Endpoints (Thin Adapters)

Located in `src/pages/api/`, these endpoints:

- Validate request format (query params, body)
- Call application services (use cases)
- Map Effect results to HTTP responses
- Handle errors via Effect error handlers

**Example structure:**

```typescript
// src/pages/api/personas/index.ts
export async function GET({ locals }) {
  const userId = HARDCODED_USER_ID;

  const program = getUserPersonas({ userId }).pipe(
    Effect.catchTags({
      PersonaNotFoundError: (error) => Effect.succeed(/* 404 response */),
      DatabaseError: (error) => Effect.succeed(/* 500 response */),
    })
  );

  return runPromise(program);
}
```

### 2.2 Application Services (Use Cases)

Located in `src/application/`, organized by feature:

- `src/application/plan/` - Conversation and chat use cases
- `src/application/map/` - Place, attraction, trip use cases (to be expanded)

Each use case:

- Implements business logic
- Coordinates multiple repositories
- Returns Effect<Result, Error>
- Independent of HTTP/API concerns

### 2.3 Infrastructure (Repositories)

Located in `src/infrastructure/`, provides data access:

- `src/infrastructure/common/database/` - Supabase client
- `src/infrastructure/plan/database/` - Conversation & persona repositories (to be created)
- `src/infrastructure/map/database/` - Trip, place, attraction repositories (to be expanded)

Each repository:

- Handles database queries
- Maps between domain models and database rows
- Returns Effect<Result, DatabaseError>

---

## 3. Resources

| Resource      | Database Table  | Application Service                                                                                                                                                             | Repository                                                                  |
| ------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| User Personas | `user_personas` | `src/application/plan/GetUserPersonas.ts`<br>`src/application/plan/UpdateUserPersonas.ts`                                                                                       | `src/infrastructure/plan/database/PersonaRepository.ts`                     |
| Conversations | `conversations` | `src/application/plan/GetConversations.ts`<br>`src/application/plan/GetConversation.ts`<br>`src/application/plan/CreateConversation.ts`<br>`src/application/plan/AddMessage.ts` | `src/infrastructure/plan/database/ConversationRepository.ts`                |
| Trips         | `trips`         | `src/application/map/GetTrips.ts`<br>`src/application/map/GetTrip.ts`<br>`src/application/map/CreateTrip.ts`<br>`src/application/map/UpdateTrip.ts`                             | `src/infrastructure/map/database/TripRepository.ts`                         |
| Places        | `places`        | `src/application/map/places/ValidatePlace.ts` (expand existing)                                                                                                                 | `src/infrastructure/map/database/PlaceRepository.ts` (expand existing)      |
| Attractions   | `attractions`   | Existing: `GetTopAttractions.ts`, `GetTopRestaurants.ts`                                                                                                                        | `src/infrastructure/map/database/AttractionRepository.ts` (expand existing) |

**Authentication**: For MVP, all endpoints use a hardcoded user ID (`00000000-0000-0000-0000-000000000001`). Full Supabase authentication will be added later.

---

## 4. Endpoints

### 4.1 MVP Authentication Note

**Current Implementation (MVP):**

- All endpoints use hardcoded user ID: `00000000-0000-0000-0000-000000000001`
- No JWT validation or middleware checks
- RLS policies disabled in development

**Future Implementation:**

- Supabase Auth integration
- JWT token validation in Astro middleware
- RLS policies enabled
- User-scoped access control

---

### 4.2 User Personas

#### GET /api/personas

Get current user's persona preferences.

**Authentication:** None (uses hardcoded user ID for MVP)

**Response:**

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "persona_types": ["foodie_traveler", "adventure_seeker"],
  "created_at": "2025-11-09T14:30:00Z",
  "updated_at": "2025-11-09T14:30:00Z"
}
```

**Success:** `200 OK`

**Errors:**

- `404 Not Found` - User personas not yet created (first time user)

**Implementation:**

**API Endpoint** (`src/pages/api/personas/index.ts`):

```typescript
export async function GET() {
  const userId = HARDCODED_USER_ID;

  const program = getUserPersonas({ userId }).pipe(
    Effect.map((personas) => new Response(JSON.stringify(personas), { status: 200 })),
    Effect.catchTags({
      PersonaNotFoundError: () => Effect.succeed(new Response(JSON.stringify({ error: "Not Found" }), { status: 404 })),
    })
  );

  return runPromise(program);
}
```

**Application Service** (`src/application/plan/GetUserPersonas.ts`):

```typescript
export const getUserPersonas = (input: GetUserPersonasInput) =>
  Effect.gen(function* () {
    const repo = yield* PersonaRepository;
    const personas = yield* repo.findByUserId(input.userId);

    if (!personas) {
      yield* Effect.fail(new PersonaNotFoundError(input.userId));
    }

    return personas;
  });
```

**Repository** (`src/infrastructure/plan/database/PersonaRepository.ts`):

```typescript
export const findByUserId = (userId: string) =>
  Effect.gen(function* () {
    const client = yield* SupabaseClient;
    const { data, error } = await client.from("user_personas").select("*").eq("user_id", userId).single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      yield* Effect.fail(new DatabaseError("findByUserId", error.message, error));
    }

    return data;
  });
```

---

#### PUT /api/personas

Update user's persona preferences.

**Authentication:** None (uses hardcoded user ID for MVP)

**Request:**

```json
{
  "persona_types": ["nature_lover", "photography_enthusiast"]
}
```

**Validation:**

```typescript
const PersonaTypesSchema = z
  .array(
    z.enum([
      "general_tourist",
      "nature_lover",
      "art_enthusiast",
      "foodie_traveler",
      "adventure_seeker",
      "digital_nomad",
      "history_buff",
      "photography_enthusiast",
    ])
  )
  .min(1)
  .max(8);
```

**Response:**

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "persona_types": ["nature_lover", "photography_enthusiast"],
  "updated_at": "2025-11-09T14:30:00Z"
}
```

**Success:** `200 OK`

**Errors:**

- `400 Bad Request` - Invalid persona types or validation failure

**Implementation:**

**API Endpoint** (`src/pages/api/personas/index.ts`):

```typescript
export async function PUT({ request }) {
  const userId = HARDCODED_USER_ID;
  const body = await request.json();

  // Validate input
  const validation = UpdatePersonasInputSchema.safeParse({ ...body, userId });
  if (!validation.success) {
    return new Response(JSON.stringify({ error: "Validation Error" }), { status: 400 });
  }

  const program = updateUserPersonas(validation.data);
  return runPromise(program);
}
```

**Application Service** (`src/application/plan/UpdateUserPersonas.ts`):

```typescript
export const updateUserPersonas = (input: UpdateUserPersonasInput) =>
  Effect.gen(function* () {
    const repo = yield* PersonaRepository;

    // Default to general_tourist if empty
    const personaTypes = input.persona_types.length === 0 ? ["general_tourist"] : input.persona_types;

    const updated = yield* repo.upsert({
      user_id: input.userId,
      persona_types: personaTypes,
      updated_at: new Date(),
    });

    return updated;
  });
```

**Repository** (`src/infrastructure/plan/database/PersonaRepository.ts`):

```typescript
export const upsert = (data: PersonaUpsertData) =>
  Effect.gen(function* () {
    const client = yield* SupabaseClient;
    const { data: result, error } = await client
      .from("user_personas")
      .upsert(data, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      yield* Effect.fail(new DatabaseError("upsert", error.message, error));
    }

    return result;
  });
```

---

### 4.3 Conversations

#### GET /api/conversations

List all conversations for the current user.

**Authentication:** None (uses hardcoded user ID for MVP)

**Example:** `GET /api/conversations`

**Response:**

```json
{
  "conversations": [
    {
      "id": "conv-uuid",
      "user_id": "user-uuid",
      "title": "European Summer Trip",
      "personas": ["foodie_traveler", "art_enthusiast"],
      "message_count": 12,
      "created_at": "2025-11-09T14:30:00Z",
      "updated_at": "2025-11-09T15:45:00Z",
      "has_trip": true
    }
  ]
}
```

**Success:** `200 OK`

**Errors:**

- None (always returns empty array if no conversations)

**Implementation:**

**API Endpoint** (`src/pages/api/conversations/index.ts`):

```typescript
export async function GET() {
  const userId = HARDCODED_USER_ID;
  const program = getConversations({ userId });
  return runPromise(program);
}
```

**Application Service** (`src/application/plan/GetConversations.ts`):

```typescript
export const getConversations = (input: GetConversationsInput) =>
  Effect.gen(function* () {
    const repo = yield* ConversationRepository;
    const conversations = yield* repo.findByUserId(input.userId);

    // Map to response format (exclude message content, add metadata)
    return conversations.map((conv) => ({
      ...conv,
      message_count: conv.messages.length,
      has_trip: conv.trip_id !== null,
      messages: undefined, // Don't include messages in list view
    }));
  });
```

**Repository** (`src/infrastructure/plan/database/ConversationRepository.ts`):

```typescript
export const findByUserId = (userId: string) =>
  Effect.gen(function* () {
    const client = yield* SupabaseClient;
    const { data, error } = await client
      .from("conversations")
      .select(
        `
        *,
        trips!conversation_id(id)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      yield* Effect.fail(new DatabaseError("findByUserId", error.message, error));
    }

    return data;
  });
```

---

#### GET /api/conversations/:id

Get a specific conversation with full message history.

**Authentication:** None (uses hardcoded user ID for MVP)

**Response:**

```json
{
  "id": "conv-uuid",
  "user_id": "user-uuid",
  "title": "European Summer Trip",
  "personas": ["foodie_traveler", "art_enthusiast"],
  "messages": [
    {
      "id": "msg-uuid-1",
      "role": "user",
      "content": "I want to explore culinary experiences in Europe",
      "timestamp": "2025-11-09T14:30:00Z"
    },
    {
      "id": "msg-uuid-2",
      "role": "assistant",
      "content": "Here are some excellent culinary destinations...",
      "timestamp": "2025-11-09T14:31:00Z",
      "suggestedPlaces": [
        {
          "place_id": "ChIJ...",
          "name": "Lyon, France",
          "reason": "Culinary capital of France with world-class restaurants"
        }
      ],
      "thinkingProcess": ["User wants culinary experiences", "Lyon is known for food"]
    }
  ],
  "created_at": "2025-11-09T14:30:00Z",
  "updated_at": "2025-11-09T15:45:00Z"
}
```

**Success:** `200 OK`

**Errors:**

- `404 Not Found` - Conversation not found

**Implementation:**

**API Endpoint** (`src/pages/api/conversations/[id].ts`):

```typescript
export async function GET({ params }) {
  const userId = HARDCODED_USER_ID;
  const conversationId = params.id;

  const program = getConversation({ userId, conversationId }).pipe(
    Effect.catchTags({
      ConversationNotFoundError: () =>
        Effect.succeed(new Response(JSON.stringify({ error: "Not Found" }), { status: 404 })),
    })
  );

  return runPromise(program);
}
```

**Application Service** (`src/application/plan/GetConversation.ts`):

```typescript
export const getConversation = (input: GetConversationInput) =>
  Effect.gen(function* () {
    const repo = yield* ConversationRepository;
    const conversation = yield* repo.findById(input.conversationId, input.userId);

    if (!conversation) {
      yield* Effect.fail(new ConversationNotFoundError(input.conversationId));
    }

    return conversation;
  });
```

**Repository** (`src/infrastructure/plan/database/ConversationRepository.ts`):

```typescript
export const findById = (id: string, userId: string) =>
  Effect.gen(function* () {
    const client = yield* SupabaseClient;
    const { data, error } = await client.from("conversations").select("*").eq("id", id).eq("user_id", userId).single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      yield* Effect.fail(new DatabaseError("findById", error.message, error));
    }

    return data;
  });
```

---

#### POST /api/conversations

Create a new conversation.

**Authentication:** None (uses hardcoded user ID for MVP)

**Request:**

```json
{
  "title": "European Summer Trip",
  "personas": ["foodie_traveler", "art_enthusiast"],
  "initial_message": "I want to explore culinary experiences in Europe"
}
```

**Validation:**

```typescript
const CreateConversationSchema = z.object({
  title: z.string().min(1).max(200),
  personas: PersonaTypesSchema,
  initial_message: z.string().min(1).max(2000),
});
```

**Response:**

```json
{
  "id": "conv-uuid",
  "user_id": "user-uuid",
  "title": "European Summer Trip",
  "personas": ["foodie_traveler", "art_enthusiast"],
  "messages": [
    {
      "id": "msg-uuid-1",
      "role": "user",
      "content": "I want to explore culinary experiences in Europe",
      "timestamp": "2025-11-09T14:30:00Z"
    },
    {
      "id": "msg-uuid-2",
      "role": "assistant",
      "content": "Here are some excellent culinary destinations...",
      "timestamp": "2025-11-09T14:31:00Z",
      "suggestedPlaces": [...]
    }
  ],
  "created_at": "2025-11-09T14:30:00Z",
  "updated_at": "2025-11-09T14:31:00Z"
}
```

**Success:** `201 Created`

**Errors:**

- `400 Bad Request` - Invalid input
- `503 Service Unavailable` - OpenAI API unavailable

**Implementation:**

**API Endpoint** (`src/pages/api/conversations/index.ts`):

```typescript
export async function POST({ request }) {
  const userId = HARDCODED_USER_ID;
  const body = await request.json();

  const validation = CreateConversationInputSchema.safeParse({ ...body, userId });
  if (!validation.success) {
    return new Response(JSON.stringify({ error: "Validation Error" }), { status: 400 });
  }

  const program = createConversation(validation.data);
  return runPromise(program);
}
```

**Application Service** (`src/application/plan/CreateConversation.ts`):

```typescript
export const createConversation = (input: CreateConversationInput) =>
  Effect.gen(function* () {
    // 1. Call AI to get initial response
    const aiResponse = yield* travelPlanningChat({
      message: input.initial_message,
      personas: input.personas,
      conversationHistory: [],
    });

    // 2. Build messages array
    const messages = [
      {
        id: uuid(),
        role: "user",
        content: input.initial_message,
        timestamp: new Date().toISOString(),
      },
      aiResponse,
    ];

    // 3. Save conversation
    const repo = yield* ConversationRepository;
    const conversation = yield* repo.create({
      user_id: input.userId,
      title: input.title,
      personas: input.personas,
      messages,
    });

    return conversation;
  });
```

**Repository** (`src/infrastructure/plan/database/ConversationRepository.ts`):

```typescript
export const create = (data: ConversationInsertData) =>
  Effect.gen(function* () {
    const client = yield* SupabaseClient;
    const { data: result, error } = await client.from("conversations").insert(data).select().single();

    if (error) {
      yield* Effect.fail(new DatabaseError("create", error.message, error));
    }

    return result;
  });
```

---

#### POST /api/conversations/:id/messages

Add a message to an existing conversation.

**Authentication:** None (uses hardcoded user ID for MVP)

**Request:**

```json
{
  "message": "What about destinations for art lovers?"
}
```

**Validation:**

```typescript
const AddMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});
```

**Response:**

```json
{
  "conversation_id": "conv-uuid",
  "new_messages": [
    {
      "id": "msg-uuid-3",
      "role": "user",
      "content": "What about destinations for art lovers?",
      "timestamp": "2025-11-09T14:45:00Z"
    },
    {
      "id": "msg-uuid-4",
      "role": "assistant",
      "content": "Here are some excellent art destinations...",
      "timestamp": "2025-11-09T14:46:00Z",
      "suggestedPlaces": [
        {
          "place_id": "ChIJ...",
          "name": "Florence, Italy",
          "reason": "Renaissance art capital with world-class museums"
        }
      ]
    }
  ],
  "updated_at": "2025-11-09T14:46:00Z"
}
```

**Success:** `200 OK`

**Errors:**

- `400 Bad Request` - Invalid input
- `404 Not Found` - Conversation not found
- `503 Service Unavailable` - OpenAI API unavailable

**Implementation:**

**API Endpoint** (`src/pages/api/conversations/[id]/messages.ts`):

```typescript
export async function POST({ params, request }) {
  const userId = HARDCODED_USER_ID;
  const conversationId = params.id;
  const body = await request.json();

  const validation = AddMessageInputSchema.safeParse({
    ...body,
    userId,
    conversationId,
  });
  if (!validation.success) {
    return new Response(JSON.stringify({ error: "Validation Error" }), { status: 400 });
  }

  const program = addMessage(validation.data);
  return runPromise(program);
}
```

**Application Service** (`src/application/plan/AddMessage.ts`):

```typescript
export const addMessage = (input: AddMessageInput) =>
  Effect.gen(function* () {
    const repo = yield* ConversationRepository;

    // 1. Load conversation
    const conversation = yield* repo.findById(input.conversationId, input.userId);
    if (!conversation) {
      yield* Effect.fail(new ConversationNotFoundError(input.conversationId));
    }

    // 2. Call AI with history
    const aiResponse = yield* travelPlanningChat({
      message: input.message,
      personas: conversation.personas,
      conversationHistory: conversation.messages,
    });

    // 3. Build new messages array
    const userMessage = {
      id: uuid(),
      role: "user",
      content: input.message,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...conversation.messages, userMessage, aiResponse];

    // 4. Update conversation
    const updated = yield* repo.updateMessages(input.conversationId, input.userId, newMessages);

    return {
      conversation_id: updated.id,
      new_messages: [userMessage, aiResponse],
      updated_at: updated.updated_at,
    };
  });
```

**Repository** (`src/infrastructure/plan/database/ConversationRepository.ts`):

```typescript
export const updateMessages = (id: string, userId: string, messages: Message[]) =>
  Effect.gen(function* () {
    const client = yield* SupabaseClient;
    const { data, error } = await client
      .from("conversations")
      .update({
        messages,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      yield* Effect.fail(new DatabaseError("updateMessages", error.message, error));
    }

    return data;
  });
```

---

#### PUT /api/conversations/:id

Update conversation metadata (title only).

**Authentication:** None (uses hardcoded user ID for MVP)

**Request:**

```json
{
  "title": "Updated Trip Title"
}
```

**Response:**

```json
{
  "id": "conv-uuid",
  "title": "Updated Trip Title",
  "updated_at": "2025-11-09T16:00:00Z"
}
```

**Success:** `200 OK`

**Errors:**

- `400 Bad Request` - Invalid input
- `404 Not Found` - Conversation not found

---

#### DELETE /api/conversations/:id

Delete a conversation.

**Authentication:** None (uses hardcoded user ID for MVP)

**Response:**

```json
{
  "id": "conv-uuid",
  "deleted": true
}
```

**Success:** `200 OK`

**Errors:**

- `404 Not Found` - Conversation not found

**Implementation Notes:**

- Uses hardcoded user ID in WHERE clause
- Associated trip is preserved (foreign key: `ON DELETE SET NULL`)

---

### 4.4 Trips

#### GET /api/trips

List all trips for the current user.

**Authentication:** None (uses hardcoded user ID for MVP)

**Example:** `GET /api/trips`

**Response:**

```json
{
  "trips": [
    {
      "id": "trip-uuid",
      "user_id": "user-uuid",
      "conversation_id": "conv-uuid",
      "title": "Trip Plan - 2025-11-09 14:30",
      "place_count": 5,
      "created_at": "2025-11-09T14:30:00Z",
      "updated_at": "2025-11-09T15:45:00Z"
    }
  ]
}
```

**Success:** `200 OK`

**Errors:**

- None (always returns empty array if no trips)

**Implementation:**

**API Endpoint** (`src/pages/api/trips/index.ts`):

```typescript
export async function GET() {
  const userId = HARDCODED_USER_ID;
  const program = getTrips({ userId });
  return runPromise(program);
}
```

**Application Service** (`src/application/map/GetTrips.ts`):

```typescript
export const getTrips = (input: GetTripsInput) =>
  Effect.gen(function* () {
    const repo = yield* TripRepository;
    const trips = yield* repo.findByUserId(input.userId);

    // Map to metadata format
    return trips.map((trip) => ({
      id: trip.id,
      user_id: trip.user_id,
      conversation_id: trip.conversation_id,
      title: trip.title,
      place_count: trip.places_data.length,
      created_at: trip.created_at,
      updated_at: trip.updated_at,
    }));
  });
```

**Repository** (`src/infrastructure/map/database/TripRepository.ts`):

```typescript
export const findByUserId = (userId: string) =>
  Effect.gen(function* () {
    const client = yield* SupabaseClient;
    const { data, error } = await client
      .from("trips")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      yield* Effect.fail(new DatabaseError("findByUserId", error.message, error));
    }

    return data;
  });
```

---

#### GET /api/trips/:id

Get a specific trip with full place data.

**Authentication:** None (uses hardcoded user ID for MVP)

**Response:**

```json
{
  "id": "trip-uuid",
  "user_id": "user-uuid",
  "conversation_id": "conv-uuid",
  "title": "Trip Plan - 2025-11-09 14:30",
  "places": [
    {
      "place": {
        "id": "place-uuid-1",
        "google_place_id": "ChIJ...",
        "name": "Paris, France",
        "latitude": 48.856614,
        "longitude": 2.3522219,
        "photos": [...],
        "validation_status": "verified"
      },
      "display_order": 0,
      "attractions": [
        {
          "id": "attraction-uuid-1",
          "google_place_id": "ChIJ...",
          "type": "attraction",
          "name": "Eiffel Tower",
          "rating": 4.7,
          "user_ratings_total": 234567,
          "latitude": 48.858370,
          "longitude": 2.294481,
          "quality_score": 0.95,
          "diversity_score": 0.87,
          "confidence_score": 0.92
        }
      ],
      "restaurants": [
        {
          "id": "restaurant-uuid-1",
          "google_place_id": "ChIJ...",
          "type": "restaurant",
          "name": "Le Jules Verne",
          "rating": 4.5,
          "price_level": 4,
          "latitude": 48.858093,
          "longitude": 2.294694,
          "quality_score": 0.88
        }
      ]
    }
  ],
  "created_at": "2025-11-09T14:30:00Z",
  "updated_at": "2025-11-09T15:45:00Z"
}
```

**Success:** `200 OK`

**Errors:**

- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - User doesn't own this trip
- `404 Not Found` - Trip not found

**Business Logic:**

1. **Load trip** from database

   ```sql
   SELECT * FROM trips WHERE id = $1 AND user_id = $2;
   ```

2. **Extract UUIDs from places_data JSONB** (application layer)

   ```typescript
   const placeIds = trip.places_data.map((p) => p.placeId);
   const attractionIds = trip.places_data.flatMap((p) => p.attractionIds);
   const restaurantIds = trip.places_data.flatMap((p) => p.restaurantIds);
   ```

3. **Batch load places, attractions, restaurants** (3 queries, no N+1)

   ```sql
   SELECT * FROM places WHERE id = ANY($1);
   SELECT * FROM attractions WHERE id = ANY($1) AND type = 'attraction';
   SELECT * FROM attractions WHERE id = ANY($1) AND type = 'restaurant';
   ```

4. **Build nested response structure** (application layer)

**Implementation Notes:**

- Efficient batch loading avoids N+1 query problem
- Places appear in order from `display_order` field
- Uses hardcoded user ID in WHERE clause

---

#### POST /api/trips

Create a new trip (export from conversation).

**Authentication:** None (uses hardcoded user ID for MVP)

**Request:**

```json
{
  "conversation_id": "conv-uuid",
  "title": "Trip Plan - 2025-11-09 14:30",
  "places": [
    {
      "place_name": "Paris, France",
      "display_order": 0
    },
    {
      "place_name": "Lyon, France",
      "display_order": 1
    }
  ]
}
```

**Validation:**

```typescript
const CreateTripSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  places: z
    .array(
      z.object({
        place_name: z.string().min(1),
        display_order: z.number().int().min(0),
      })
    )
    .min(1),
});
```

**Response:**

```json
{
  "id": "trip-uuid",
  "user_id": "user-uuid",
  "conversation_id": "conv-uuid",
  "title": "Trip Plan - 2025-11-09 14:30",
  "places": [...],
  "created_at": "2025-11-09T14:30:00Z",
  "updated_at": "2025-11-09T14:30:00Z"
}
```

**Success:** `201 Created`

**Errors:**

- `400 Bad Request` - Invalid input or place validation failures
- `404 Not Found` - Conversation not found
- `422 Unprocessable Entity` - Place validation failed (cannot find place in Google Maps)

**Business Logic:**

1. **Validate places through Google Maps API:**

   ```typescript
   // For each place_name:
   const validationResult = await googleMapsClient.geocode(place_name);
   if (!validationResult.place_id || !validationResult.coordinates) {
     throw new PlaceValidationError(place_name);
   }
   ```

2. **UPSERT places to cache:**

   ```sql
   INSERT INTO places (google_place_id, name, latitude, longitude, validation_status, last_updated_at)
   VALUES (...)
   ON CONFLICT (google_place_id)
   DO UPDATE SET last_updated_at = NOW()
   RETURNING id;
   ```

3. **Build places_data JSONB:**

   ```typescript
   const places_data = [
     {
       placeId: "place-uuid-1",
       displayOrder: 0,
       attractionIds: [],
       restaurantIds: [],
     },
   ];
   ```

4. **Insert trip:**
   ```sql
   INSERT INTO trips (user_id, conversation_id, title, places_data)
   VALUES ($1, $2, $3, $4)
   RETURNING *;
   ```

**Implementation Notes:**

- Place validation occurs during trip creation
- Invalid places cause the entire request to fail (atomic)
- Places are cached for reuse across trips and users
- `conversation_id` is optional (can create standalone trip)
- Empty `attractionIds` and `restaurantIds` arrays initially
- Uses hardcoded user ID: `00000000-0000-0000-0000-000000000001`

---

#### PUT /api/trips/:id

Update a trip (auto-save from map interface).

**Authentication:** None (uses hardcoded user ID for MVP)

**Request:**

```json
{
  "title": "Updated Trip Title",
  "places": [
    {
      "place_name": "Paris, France",
      "display_order": 0,
      "attraction_ids": ["attraction-uuid-1", "attraction-uuid-2"],
      "restaurant_ids": ["restaurant-uuid-1"]
    }
  ]
}
```

**Validation:**

```typescript
const UpdateTripSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  places: z
    .array(
      z.object({
        place_name: z.string().min(1),
        display_order: z.number().int().min(0),
        attraction_ids: z.array(z.string().uuid()).optional(),
        restaurant_ids: z.array(z.string().uuid()).optional(),
      })
    )
    .optional(),
});
```

**Response:**

```json
{
  "id": "trip-uuid",
  "updated_at": "2025-11-09T15:45:00Z"
}
```

**Success:** `200 OK`

**Errors:**

- `400 Bad Request` - Invalid input
- `404 Not Found` - Trip not found

**Business Logic:**

1. **Validate places** (if places array provided)
2. **UPSERT places to cache** (same as create)
3. **Build new places_data JSONB**
4. **Update trip atomically:**
   ```sql
   UPDATE trips
   SET
     title = COALESCE($1, title),
     places_data = COALESCE($2, places_data),
     updated_at = NOW()
   WHERE id = $3 AND user_id = $4
   RETURNING id, updated_at;
   ```

**Implementation Notes:**

- Entire `places_data` JSONB replaced atomically
- Frontend debounces updates (500ms) to reduce API calls
- Title and places can be updated independently or together
- Returns minimal response for performance (full trip not needed)
- Uses hardcoded user ID in WHERE clause

---

#### DELETE /api/trips/:id

Delete a trip.

**Authentication:** None (uses hardcoded user ID for MVP)

**Response:**

```json
{
  "id": "trip-uuid",
  "deleted": true
}
```

**Success:** `200 OK`

**Errors:**

- `404 Not Found` - Trip not found

**Implementation Notes:**

- Uses hardcoded user ID in WHERE clause
- Deleting trip doesn't affect conversation (foreign key: `ON DELETE SET NULL`)

---

### 4.5 Places

#### POST /api/places/validate

Validate a place name through Google Maps (used when adding to itinerary).

**Authentication:** None (no user ID needed for place validation)

**Request:**

```json
{
  "place_name": "Paris, France"
}
```

**Validation:**

```typescript
const ValidatePlaceSchema = z.object({
  place_name: z.string().min(1).max(200),
});
```

**Response:**

```json
{
  "place_name": "Paris, France",
  "validated": true,
  "place": {
    "id": "place-uuid",
    "google_place_id": "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
    "name": "Paris, France",
    "latitude": 48.856614,
    "longitude": 2.3522219,
    "photos": [
      {
        "photoReference": "AeJxP...",
        "width": 1600,
        "height": 1200
      }
    ],
    "validation_status": "verified"
  }
}
```

**Success:** `200 OK`

**Errors:**

- `400 Bad Request` - Invalid input
- `404 Not Found` - Place not found in Google Maps
- `422 Unprocessable Entity` - Place found but missing required data (coordinates)
- `503 Service Unavailable` - Google Maps API unavailable

**Business Logic:**

1. **Check cache first:**

   ```sql
   SELECT * FROM places
   WHERE name ILIKE $1
     AND last_updated_at > NOW() - INTERVAL '7 days'
   LIMIT 1;
   ```

2. **If cache miss, call Google Maps Geocoding API:**

   ```typescript
   const result = await googleMapsClient.geocode(place_name);
   if (!result.place_id || !result.coordinates) {
     throw new PlaceNotFoundError(place_name);
   }
   ```

3. **UPSERT to cache:**
   ```sql
   INSERT INTO places (google_place_id, name, latitude, longitude, photos, validation_status, last_updated_at)
   VALUES (...)
   ON CONFLICT (google_place_id)
   DO UPDATE SET
     name = EXCLUDED.name,
     latitude = EXCLUDED.latitude,
     longitude = EXCLUDED.longitude,
     photos = EXCLUDED.photos,
     validation_status = EXCLUDED.validation_status,
     last_updated_at = NOW()
   RETURNING *;
   ```

**Implementation Notes:**

- This endpoint is used when user clicks "Add to itinerary" in chat
- Cache-first strategy reduces API costs
- Returns validated place with coordinates required for map display

---

#### GET /api/places/:id

Get details for a specific place.

**Authentication:** None (places are globally readable)

**Response:**

```json
{
  "id": "place-uuid",
  "google_place_id": "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
  "name": "Paris, France",
  "latitude": 48.856614,
  "longitude": 2.3522219,
  "photos": [...],
  "validation_status": "verified",
  "created_at": "2025-11-09T14:30:00Z",
  "updated_at": "2025-11-09T14:30:00Z",
  "last_updated_at": "2025-11-09T14:30:00Z"
}
```

**Success:** `200 OK`

**Errors:**

- `404 Not Found` - Place not found

**Implementation Notes:**

- Places are globally readable (shared cache)
- No user ID filtering required

---

### 4.6 Attractions & Restaurants

#### GET /api/attractions

Discover nearby attractions with quality scoring.

**Authentication:** None (attractions are globally readable)

**Query Parameters:**

- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius` (optional): Search radius in meters (default: 5000, max: 50000)
- `limit` (optional): Number of results (default: 20, max: 50)

**Example:** `GET /api/attractions?lat=48.856614&lng=2.3522219&radius=5000&limit=20`

**Response:**

```json
{
  "attractions": [
    {
      "id": "attraction-uuid",
      "google_place_id": "ChIJLU7jZClu5kcR4PcOOO6p3I0",
      "type": "attraction",
      "name": "Eiffel Tower",
      "rating": 4.7,
      "user_ratings_total": 234567,
      "types": ["tourist_attraction", "point_of_interest"],
      "vicinity": "Champ de Mars, 5 Avenue Anatole France",
      "latitude": 48.85837,
      "longitude": 2.294481,
      "photos": [
        {
          "photoReference": "AeJxP...",
          "width": 1600,
          "height": 1200
        }
      ],
      "quality_score": 0.95,
      "diversity_score": 0.87,
      "confidence_score": 0.92,
      "scores_explanation": {
        "quality": "High rating (4.7) with many reviews (234k+)",
        "diversity": "Tourist attraction with unique characteristics",
        "confidence": "Complete data with photos and high review count"
      }
    }
  ],
  "center": {
    "lat": 48.856614,
    "lng": 2.3522219
  },
  "radius": 5000
}
```

**Success:** `200 OK`

**Errors:**

- `400 Bad Request` - Invalid coordinates or radius
- `503 Service Unavailable` - Google Maps API unavailable

**Business Logic:**

1. **Check cache (spatial query):**

   ```sql
   SELECT * FROM attractions
   WHERE type = 'attraction'
     AND latitude BETWEEN $1 - $offset AND $1 + $offset
     AND longitude BETWEEN $2 - $offset AND $2 + $offset
     AND last_updated_at > NOW() - INTERVAL '7 days'
   LIMIT $3;
   ```

2. **If insufficient cached results, call Google Maps Nearby Search API:**

   ```typescript
   const results = await googleMapsClient.nearbySearch({
     location: { lat, lng },
     radius,
     type: "tourist_attraction",
   });
   ```

3. **Calculate scores (using domain logic):**

   ```typescript
   // domain/map/scoring/attractions.ts
   const quality_score = calculateQualityScore(rating, user_ratings_total);
   const diversity_score = calculateDiversityScore(types);
   const confidence_score = calculateConfidenceScore(data_completeness);
   ```

4. **UPSERT to cache:**

   ```sql
   INSERT INTO attractions (
     google_place_id, type, name, rating, user_ratings_total,
     types, vicinity, latitude, longitude, photos,
     quality_score, diversity_score, confidence_score,
     last_updated_at
   )
   VALUES (...)
   ON CONFLICT (google_place_id)
   DO UPDATE SET
     rating = EXCLUDED.rating,
     user_ratings_total = EXCLUDED.user_ratings_total,
     quality_score = EXCLUDED.quality_score,
     diversity_score = EXCLUDED.diversity_score,
     confidence_score = EXCLUDED.confidence_score,
     last_updated_at = NOW()
   RETURNING *;
   ```

5. **Sort by scores:**
   - Primary: `quality_score DESC`
   - Secondary: `confidence_score DESC`
   - Tertiary: `diversity_score DESC`

**Implementation Notes:**

- Use private Google Maps API key (server-side)
- Cache results for 7 days
- Return score explanations for transparency
- Spatial query uses bounding box for efficient filtering
- Attractions discovery is generic (not persona-driven)

---

#### GET /api/restaurants

Discover nearby restaurants with scoring.

**Authentication:** None (restaurants are globally readable)

**Query Parameters:**

- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius` (optional): Search radius in meters (default: 2000, max: 10000)
- `limit` (optional): Number of results (default: 20, max: 50)
- `price_level` (optional): Filter by price level (0-4, comma-separated)

**Example:** `GET /api/restaurants?lat=48.856614&lng=2.3522219&radius=2000&price_level=2,3`

**Response:**

```json
{
  "restaurants": [
    {
      "id": "restaurant-uuid",
      "google_place_id": "ChIJ...",
      "type": "restaurant",
      "name": "Le Jules Verne",
      "rating": 4.5,
      "user_ratings_total": 12345,
      "types": ["restaurant", "food"],
      "vicinity": "Eiffel Tower, Avenue Gustave Eiffel",
      "price_level": 4,
      "latitude": 48.858093,
      "longitude": 2.294694,
      "photos": [...],
      "quality_score": 0.88,
      "diversity_score": 0.75,
      "confidence_score": 0.90
    }
  ],
  "center": {
    "lat": 48.856614,
    "lng": 2.3522219
  },
  "radius": 2000
}
```

**Success:** `200 OK`

**Errors:**

- `400 Bad Request` - Invalid coordinates, radius, or price_level
- `503 Service Unavailable` - Google Maps API unavailable

**Business Logic:**

- Same as attractions but:
  - Filter `type = 'restaurant'`
  - Google Maps query uses `type=restaurant`
  - Apply `price_level` filter if provided
  - Smaller default radius (2km vs 5km)

**Implementation Notes:**

- Shares same `attractions` table (discriminated by `type`)
- Use `domain/map/scoring/restaurants.ts` for restaurant-specific scoring
- Cache for 7 days

---

### 4.7 Photos

#### GET /api/photos

Retrieve a Google Maps photo (proxy endpoint).

**Authentication:** None (photos are globally accessible)

**Query Parameters:**

- `photo_reference` (required): Google Maps photo reference
- `max_width` (optional): Maximum width in pixels (default: 800, max: 1600)

**Example:** `GET /api/photos?photo_reference=AeJxP123...&max_width=800`

**Response:**

- Content-Type: `image/jpeg` or `image/png`
- Binary image data

**Success:** `200 OK`

**Errors:**

- `400 Bad Request` - Missing photo_reference
- `404 Not Found` - Photo not found
- `503 Service Unavailable` - Google Maps API unavailable

**Implementation Notes:**

- Proxy Google Maps Photo API
- Use private API key
- Stream response to client (no caching in MVP)
- API call:
  ```
  GET https://maps.googleapis.com/maps/api/place/photo?
      photoreference={photo_reference}&maxwidth={max_width}&key={api_key}
  ```

---

## 5. Authentication and Authorization (Future)

### 5.1 Current MVP Implementation

**Hardcoded User ID Approach:**

```typescript
// All API endpoints use hardcoded user ID for MVP
const HARDCODED_USER_ID = "00000000-0000-0000-0000-000000000001";

// Example usage in API route
export async function GET({ params }) {
  const userId = HARDCODED_USER_ID;

  const conversations = await db.query(
    `
    SELECT * FROM conversations
    WHERE user_id = $1
    ORDER BY created_at DESC
  `,
    [userId]
  );

  return new Response(JSON.stringify({ conversations }));
}
```

**Database Setup:**

- RLS policies disabled in development (migration: `20251109140001_disable_rls_policies_for_dev.sql`)
- All queries include `user_id = '00000000-0000-0000-0000-000000000001'` in WHERE clause
- Data structure ready for multi-user support (just need to swap hardcoded ID with authenticated user ID)

---

## 6. Validation and Business Logic

### 6.1 Input Validation (Zod Schemas)

All endpoints use Zod schemas for input validation. Schemas are defined in:

- `application/*/inputs.ts` - Input validation without transforms
- Validation occurs before calling use cases

**Common Validation Rules:**

| Field             | Validation                                                                          |
| ----------------- | ----------------------------------------------------------------------------------- |
| UUIDs             | `z.string().uuid()`                                                                 |
| Coordinates       | `latitude: z.number().min(-90).max(90)`, `longitude: z.number().min(-180).max(180)` |
| Persona Types     | `z.enum(['general_tourist', 'nature_lover', ...])`                                  |
| Validation Status | `z.enum(['verified', 'not_found', 'partial'])`                                      |
| Price Level       | `z.number().int().min(0).max(4)`                                                    |
| Timestamps        | `z.string().datetime()`                                                             |

**Example:**

```typescript
// application/plan/inputs.ts
export const CreateConversationInputSchema = z.object({
  title: z.string().min(1).max(200),
  personas: z
    .array(
      z.enum([
        "general_tourist",
        "nature_lover",
        "art_enthusiast",
        "foodie_traveler",
        "adventure_seeker",
        "digital_nomad",
        "history_buff",
        "photography_enthusiast",
      ])
    )
    .min(1)
    .max(8),
  initial_message: z.string().min(1).max(2000),
});
```

### 6.2 Output Validation (with Transforms)

Output schemas defined in:

- `application/*/outputs.ts` - Output validation with transforms to branded types

**Example:**

```typescript
// application/map/places/outputs.ts
export const PlaceOutputSchema = z.object({
  id: z.string().uuid().transform(PlaceId),
  google_place_id: z.string(),
  name: z.string(),
  latitude: z.number().transform(Latitude),
  longitude: z.number().transform(Longitude),
  photos: z.array(PhotoSchema).optional(),
  validation_status: z.enum(["verified", "not_found", "partial"]),
});
```

### 6.3 Database Constraints

All database CHECK constraints are mirrored in Zod schemas:

```sql
-- Database
CHECK (latitude >= -90 AND latitude <= 90)
CHECK (longitude >= -180 AND longitude <= 180)
CHECK (price_level >= 0 AND price_level <= 4)
CHECK (type IN ('attraction', 'restaurant'))
CHECK (validation_status IN ('verified', 'not_found', 'partial'))
```

```typescript
// Zod
z.number().min(-90).max(90);
z.number().min(-180).max(180);
z.number().int().min(0).max(4);
z.enum(["attraction", "restaurant"]);
z.enum(["verified", "not_found", "partial"]);
```

### 6.4 Business Logic Implementation

#### Cache-First Strategy

**For Places:**

```typescript
async function validatePlace(placeName: string) {
  // 1. Check cache
  const cached = await db.queryOne(
    `
    SELECT * FROM places
    WHERE name ILIKE $1
      AND last_updated_at > NOW() - INTERVAL '7 days'
  `,
    [placeName]
  );

  if (cached) {
    return cached;
  }

  // 2. Call Google Maps Geocoding API
  const result = await googleMapsClient.geocode(placeName);

  if (!result.place_id || !result.coordinates) {
    throw new PlaceNotFoundError(placeName);
  }

  // 3. UPSERT to cache
  const place = await db.upsertPlace(result);

  return place;
}
```

**For Attractions:**

```typescript
async function getAttractions(lat: number, lng: number, radius: number) {
  // 1. Check cache (spatial query)
  const offset = radius / 111320; // Convert meters to degrees
  const cached = await db.query(
    `
    SELECT * FROM attractions
    WHERE type = 'attraction'
      AND latitude BETWEEN $1 - $2 AND $1 + $2
      AND longitude BETWEEN $3 - $4 AND $3 + $4
      AND last_updated_at > NOW() - INTERVAL '7 days'
  `,
    [lat, offset, lng, offset]
  );

  if (cached.length >= minimumResults) {
    return cached;
  }

  // 2. Call Google Maps Nearby Search API
  const apiResults = await googleMapsClient.nearbySearch({
    location: { lat, lng },
    radius,
    type: "tourist_attraction",
  });

  // 3. Calculate scores
  const scored = apiResults.map((place) => ({
    ...place,
    quality_score: calculateQualityScore(place),
    diversity_score: calculateDiversityScore(place),
    confidence_score: calculateConfidenceScore(place),
  }));

  // 4. UPSERT to cache
  await db.upsertAttractions(scored);

  // 5. Return combined and sorted results
  return sortByScores([...cached, ...scored]);
}
```

#### Atomic JSONB Update

**For Conversations:**

```typescript
async function addMessage(conversationId: UUID, userId: UUID, message: string) {
  // 1. Load conversation
  const conversation = await db.queryOne(
    `
    SELECT * FROM conversations
    WHERE id = $1 AND user_id = $2
  `,
    [conversationId, userId]
  );

  // 2. Call OpenAI with history
  const aiResponse = await travelPlanningChat({
    message,
    personas: conversation.personas,
    conversationHistory: conversation.messages,
  });

  // 3. Build new messages array
  const newMessages = [
    ...conversation.messages,
    { id: uuid(), role: "user", content: message, timestamp: new Date().toISOString() },
    aiResponse,
  ];

  // 4. Update atomically
  await db.query(
    `
    UPDATE conversations
    SET messages = $1, updated_at = NOW()
    WHERE id = $2 AND user_id = $3
  `,
    [JSON.stringify(newMessages), conversationId, userId]
  );
}
```

**For Trips:**

```typescript
async function updateTrip(tripId: UUID, userId: UUID, places: PlaceUpdate[]) {
  // 1. Validate places
  const validatedPlaces = await Promise.all(places.map((p) => validatePlace(p.place_name)));

  // 2. Build places_data JSONB
  const places_data = places.map((p, i) => ({
    placeId: validatedPlaces[i].id,
    displayOrder: p.display_order,
    attractionIds: p.attraction_ids || [],
    restaurantIds: p.restaurant_ids || [],
  }));

  // 3. Update atomically
  await db.query(
    `
    UPDATE trips
    SET places_data = $1, updated_at = NOW()
    WHERE id = $2 AND user_id = $3
  `,
    [JSON.stringify(places_data), tripId, userId]
  );
}
```

#### Batch Loading

**For Trip Details:**

```typescript
async function getTrip(tripId: UUID, userId: UUID) {
  // 1. Load trip
  const trip = await db.queryOne(
    `
    SELECT * FROM trips WHERE id = $1 AND user_id = $2
  `,
    [tripId, userId]
  );

  // 2. Extract IDs from places_data
  const placeIds = trip.places_data.map((p) => p.placeId);
  const attractionIds = trip.places_data.flatMap((p) => p.attractionIds);
  const restaurantIds = trip.places_data.flatMap((p) => p.restaurantIds);

  // 3. Batch load (3 queries total, no N+1)
  const [places, attractions, restaurants] = await Promise.all([
    db.query(`SELECT * FROM places WHERE id = ANY($1)`, [placeIds]),
    db.query(`SELECT * FROM attractions WHERE id = ANY($1)`, [attractionIds]),
    db.query(`SELECT * FROM attractions WHERE id = ANY($1)`, [restaurantIds]),
  ]);

  // 4. Build nested structure
  return buildTripResponse(trip, places, attractions, restaurants);
}
```

---

## 7. Error Handling

### 7.1 HTTP Status Codes

| Code                      | Usage                                                                  |
| ------------------------- | ---------------------------------------------------------------------- |
| 200 OK                    | Successful GET, PUT, DELETE requests                                   |
| 201 Created               | Successful POST requests creating new resources                        |
| 400 Bad Request           | Invalid input (validation failure)                                     |
| 404 Not Found             | Resource doesn't exist                                                 |
| 422 Unprocessable Entity  | Valid input but business logic failure (e.g., place validation failed) |
| 429 Too Many Requests     | Rate limit exceeded                                                    |
| 500 Internal Server Error | Unexpected server error                                                |
| 503 Service Unavailable   | External API unavailable (Google Maps, OpenAI)                         |

### 7.2 Error Response Format

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    "field": "Specific field error",
    "code": "ERROR_CODE"
  }
}
```

**Example (Validation Error):**

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": {
    "persona_types": "Must be one of: general_tourist, nature_lover, ...",
    "code": "INVALID_PERSONA_TYPE"
  }
}
```

**Example (Business Logic Error):**

```json
{
  "error": "Place Not Found",
  "message": "Unable to locate 'Invalid Place' in Google Maps",
  "details": {
    "place_name": "Invalid Place",
    "validation_status": "not_found",
    "code": "PLACE_NOT_FOUND"
  }
}
```

### 7.3 Effect Error Handling

All server-side code uses Effect for error handling:

```typescript
// Tagged errors in domain layer
class PlaceNotFoundError {
  readonly _tag = "PlaceNotFoundError";
  constructor(public placeName: string) {}
}

class PlaceValidationError {
  readonly _tag = "PlaceValidationError";
  constructor(
    public placeName: string,
    public reason: string
  ) {}
}

class ValidationError {
  readonly _tag = "ValidationError";
  constructor(public issues: z.ZodIssue[]) {}
}

// Error mapping in API route
const handleErrors = Effect.catchTags({
  PlaceNotFoundError: (error) =>
    Effect.succeed(
      new Response(
        JSON.stringify({
          error: "Place Not Found",
          message: `Unable to locate '${error.placeName}' in Google Maps`,
          details: { code: "PLACE_NOT_FOUND", place_name: error.placeName },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    ),

  ValidationError: (error) =>
    Effect.succeed(
      new Response(
        JSON.stringify({
          error: "Validation Error",
          message: "Invalid input data",
          details: { code: "VALIDATION_ERROR", issues: error.issues },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    ),

  GoogleMapsAPIError: (error) =>
    Effect.succeed(
      new Response(
        JSON.stringify({
          error: "Service Unavailable",
          message: "Google Maps API is currently unavailable",
          details: { code: "GOOGLE_MAPS_UNAVAILABLE" },
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      )
    ),
});
```

---

## 8. Performance Optimizations

### 8.1 Caching Strategy

**7-Day Cache Policy:**

- Places cached for 7 days (`last_updated_at`)
- Attractions/restaurants cached for 7 days
- Background job refreshes stale data
- Fallback to stale cache if API fails

**Cache Keys:**

- Primary: `google_place_id` (unique index)
- Secondary: Spatial queries for nearby searches

**Cache Invalidation:**

- Time-based only (7 days)
- No manual invalidation in MVP
- Future: Webhook-based updates from Google Maps

### 8.2 Database Indexes

```sql
-- User-scoped query indexes (for history/listing endpoints)
CREATE INDEX idx_conversations_user_id ON conversations(user_id, created_at DESC);
CREATE INDEX idx_trips_user_id ON trips(user_id, created_at DESC);

-- Cache lookups (most common queries)
CREATE UNIQUE INDEX idx_places_google_place_id ON places(google_place_id);
CREATE UNIQUE INDEX idx_attractions_google_place_id ON attractions(google_place_id);

-- Staleness tracking (for background refresh jobs)
CREATE INDEX idx_places_last_updated ON places(last_updated_at);
CREATE INDEX idx_attractions_last_updated ON attractions(last_updated_at);

-- Spatial queries (for nearby searches)
CREATE INDEX idx_attractions_location ON attractions(latitude, longitude);

-- Relationship enforcement
CREATE UNIQUE INDEX idx_trips_conversation_id ON trips(conversation_id)
  WHERE conversation_id IS NOT NULL;
```

### 8.3 Query Optimization

**Spatial Queries for Nearby Search:**

```sql
-- Efficient bounding box search
SELECT * FROM attractions
WHERE type = 'attraction'
  AND latitude BETWEEN $1 - $2 AND $1 + $2
  AND longitude BETWEEN $3 - $4 AND $3 + $4
  AND last_updated_at > NOW() - INTERVAL '7 days'
ORDER BY quality_score DESC, confidence_score DESC
LIMIT $5;
```

**Cache Freshness Check:**

```sql
-- Check if cache needs refresh
SELECT * FROM places
WHERE google_place_id = $1
  AND last_updated_at > NOW() - INTERVAL '7 days';
```

**Batch Loading:**

```sql
-- Load multiple places/attractions in single query
SELECT * FROM places WHERE id = ANY($1::UUID[]);
SELECT * FROM attractions WHERE id = ANY($1::UUID[]);
```

### 8.4 Client-Side Optimizations

**Debounced Auto-Save:**

- 500ms debounce for trip updates from map interface
- Reduces API calls during rapid user interactions
- Optimistic UI updates for instant feedback

**Result Limits:**

- Conversations list: Returns all conversations
- Trips list: Returns all trips
- Attractions/restaurants: 20 items per request (default, max: 50)

---

## 9. Security Considerations

### 9.1 API Key Security

**Google Maps API Keys:**

- Private key (server-side only, no restrictions) for geocoding, nearby search, photos
- Public key (client-side, domain-restricted) for map display only
- Never expose private key to client

**OpenAI API Key:**

- Server-side only
- Never exposed to client
- Rate limiting enforced

### 9.2 Input Sanitization

- All inputs validated with Zod schemas
- SQL injection prevented by parameterized queries
- XSS prevented by content-type enforcement
- JSONB injection prevented by type validation
- No user-provided SQL or dynamic queries

### 9.3 Rate Limiting

**Recommendations (per authenticated user):**

- AI chat: 10 requests/minute
- Place validation: 20 requests/minute
- Attractions/restaurants: 30 requests/minute
- Trip updates: 10 requests/minute
- General: 100 requests/minute

**Implementation:**

- Use Astro middleware with in-memory cache
- Return `429 Too Many Requests` with `Retry-After` header
- Consider Cloudflare rate limiting for production

### 9.4 MVP Security Notes

**Current State:**

- No authentication (hardcoded user ID)
- Suitable for development and testing only
- Not production-ready

---

## 10. Deployment Considerations

### 10.1 Environment Variables

```bash
# Supabase (database and auth)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=public-key
SUPABASE_SERVICE_ROLE_KEY=service-key

# Google Maps
GOOGLE_MAPS_API_KEY_SERVER=private-key
GOOGLE_MAPS_API_KEY_CLIENT=public-key

# OpenAI (via OpenRouter)
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-...

# App Config
NODE_ENV=production
PORT=3000
PUBLIC_APP_URL=https://tripgenie.com
```

### 10.2 Database Migrations

**Migration Tool:** Supabase CLI

**Migration Files:**

```
supabase/migrations/
├── 20251109140000_initial_schema.sql
├── 20251109140001_disable_rls_policies_for_dev.sql
└── [future migrations]
```

**Execution:**

```bash
supabase db push
```

### 10.3 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Indexes created
- [ ] RLS policies enabled
- [ ] API keys secured and rotated
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up
- [ ] Error tracking configured
- [ ] Backup strategy implemented
- [ ] HTTPS enforced

---

## 11. Summary

This API plan provides a comprehensive foundation for TripGenie's user-authenticated, persona-driven trip planning application. Key features include:

✅ **User authentication** - Supabase Auth with JWT tokens
✅ **Persona-based recommendations** - Eight predefined personas with persistent preferences
✅ **AI chat interface** - OpenAI-powered place recommendations with conversation history
✅ **Place validation** - Google Maps integration for geocoding and validation
✅ **Trip planning** - Itinerary building with auto-save functionality
✅ **Cache-first strategy** - Minimize Google Maps API costs with 7-day cache policy
✅ **Smart scoring system** - Quality, diversity, and confidence metrics for attractions/restaurants
✅ **Type-safe validation** - Zod schemas for all inputs and outputs
✅ **Effect-based architecture** - Clean, composable error handling and business logic
✅ **Row Level Security** - Supabase RLS policies for user data protection
✅ **Batch loading** - Efficient queries to avoid N+1 problems

The API supports:

- **User management** (hardcoded user ID for MVP, Supabase Auth later)
- **Persona selection** with persistent preferences
- **AI-powered chat** for place recommendations
- **Place validation** through Google Maps
- **Trip planning** with ordered places and attractions
- **Attraction discovery** with quality scoring
- **Photo proxying** for Google Maps images
- **Auto-save** for map changes

All user data is scoped and protected, enabling a secure, personalized trip planning experience.
