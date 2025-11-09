-- ============================================================================
-- Migration: Initial TripGenie Schema
-- Created: 2025-11-09 14:00:00 UTC
-- ============================================================================
--
-- PURPOSE:
--   Creates the complete database schema for TripGenie trip planning application.
--   Implements a hybrid architecture combining normalized cache tables (places, 
--   attractions) with JSONB-embedded structures (messages, trip data) for optimal
--   performance and flexibility.
--
-- AFFECTED TABLES:
--   - user_personas: User persona preferences
--   - conversations: Chat conversations with embedded messages
--   - places: Cached Google Maps place data (cities, landmarks)
--   - attractions: Cached Google Maps attractions and restaurants
--   - trips: User trip plans with JSONB references
--
-- SPECIAL CONSIDERATIONS:
--   - Uses JSONB for flexible data structures (messages, trip places)
--   - Normalized cache tables for API call optimization
--   - 30-day cache refresh policy via last_updated_at timestamps
--   - RLS enabled but policies deferred for MVP (application-layer security)
--   - Foreign keys use ON DELETE CASCADE for automatic cleanup
--
-- ============================================================================

-- enable uuid generation extension
create extension if not exists "pgcrypto";

-- ============================================================================
-- TABLE: user_personas
-- ============================================================================
-- Stores user persona preferences that persist across sessions.
-- Each user has one record with a JSONB array of selected persona types.
-- Conversations snapshot these preferences at creation time.
--
-- Valid persona types:
--   - general_tourist, nature_lover, art_enthusiast, foodie_traveler
--   - adventure_seeker, digital_nomad, history_buff, photography_enthusiast
-- ============================================================================

create table user_personas (
  -- foreign key to supabase auth.users
  user_id uuid primary key references auth.users(id) on delete cascade,
  
  -- jsonb array of persona type strings
  -- default to general_tourist if none selected
  persona_types jsonb not null default '["general_tourist"]',
  
  -- audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add table comment for documentation
comment on table user_personas is 'Stores user persona preferences that persist across sessions';
comment on column user_personas.persona_types is 'JSONB array of persona type strings (e.g., ["foodie_traveler", "adventure_seeker"])';

-- ============================================================================
-- TABLE: conversations
-- ============================================================================
-- Stores chat conversations between user and AI assistant.
-- Messages are embedded as JSONB array for atomic updates and simple loading.
-- Personas are snapshotted at conversation creation time.
--
-- Message structure: [{"id": "uuid", "role": "user|assistant|system", 
--   "content": "...", "timestamp": "...", "suggestedPlaces": [...]}]
--
-- Loading strategy: Entire conversation loaded at once (no pagination for MVP)
-- ============================================================================

create table conversations (
  -- primary key
  id uuid primary key default gen_random_uuid(),
  
  -- owner of the conversation
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- conversation title for display
  title text not null,
  
  -- snapshot of user's personas at conversation creation time
  personas jsonb not null default '["general_tourist"]',
  
  -- embedded array of message objects
  messages jsonb not null default '[]',
  
  -- audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add table comments for documentation
comment on table conversations is 'Stores chat conversations with AI, messages embedded as JSONB for atomic updates';
comment on column conversations.personas is 'Snapshot of user personas at conversation creation time';
comment on column conversations.messages is 'JSONB array: [{"id": "uuid", "role": "user|assistant", "content": "...", "timestamp": "...", "suggestedPlaces": [...]}]';

-- ============================================================================
-- TABLE: places
-- ============================================================================
-- Normalized cache table for Google Maps place data (cities, landmarks, districts).
-- Optimizes API calls by caching place information for reuse across trips and users.
--
-- Cache strategy:
--   1. Check cache before calling Google Maps API
--   2. If missing or stale (> 30 days), fetch from API
--   3. UPSERT to cache
--   4. Reuse cached data for cost savings
--
-- Validation status tracks whether place data could be verified with Google Maps
-- ============================================================================

create table places (
  -- internal place identifier
  id uuid primary key default gen_random_uuid(),
  
  -- google maps place id (unique for lookups)
  google_place_id text unique not null,
  
  -- place name for display
  name text not null,
  
  -- coordinates with validation constraints
  latitude float not null check (latitude >= -90 and latitude <= 90),
  longitude float not null check (longitude >= -180 and longitude <= 180),
  
  -- jsonb array of photo objects from google maps api
  -- structure: [{"photoReference": "...", "width": 1600, "height": 1200}]
  photos jsonb,
  
  -- validation status from google maps api
  -- verified: place found and validated
  -- not_found: place id not found in google maps
  -- partial: some data available but incomplete
  validation_status text check (validation_status in ('verified', 'not_found', 'partial')),
  
  -- audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- last api data refresh timestamp (for 30-day refresh policy)
  last_updated_at timestamptz not null default now()
);

-- add table comments for documentation
comment on table places is 'Normalized cache for Google Maps place data (cities, landmarks) to minimize API calls';
comment on column places.google_place_id is 'Unique Google Maps Place ID for API lookups';
comment on column places.last_updated_at is 'Last API data refresh timestamp - used for 30-day refresh policy';
comment on column places.validation_status is 'Tracks whether place data could be verified: verified, not_found, or partial';

-- ============================================================================
-- TABLE: attractions
-- ============================================================================
-- Normalized cache table for attractions AND restaurants from Google Maps API.
-- Combines both types in a single table since they share identical schema.
-- Discriminated by 'type' column: 'attraction' or 'restaurant'
--
-- Stores pre-calculated scoring metrics:
--   - quality_score: Based on rating and review count
--   - diversity_score: Variety of place types
--   - confidence_score: Overall confidence in recommendation
--
-- Cache strategy same as places table (30-day refresh policy)
-- ============================================================================

create table attractions (
  -- internal attraction identifier
  id uuid primary key default gen_random_uuid(),
  
  -- google maps place id (unique for lookups)
  google_place_id text unique not null,
  
  -- discriminator: 'attraction' or 'restaurant'
  type text not null check (type in ('attraction', 'restaurant')),
  
  -- attraction/restaurant name
  name text not null,
  
  -- google maps rating (0-5 scale)
  rating float,
  
  -- number of user ratings (confidence indicator)
  user_ratings_total integer,
  
  -- jsonb array of google maps place types
  -- e.g., ["tourist_attraction", "point_of_interest"]
  types jsonb,
  
  -- address or vicinity description
  vicinity text,
  
  -- price level from google maps (0-4 scale)
  -- 0: free, 1: inexpensive, 2: moderate, 3: expensive, 4: very expensive
  price_level integer check (price_level >= 0 and price_level <= 4),
  
  -- coordinates with validation constraints
  latitude float not null check (latitude >= -90 and latitude <= 90),
  longitude float not null check (longitude >= -180 and longitude <= 180),
  
  -- jsonb array of photo objects from google maps api
  photos jsonb,
  
  -- pre-calculated scoring metrics (for sorting and filtering)
  quality_score float,
  diversity_score float,
  confidence_score float,
  
  -- audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- last api data refresh timestamp (for 30-day refresh policy)
  last_updated_at timestamptz not null default now()
);

-- add table comments for documentation
comment on table attractions is 'Normalized cache for Google Maps attractions and restaurants (combined table, discriminated by type)';
comment on column attractions.type is 'Discriminator column: "attraction" or "restaurant"';
comment on column attractions.google_place_id is 'Unique Google Maps Place ID for API lookups';
comment on column attractions.quality_score is 'Pre-calculated quality score based on rating and reviews';
comment on column attractions.diversity_score is 'Pre-calculated diversity score based on place types';
comment on column attractions.confidence_score is 'Pre-calculated overall confidence score';
comment on column attractions.last_updated_at is 'Last API data refresh timestamp - used for 30-day refresh policy';

-- ============================================================================
-- TABLE: trips
-- ============================================================================
-- Stores user trip plans with JSONB references to places and attractions.
-- places_data embeds ordered list of places with nested attraction/restaurant IDs.
--
-- places_data structure:
--   [{"placeId": "uuid", "displayOrder": 0, 
--     "attractionIds": ["uuid1", "uuid2"], 
--     "restaurantIds": ["uuid3"]}]
--
-- Auto-save strategy:
--   - Entire places_data JSONB replaced atomically on each save
--   - Client debounces saves (500ms) to batch rapid changes
--   - Optimistic UI updates for instant feedback
--
-- Relationship to conversations:
--   - conversation_id is optional (can create trip without conversation)
--   - UNIQUE constraint enforces 1:1 relationship (one trip per conversation max)
--   - ON DELETE SET NULL preserves trip if conversation deleted
-- ============================================================================

create table trips (
  -- primary key
  id uuid primary key default gen_random_uuid(),
  
  -- owner of the trip
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- optional link to source conversation
  -- unique constraint enforces one trip per conversation maximum
  conversation_id uuid unique references conversations(id) on delete set null,
  
  -- trip title for display
  -- format: "Trip Plan - YYYY-MM-DD HH:MM"
  title text not null,
  
  -- embedded jsonb array of place references with nested attraction/restaurant ids
  -- enables atomic updates for auto-save and maintains display order
  places_data jsonb not null default '[]',
  
  -- audit timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add table comments for documentation
comment on table trips is 'Stores user trip plans with JSONB references to places and attractions for atomic updates';
comment on column trips.conversation_id is 'Optional link to source conversation (unique constraint enforces 1:1 relationship)';
comment on column trips.places_data is 'JSONB array: [{"placeId": "uuid", "displayOrder": 0, "attractionIds": [...], "restaurantIds": [...]}]';

-- ============================================================================
-- INDEXES: User-scoped query indexes
-- ============================================================================
-- Optimize primary user flows: conversation history and trip history pages
-- Composite indexes on (user_id, created_at DESC) enable efficient pagination
-- ============================================================================

-- conversations list page (ordered by creation date, most recent first)
create index idx_conversations_user_id on conversations(user_id, created_at desc);

-- trip history page (ordered by creation date, most recent first)
create index idx_trips_user_id on trips(user_id, created_at desc);

-- ============================================================================
-- INDEXES: Cache lookup indexes
-- ============================================================================
-- Enable efficient "does this place already exist?" queries before calling
-- expensive Google Maps API. UNIQUE constraints on google_place_id columns
-- automatically create indexes, so no additional indexes needed here.
-- ============================================================================

-- ============================================================================
-- INDEXES: Staleness tracking indexes
-- ============================================================================
-- Support background jobs to refresh old cached data (30-day refresh policy)
-- Enables efficient queries to find places/attractions needing refresh
-- ============================================================================

-- find stale places that need refreshing (last_updated_at < NOW() - INTERVAL '30 days')
create index idx_places_last_updated on places(last_updated_at);

-- find stale attractions that need refreshing (last_updated_at < NOW() - INTERVAL '30 days')
create index idx_attractions_last_updated on attractions(last_updated_at);

-- ============================================================================
-- INDEXES: Relationship enforcement index
-- ============================================================================
-- Enforce one-to-one conversation-trip relationship at database level
-- Partial unique index only applies when conversation_id IS NOT NULL
-- (allows multiple trips without conversation_id)
-- ============================================================================

-- enforce one-to-one conversation-trip relationship
-- partial index only applies when conversation_id is not null
create unique index idx_trips_conversation_id on trips(conversation_id)
  where conversation_id is not null;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on ALL tables following Supabase best practices.
-- For MVP, user tables enforce ownership via auth.uid() = user_id.
-- Cache tables (places, attractions) are globally readable by authenticated users.
-- ============================================================================

-- enable rls
alter table user_personas enable row level security;
alter table conversations enable row level security;
alter table trips enable row level security;
alter table places enable row level security;
alter table attractions enable row level security;

-- ============================================================================
-- RLS POLICIES: User-owned data
-- ============================================================================
-- For MVP, policies allow full access for authenticated users to their own data.
-- Application layer ensures queries filter by user_id = auth.uid().
-- Auth functions wrapped in subqueries for optimal query performance at scale.
--
-- Future enhancement: Add more granular policies for sharing/collaboration.
-- ============================================================================

-- user_personas: users can manage their own personas
create policy "Users can manage their own personas"
  on user_personas
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- conversations: users can manage their own conversations
create policy "Users can manage their own conversations"
  on conversations
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- trips: users can manage their own trips
create policy "Users can manage their own trips"
  on trips
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================================
-- RLS POLICIES: Shared cache tables
-- ============================================================================
-- places and attractions are shared cache tables - globally readable by all
-- authenticated users. No insert/update/delete permissions for regular users
-- (only backend services should write to cache tables).
-- ============================================================================

-- places: globally readable by authenticated users
create policy "Authenticated users can read places"
  on places
  for select
  using ((select auth.role()) = 'authenticated');

-- attractions: globally readable by authenticated users
create policy "Authenticated users can read attractions"
  on attractions
  for select
  using ((select auth.role()) = 'authenticated');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Schema created successfully with:
--   ✓ 5 tables (user_personas, conversations, places, attractions, trips)
--   ✓ 5 indexes (user queries, staleness tracking, relationship enforcement)
--   ✓ RLS enabled on all tables
--   ✓ Foreign key constraints with CASCADE cleanup
--   ✓ CHECK constraints for data validation
--   ✓ Comprehensive comments for documentation
-- ============================================================================

