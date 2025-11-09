# REST API Plan - TripGenie

## 1. Overview

This document defines the REST API for TripGenie, a stateless trip exploration application with AI-powered place recommendations and interactive map discovery. The API follows RESTful principles and integrates with:

- **PostgreSQL (Supabase)** for caching external API data
- **Google Maps API** for place data (geocoding, nearby search, photos)
- **OpenAI** for AI chat functionality

### Design Principles

- **Cache-first strategy**: Check database cache before calling external APIs to minimize costs
- **7-day cache freshness**: Refresh stale data via background jobs
- **Stateless operation**: No user authentication or session management
- **Zod validation**: Validate all inputs and outputs with type-safe schemas
- **Smart caching**: Use spatial queries for nearby search optimization

---

## 2. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Places | `places` | Cached Google Maps place data (cities, landmarks, districts) |
| Attractions | `attractions` | Cached attractions and restaurants with quality scoring |

**Note**: The API is stateless. All cache tables are shared globally (not user-scoped). Trip planning state is managed client-side in browser localStorage.

---

## 3. Endpoints

### 3.1 Places

#### GET /api/places/search

Search for places by name (autocomplete).

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Number of results (default: 10, max: 20)

**Example:** `GET /api/places/search?q=paris&limit=5`

**Response:**
```json
{
  "places": [
    {
      "google_place_id": "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
      "name": "Paris, France",
      "description": "Capital of France"
    },
    {
      "google_place_id": "ChIJ...",
      "name": "Paris, Texas",
      "description": "City in Texas, USA"
    }
  ]
}
```

**Success:** `200 OK`

**Errors:**
- `400 Bad Request` - Missing query parameter
- `401 Unauthorized` - Not authenticated

**Implementation Notes:**
- Use Google Maps Autocomplete API
- Cache results not required (autocomplete is cheap)
- Filter by `types: (cities|regions|localities)`

---

### 3.2 Attractions & Restaurants

#### GET /api/attractions

Discover nearby attractions with quality scoring.

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
      "latitude": 48.858370,
      "longitude": 2.294481,
      "photos": [
        {
          "photo_reference": "AeJxP...",
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
- `401 Unauthorized` - Not authenticated
- `503 Service Unavailable` - Google Maps API unavailable

**Business Logic:**

1. **Check cache (spatial query):**
   ```sql
   SELECT * FROM attractions
   WHERE type = 'attraction'
     AND latitude BETWEEN $1 - $offset AND $1 + $offset
     AND longitude BETWEEN $2 - $offset AND $2 + $offset
     AND last_updated_at > NOW() - INTERVAL '7 days';
   ```

2. **If cache miss or insufficient results, call Google Maps:**
   ```
   GET https://maps.googleapis.com/maps/api/place/nearbysearch/json?
       location={lat},{lng}&radius={radius}&type=tourist_attraction&key={api_key}
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
   INSERT INTO attractions (google_place_id, type, name, rating, ..., quality_score, diversity_score, confidence_score, last_updated_at)
   VALUES (...)
   ON CONFLICT (google_place_id)
   DO UPDATE SET ... last_updated_at = NOW();
   ```

5. **Sort by scores:**
   - Primary: `quality_score DESC`
   - Secondary: `confidence_score DESC`
   - Tertiary: `diversity_score DESC`

**Implementation Notes:**
- Use private Google Maps API key (server-side)
- Cache results for 7 days
- Return score explanations for transparency
- Index: `idx_attractions_last_updated`

---

#### GET /api/restaurants

Discover nearby restaurants with scoring.

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
- `401 Unauthorized` - Not authenticated
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

#### GET /api/photos

Retrieve a Google Maps photo.

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
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Photo not found
- `503 Service Unavailable` - Google Maps API unavailable

**Implementation Notes:**
- Proxy Google Maps Photo API
- Use private API key
- Optional: Cache photos in blob storage (future optimization)
- API call:
  ```
  GET https://maps.googleapis.com/maps/api/place/photo?
      photoreference={photo_reference}&maxwidth={max_width}&key={api_key}
  ```

---

### 4.6 AI Chat

#### POST /api/plan

Chat with AI for place recommendations (stateless).

**Request:**
```json
{
  "message": "I want to explore nature and art in Europe",
  "personas": ["nature_lover", "art_enthusiast"],
  "conversation_history": [
    {
      "role": "user",
      "content": "Previous message...",
      "timestamp": "2025-11-09T14:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Previous response...",
      "timestamp": "2025-11-09T14:01:00Z"
    }
  ]
}
```

**Validation:**
```typescript
const PlanRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  personas: PersonaTypesSchema,
  conversation_history: z.array(ChatMessageSchema).optional().default([])
});
```

**Response:**
```json
{
  "message": {
    "id": "msg-uuid",
    "role": "assistant",
    "content": "Here are some great destinations for nature and art lovers...",
    "timestamp": "2025-11-09T14:30:00Z",
    "suggested_places": [
      {
        "place_id": "ChIJ...",
        "name": "Swiss Alps",
        "reason": "Stunning mountain landscapes perfect for nature lovers"
      },
      {
        "place_id": "ChIJ...",
        "name": "Florence, Italy",
        "reason": "Renaissance art capital with world-class museums"
      }
    ],
    "thinking_process": [
      "User wants nature and art",
      "Swiss Alps for nature",
      "Florence for art museums"
    ]
  }
}
```

**Success:** `200 OK`

**Errors:**
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `429 Too Many Requests` - Rate limit exceeded
- `503 Service Unavailable` - OpenAI API unavailable

**Business Logic:**

1. **Build context from personas:**
   ```typescript
   const personaContext = personas.map(p => personaMetadata[p].description).join(', ');
   ```

2. **Call OpenAI via existing use case:**
   ```typescript
   // Use existing: application/plan/TravelPlanningChat
   const response = await travelPlanningChat({
     message,
     personas,
     conversationHistory
   });
   ```

3. **Parse AI response:**
   - Extract suggested places (must be geocodable)
   - Extract thinking process (for transparency)
   - Generate unique message ID

4. **Return structured message:**
   - No database persistence (stateless)
   - Client can optionally save to conversation

**Implementation Notes:**
- Existing use case handles OpenAI integration
- AI must suggest only places/destinations (not attractions/restaurants)
- If user asks about attractions/restaurants, AI redirects to map interface
- Response uses JSON mode for structured output

---

## 4. Validation and Business Logic

### 4.1 Input Validation (Zod Schemas)

All endpoints use Zod schemas for input validation. Schemas are defined in:
- `application/*/inputs.ts` - Input validation without transforms
- Validation occurs before calling use cases

**Common Validation Rules:**

| Field | Validation |
|-------|-----------|
| UUIDs | `z.string().uuid()` |
| Coordinates | `latitude: z.number().min(-90).max(90)`, `longitude: z.number().min(-180).max(180)` |
| Persona Types | `z.enum([...8 persona types])` |
| Validation Status | `z.enum(['verified', 'not_found', 'partial'])` |
| Price Level | `z.number().int().min(0).max(4)` |
| Timestamps | `z.string().datetime()` |

### 4.2 Output Validation (with Transforms)

Output schemas defined in:
- `application/*/outputs.ts` - Output validation with transforms to branded types

**Example:**
```typescript
const PlaceOutputSchema = z.object({
  id: z.string().uuid().transform(PlaceId),
  google_place_id: z.string(),
  name: z.string(),
  latitude: z.number().transform(Latitude),
  longitude: z.number().transform(Longitude),
  // ...
});
```

### 4.3 Database Constraints

All database CHECK constraints are mirrored in Zod schemas:

```sql
-- Database
CHECK (latitude >= -90 AND latitude <= 90)
CHECK (price_level >= 0 AND price_level <= 4)
CHECK (type IN ('attraction', 'restaurant'))
CHECK (validation_status IN ('verified', 'not_found', 'partial'))
```

```typescript
// Zod
z.number().min(-90).max(90)
z.number().int().min(0).max(4)
z.enum(['attraction', 'restaurant'])
z.enum(['verified', 'not_found', 'partial'])
```

### 4.4 Business Logic Implementation

**Cache-First Strategy:**
```typescript
async function getAttractions(lat: number, lng: number, radius: number) {
  // 1. Check cache
  const cached = await db.query(`
    SELECT * FROM attractions
    WHERE type = 'attraction'
      AND latitude BETWEEN $1 AND $2
      AND longitude BETWEEN $3 AND $4
      AND last_updated_at > NOW() - INTERVAL '7 days'
  `, [lat - offset, lat + offset, lng - offset, lng + offset]);

  if (cached.length >= minimumResults) {
    return cached;
  }

  // 2. Call API
  const apiResults = await googleMapsClient.nearbySearch({
    location: { lat, lng },
    radius,
    type: 'tourist_attraction'
  });

  // 3. Calculate scores
  const scored = apiResults.map(place => ({
    ...place,
    quality_score: calculateQualityScore(place),
    diversity_score: calculateDiversityScore(place),
    confidence_score: calculateConfidenceScore(place)
  }));

  // 4. UPSERT to cache
  await db.upsertAttractions(scored);

  // 5. Return combined results
  return [...cached, ...scored];
}
```

**Atomic JSONB Update:**
```typescript
async function updateTrip(tripId: UUID, placesData: PlacesData[]) {
  // Atomic replacement (no partial updates)
  const result = await db.query(`
    UPDATE trips
    SET places_data = $1, updated_at = NOW()
    WHERE id = $2 AND user_id = $3
    RETURNING id, updated_at
  `, [JSON.stringify(placesData), tripId, userId]);

  return result;
}
```

**Batch Loading:**
```typescript
async function getTrip(tripId: UUID, userId: UUID) {
  // 1. Load trip
  const trip = await db.queryOne(`
    SELECT * FROM trips WHERE id = $1 AND user_id = $2
  `, [tripId, userId]);

  // 2. Extract IDs
  const placeIds = trip.places_data.map(p => p.placeId);
  const attractionIds = trip.places_data.flatMap(p => p.attractionIds);
  const restaurantIds = trip.places_data.flatMap(p => p.restaurantIds);

  // 3. Batch load (3 queries total, no N+1)
  const [places, attractions, restaurants] = await Promise.all([
    db.query(`SELECT * FROM places WHERE id = ANY($1)`, [placeIds]),
    db.query(`SELECT * FROM attractions WHERE id = ANY($1)`, [attractionIds]),
    db.query(`SELECT * FROM attractions WHERE id = ANY($1)`, [restaurantIds])
  ]);

  // 4. Build nested structure
  return buildTripResponse(trip, places, attractions, restaurants);
}
```

---

## 6. Error Handling

### 6.1 HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 OK | Successful GET, POST requests |
| 400 Bad Request | Invalid input (validation failure) |
| 404 Not Found | Resource doesn't exist (place not found in Google Maps) |
| 422 Unprocessable Entity | Valid input but business logic failure (e.g., place missing coordinates) |
| 429 Too Many Requests | Rate limit exceeded |
| 500 Internal Server Error | Unexpected server error |
| 503 Service Unavailable | External API unavailable (Google Maps, OpenAI) |

### 6.2 Error Response Format

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
    "lat": "Latitude must be between -90 and 90",
    "code": "INVALID_COORDINATES"
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

### 6.3 Effect Error Handling

All server-side code uses Effect for error handling:

```typescript
// Tagged errors in use cases
class PlaceNotFoundError {
  readonly _tag = "PlaceNotFoundError";
  constructor(public placeName: string) {}
}

class ValidationError {
  readonly _tag = "ValidationError";
  constructor(public issues: z.ZodIssue[]) {}
}

// Error mapping in API route
Effect.catchTags(result, {
  PlaceNotFoundError: (error) =>
    new Response(JSON.stringify({
      error: "Place Not Found",
      message: `Unable to locate '${error.placeName}' in Google Maps`,
      details: { code: "PLACE_NOT_FOUND" }
    }), { status: 404 }),

  ValidationError: (error) =>
    new Response(JSON.stringify({
      error: "Validation Error",
      message: "Invalid input data",
      details: error.issues
    }), { status: 400 })
});
```

---

## 7. Performance Optimizations

### 7.1 Caching Strategy

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

### 7.2 Database Indexes

```sql
-- Cache lookups (most common queries)
CREATE UNIQUE INDEX idx_places_google_place_id ON places(google_place_id);
CREATE UNIQUE INDEX idx_attractions_google_place_id ON attractions(google_place_id);

-- Staleness tracking (for background refresh jobs)
CREATE INDEX idx_places_last_updated ON places(last_updated_at);
CREATE INDEX idx_attractions_last_updated ON attractions(last_updated_at);

-- Spatial queries (for nearby searches)
CREATE INDEX idx_attractions_location ON attractions(latitude, longitude);
```

### 7.3 Query Optimization

**Spatial Queries for Nearby Search:**
```sql
-- Efficient bounding box search
SELECT * FROM attractions
WHERE latitude BETWEEN $1 AND $2
  AND longitude BETWEEN $3 AND $4
  AND last_updated_at > NOW() - INTERVAL '7 days'
LIMIT $5;
```

**Cache Freshness Check:**
```sql
-- Check if cache needs refresh
SELECT COUNT(*) FROM places
WHERE google_place_id = $1
  AND last_updated_at > NOW() - INTERVAL '7 days';
```

---

## 8. Security Considerations

### 8.1 Rate Limiting

**Recommendations (per IP address):**
- AI chat: 10 requests/minute
- Place search/validation: 20 requests/minute
- Attractions/restaurants: 30 requests/minute
- General: 100 requests/minute

**Implementation:**
- Use Astro middleware with Redis or in-memory cache
- Return `429 Too Many Requests` with `Retry-After` header
- Consider Cloudflare rate limiting for production

### 8.2 Input Sanitization

- All inputs validated with Zod schemas
- SQL injection prevented by parameterized queries
- XSS prevented by content-type enforcement
- JSONB injection prevented by type validation

### 8.3 API Key Security

**Google Maps API Keys:**
- Private key (server-side only, unrestricted)
- Public key (client-side, domain-restricted)
- Never expose private key to client

**OpenAI API Key:**
- Server-side only
- Never exposed to client

---

## 9. API Versioning

### Current Approach (MVP)

- No versioning (implicit v1)
- Breaking changes avoided
- Additive changes only

### Future Approach

**URL-based versioning:**
```
/api/v1/trips
/api/v2/trips
```

**Header-based versioning:**
```
Accept: application/vnd.tripgenie.v1+json
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

- Zod schema validation
- Business logic (scoring algorithms)
- Error handling (Effect error flows)

### 10.2 Integration Tests

- API endpoint behavior
- Database operations
- External API mocking

### 10.3 E2E Tests

- User flows (Playwright)
- Authentication flows
- Trip creation and modification

---

## 11. Monitoring and Logging

### 11.1 Server-Side Logging

**Log Levels:**
- ERROR: Unexpected failures, external API errors
- WARN: Rate limits, stale cache fallbacks
- INFO: Request/response, cache hits/misses
- DEBUG: Detailed execution traces (dev only)

**Log Structure:**
```json
{
  "timestamp": "2025-11-09T14:30:00Z",
  "level": "INFO",
  "message": "Trip updated",
  "user_id": "user-uuid",
  "trip_id": "trip-uuid",
  "endpoint": "/api/trips/:id",
  "method": "PUT",
  "duration_ms": 45,
  "cache_hit": true
}
```

### 11.2 Metrics

**Key Metrics:**
- Request latency (p50, p95, p99)
- Cache hit rate (places, attractions)
- External API call frequency
- Error rate by endpoint
- Active users

### 11.3 Alerting

**Critical Alerts:**
- Error rate > 5%
- API latency > 2s (p95)
- External API unavailable > 5min
- Database connection failures

---

## 12. Deployment Considerations

### 12.1 Environment Variables

```bash
# Supabase (for database connection)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=public-key

# Google Maps
GOOGLE_MAPS_API_KEY_SERVER=private-key
GOOGLE_MAPS_API_KEY_CLIENT=public-key

# OpenAI
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-...

# App Config
NODE_ENV=production
PORT=3000
```

### 12.2 Database Migrations

**Migration Tool:** Supabase CLI

**Migration Files:**
```
supabase/migrations/
├── 20251109_01_create_cache_tables.sql
└── 20251109_02_create_indexes.sql
```

**Execution:**
```bash
supabase db push
```

### 12.3 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied (places and attractions tables)
- [ ] Indexes created (google_place_id, last_updated_at, spatial)
- [ ] API keys rotated and secured
- [ ] Rate limiting configured (per IP)
- [ ] Monitoring and alerting set up
- [ ] Cache refresh job scheduled (background)

---

## 13. Future Enhancements

### 13.1 Advanced Caching

- Redis/Valkey for faster in-memory cache layer
- CDN caching for photos and static place data
- Background job for proactive cache refresh
- Webhook integration with Google Maps for real-time updates

### 13.2 Search Enhancements

- Full-text search across place names and descriptions
- Fuzzy matching for place name typos
- Multi-language place name support
- Historical search popularity tracking

### 13.3 Analytics Endpoint

- `GET /api/analytics/popular-places` - Most searched places
- `GET /api/analytics/trending-destinations` - Trending locations
- Cache hit/miss ratio metrics
- API usage statistics

### 13.4 Batch Place Validation

- `POST /api/places/batch-validate` - Validate multiple places at once
- Reduces round-trips for itinerary planning
- Parallel Google Maps API calls with backoff

### 13.5 Advanced Scoring

- Machine learning-based quality predictions
- User feedback integration for scoring refinement
- Seasonal popularity adjustments
- Time-based attraction recommendations (e.g., open hours)

---

## 14. Summary

This API plan provides a foundation for TripGenie's stateless exploration API with smart caching. Key features include:

✅ **Stateless operation** - No authentication or user management
✅ **Cache-first strategy** - Minimize Google Maps API costs with database caching
✅ **7-day cache freshness** - Balance data accuracy with API cost optimization
✅ **Smart scoring system** - Quality, diversity, and confidence metrics for attractions
✅ **Type-safe validation** - Zod schemas for all inputs and outputs
✅ **Effect-based architecture** - Clean, composable error handling and business logic
✅ **Spatial query optimization** - Efficient nearby search with bounding boxes

The API supports:
- **Place discovery** via geocoding and search
- **Attraction exploration** with quality scoring
- **Restaurant recommendations** with rating-based filtering
- **AI-powered planning** via OpenAI integration
- **Photo proxying** for Google Maps images

All trip planning state is managed client-side in browser localStorage, keeping the API simple, scalable, and cost-effective.