# `/plan` Route Features

A comprehensive guide to all features available on the `/plan` page of the Trip Planner application.

**Audience:** End users and developers working on the application.

**Note:** This document describes features specific to the `/plan` route. Other routes (e.g., `/map`) have separate functionality not covered here.

## Overview

The `/plan` page is an AI-powered conversational interface for discovering travel destinations and building custom itineraries through natural language chat with travel style personalization.

---

## Core Features

### 1. AI Travel Assistant Chat

Get intelligent place recommendations through natural conversation with an AI assistant that understands your travel style.

**User capabilities:**

- Chat naturally about places you want to visit
- Select up to 8 different travel style personas (Art Enthusiast, Nature Lover, Foodie, etc.)
- Receive 5-8 diverse place suggestions in the first response
- Continue conversation with follow-up questions for refined suggestions (max 5 new places per response)
- View AI's step-by-step reasoning process (collapsible chain-of-thought)
- See photo previews for each suggested place (when available)
- Click place names in narrative text to highlight corresponding suggestions
- Add suggested places directly to your itinerary with one click
- Validate places automatically against Google Maps before adding
- Start new conversations while preserving current one

**Technical details:**

- Uses OpenRouter API with JSON structured output mode (compatible with Claude, GPT-4, etc.)
- Extended reasoning with `reasoningEffort: "high"` for better suggestions
- Two-stage AI process:
  1. **Suggestion generation**: AI returns structured JSON with places, descriptions, reasoning, and thinking steps
  2. **Narrative generation** (first message only): AI creates engaging flowing narrative from structured data
- Persona-aware system prompts that guide AI based on selected travel styles
- Smart validation pipeline:
  - Each suggested place validated against Google Places Text Search API
  - Concurrent validation (3 places at a time) for performance
  - Unverified places filtered out with user notification
  - Validated places get coordinates, Google Place IDs, and photos
- Real-time place validation when adding to itinerary:
  - Places with Google Place IDs skip re-validation
  - Other places validated via `/api/places/search` endpoint
  - Duplicate detection by ID, name, and coordinates
- Conversation context maintained across all messages
- Auto-scroll to bottom when new messages arrive
- Loading skeleton during AI processing
- Markdown-style bold formatting (**Place Name**) for clickable place names

### 2. Persona Selector

Personalize your recommendations by selecting travel styles that match your interests.

**User capabilities:**

- Choose from 8 distinct traveler personas:
  - **General Tourist**: Popular destinations and well-known attractions
  - **Nature Lover**: Outdoor activities, parks, and natural landscapes
  - **Art Enthusiast**: Museums, galleries, and cultural experiences
  - **Foodie Traveler**: Culinary experiences, local cuisine, and food markets
  - **Adventure Seeker**: Extreme sports, hiking trails, and adrenaline activities
  - **Digital Nomad**: Co-working spaces, cafes with WiFi, and work-friendly spots
  - **History Buff**: Historical sites, monuments, and heritage tours
  - **Photography Enthusiast**: Scenic viewpoints, Instagram-worthy spots, and unique perspectives
- Select multiple personas simultaneously (at least one required)
- Visual badges with icons representing each persona
- Hover effects and selection states for better UX
- **Desktop**: Always visible at top of page
- **Mobile**: Compact view in chat header showing 2-3 visible personas + overflow count, expandable via popover

**Technical details:**

- Branded types using Effect for type-safe persona handling
- Persona metadata includes label, description, and Lucide icon name
- Database persistence via Supabase (saved automatically on change)
- Personas sent with every AI request to influence suggestions
- Mobile: Dynamic calculation of visible persona badges based on container width
- ResizeObserver for responsive badge display
- Fallback to "General Tourist" if no selection

### 3. Itinerary Builder

Organize and manage your selected places before exporting them to the interactive map.

**User capabilities:**

- Add places from AI suggestions with automatic validation
- View all selected places in a vertical list
- Drag-and-drop to reorder places
- Remove places from itinerary
- See place coordinates for reference
- Export entire itinerary to `/map` route with one click
- Empty state guidance when no places added

**Technical details:**

- Uses `@dnd-kit` for accessible drag-and-drop functionality:
  - PointerSensor for mouse/touch interactions
  - KeyboardSensor for accessible keyboard navigation
  - SortableContext with vertical list strategy
- Auto-save itinerary to localStorage on every change
- Grip handle icon for drag affordance
- Place count badge in header
- "Show on Map" button creates trip and navigates to `/map?tripId={id}&conversationId={id}`
- Disabled state when empty
- Places stored as domain `Place` objects with coordinates and metadata

### 4. Conversation History & Management

Save, resume, and manage your travel planning conversations with full context preservation.

**User capabilities:**

- Automatic saving of conversations as you chat
- View all saved conversations with metadata:
  - Conversation title (derived from first message)
  - Selected personas
  - Message count
  - Associated trip place count (if exported)
  - Relative timestamps ("Today", "Yesterday", "3 days ago")
- Continue previous conversations with full context restored
- Delete conversations (with confirmation)
- Open associated trips directly in map view
- Visual indicator when viewing a saved conversation
- "New Chat" button to start fresh conversation
- Unsaved changes prompt when switching conversations

**Technical details:**

- Database persistence via Supabase (conversations table)
- Auto-save on every message (debounced)
- Conversation metadata:
  - UUID identifier
  - Created/updated timestamps
  - Message array (JSON)
  - Persona array
  - Associated trip ID (optional)
- URL parameter support: `?conversationId={id}` for direct linking
- Trip-to-conversation linking for bidirectional navigation
- Async loading of trips for each conversation (parallel with concurrency)
- Confirmation dialog when switching conversations with unsaved messages
- History panel loads all conversations on page load
- Relative time formatting for user-friendly timestamps
- Cascade considerations: Deleting conversation doesn't delete associated trip

### 5. Place Suggestions with Rich Metadata

AI-generated place suggestions include comprehensive information to help you decide.

**User capabilities:**

- View place name, description, and reasoning for each suggestion
- See why each place matches your selected personas
- Preview top-rated photo for each place (when available)
- Visual feedback while places are being validated
- Click "Add to Itinerary" button on each suggestion card
- Disabled/checkmark state for already-added places
- Suggestions persist in chat history across sessions

**Technical details:**

- Suggestion data structure:
  - `id`: Google Place ID (after validation)
  - `name`: Clean, searchable place name
  - `description`: Brief overview of the place
  - `reasoning`: Why it matches user's personas
  - `lat/lng`: Coordinates (after validation)
  - `photos`: Array of Google Places photos with references
  - `validationStatus`: "verified" | "not_found"
  - `searchQuery`: Query used for validation
- Photo integration:
  - Photos pulled from Google Places Text Search API
  - Top photo displayed as preview (400px width)
  - Graceful fallback when photos unavailable
- Validation states:
  - Loading spinner during validation
  - Success state with checkmark
  - Error handling with user feedback
  - Duplicate detection before adding

### 6. Narrative Display with Interactive Place Names

Engaging, flowing narratives with clickable place names for better context.

**User capabilities:**

- Read natural, paragraph-style descriptions (first message only)
- Click on bold place names to highlight corresponding suggestion cards
- Better contextual understanding of why places are recommended
- Subsequent messages show standard JSON message content for continuity

**Technical details:**

- Two-stage generation for first message:
  1. Structured data generation (JSON mode)
  2. Narrative text generation from structured data
- Markdown-style formatting: `**Place Name**` rendered as bold, clickable text
- React component parses narrative text and creates clickable spans
- Click handler scrolls to and highlights corresponding suggestion card
- Higher temperature (0.8) for narrative generation to encourage creativity
- Fallback to simple message if narrative generation fails
- Place name matching case-insensitive for reliability

### 7. Trip Export & Integration

Seamlessly move from planning to exploration by exporting your itinerary to the interactive map.

**User capabilities:**

- One-click "Show on Map" export from itinerary panel
- Automatic trip creation in database
- Conversation-trip linking for context preservation
- Navigate back to conversation from map view via URL parameter
- Associated trips visible in conversation history
- Open trips directly from conversation history

**Technical details:**

- Export flow:
  1. Save/create conversation (if messages exist)
  2. Create trip in database with all places
  3. Link trip to conversation (if applicable)
  4. Clear localStorage itinerary
  5. Navigate to `/map?tripId={id}&conversationId={id}`
- Trip data includes:
  - All places with coordinates
  - Planned attractions/restaurants (empty initially)
  - Link to source conversation (optional)
  - Timestamps for audit trail
- Bidirectional navigation:
  - Map → Plan: "Back to conversation" button
  - Plan → Map: "Show on Map" button
  - History → Map: "Show on Map" button for each trip
- Database relations:
  - `trips.conversation_id` → `conversations.id` (nullable foreign key)
  - Allows trips without conversations (e.g., from map-only usage)

### 8. Responsive Mobile Experience

Optimized mobile interface with native bottom navigation and full-screen drawers.

**User capabilities:**

- Native mobile bottom navigation with 3 tabs:
  - **Assistant**: AI chat interface with persona selector
  - **Itinerary**: List of saved places with export functionality
  - **History**: Saved conversations with trip links
- Badge indicators showing counts on Itinerary and History tabs
- Persona selector in compact header view (2-3 visible + overflow count)
- Full-screen drawers for Itinerary and History panels
- Touch-optimized spacing and button sizes
- Swipe-to-dismiss drawer gestures
- Auto-switch to Assistant tab when loading conversations
- Safe area support for devices with notches

**Technical details:**

- Mobile detection: `window.innerWidth < 640px` with resize listener
- Shared `MobileNavigation` component with plan-specific tabs
- Uses `vaul` library for native-feeling drawer animations
- Drawer configuration:
  - 85vh height for comfortable viewing
  - 20px bottom padding for safe area
  - Persistent header with title and count
  - ScrollArea for content overflow
- Tab state management in parent component
- Dynamic persona badge calculation with ResizeObserver
- Popover-based persona selector on mobile
- Active tab state synchronized with drawer open state
- Bottom navigation sticky with elevation shadow

### 9. Conversation Persistence & Auto-save

Seamless background saving of all conversations and user preferences.

**User capabilities:**

- Automatic conversation saving as you chat (no manual save needed)
- Visual indicator showing saved conversation state
- Resume conversations from history via URL parameters
- Persona preferences saved automatically
- Itinerary saved to localStorage for quick recovery
- No data loss on page refresh or navigation

**Technical details:**

- **Conversations**: Supabase database persistence
  - Auto-save on every message via `onMessagesChange` callback
  - Debounced updates to avoid excessive writes
  - Create conversation on first save if doesn't exist
  - Update existing conversation with new messages
  - Includes personas, messages, and metadata
- **Personas**: Supabase database persistence
  - Saved immediately on change
  - Loaded on page mount
  - Fallback to default ("General Tourist") if load fails
- **Itinerary**: localStorage persistence
  - Key: `current-itinerary`
  - JSON serialized array of places
  - Cleared after successful export to map
  - Loaded only if no conversation URL parameter
- **Loading flow**:
  1. Load personas from database
  2. Load conversations list
  3. Check URL for conversationId
  4. If conversationId: Load conversation + associated trip
  5. If no conversationId: Load itinerary from localStorage
- **Error handling**:
  - Console errors for failed saves
  - Fallback to default state if loading fails
  - TODO: User-facing error toasts

---

## Data Flow

1. **Initial Load**: Load personas + conversations list → Check URL for conversationId → Load conversation/trip OR load localStorage itinerary → Render UI
2. **Chat Interaction**: User types message → Send to `/api/plan` with personas + history → AI generates structured response + narrative → Validate places against Google Maps → Filter unverified → Display suggestions
3. **Place Addition**: User clicks "Add to Itinerary" → Validate place (if needed) → Check duplicates → Add to itinerary → Save to localStorage → Update badge count
4. **Conversation Save**: Messages change → Auto-save to database → Update conversation list → Maintain URL parameter sync
5. **History Navigation**: User clicks conversation → Check unsaved changes → Show save dialog OR load conversation → Fetch associated trip → Update itinerary → Update URL → Switch to Assistant tab (mobile)
6. **Export to Map**: User clicks "Show on Map" → Save/create conversation → Create trip → Link trip to conversation → Clear localStorage → Navigate to `/map?tripId={id}&conversationId={id}`

## State Management

- **Personas**: Array of PersonaType (branded strings), persisted to database
- **Itinerary**: Array of Place objects, persisted to localStorage
- **Conversation State**:
  - `currentConversationId`: ConversationId | null
  - `conversationMessages`: ChatMessage[] (role + content + suggestions + thinking)
  - Auto-sync with database on changes
- **Conversation History**: Array of SavedConversation objects, loaded from database
- **UI State**:
  - Desktop: Active tab (itinerary/history)
  - Mobile: Active mobile tab (assistant/itinerary/history), drawer open states
  - Validation loading states per place ID (Set<string>)
  - Save dialog state for unsaved changes
- **Pending Actions**: `pendingConversationId` for deferred conversation loading
- **Mobile**: `isMobile` boolean, `visiblePersonaCount` for responsive badge display

## AI System Prompts

### Suggestion Generation Prompt

- **Purpose**: Generate structured place suggestions based on user query and personas
- **Response Format**: JSON with `thinking`, `message`, and `places` arrays
- **Key Instructions**:
  - Suggest specific exploration hubs (cities, neighborhoods, districts, trailheads)
  - Avoid individual attractions or restaurants (users discover those on map)
  - First response: 5-8 diverse places
  - Subsequent responses: Max 5 new places
  - Clean, searchable place names for Google Maps
  - Consider user's selected personas
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Reasoning**: High effort for better suggestions

### Narrative Generation Prompt (First Message Only)

- **Purpose**: Transform structured suggestions into flowing narrative
- **Response Format**: Plain text paragraph with `**Place Name**` markers
- **Key Instructions**:
  - 1-2 sentences per place
  - Warm, conversational tone
  - Place names can appear anywhere in sentences
  - One continuous paragraph
  - Explain why places match user's personas
- **Temperature**: 0.8 (more creative)

## API Endpoints

- **`POST /api/plan`**: Main chat endpoint
  - Input: `{ message, personas, conversationHistory }`
  - Output: `{ message, suggestedPlaces, thinking }`
  - Calls `TravelPlanningChat` use case
  - Validates places against Google Maps
  - Generates narrative for first message
  
- **`POST /api/places/search`**: Place validation endpoint
  - Input: `{ query }`
  - Output: `{ place: { id, name, lat, lng } }`
  - Used for validation when adding suggestions
  
- **`GET /api/conversations`**: Get all user conversations
- **`POST /api/conversations`**: Create new conversation
- **`PUT /api/conversations/:id`**: Update conversation messages
- **`DELETE /api/conversations/:id`**: Delete conversation
- **`GET /api/conversations/:id/trip`**: Get trip for conversation

## Database Schema

### conversations table

- `id` (uuid, primary key)
- `user_id` (uuid, foreign key) - TODO: implement auth
- `messages` (jsonb) - Array of ChatMessage objects
- `personas` (text[]) - Array of persona type strings
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `title` (text) - Derived from first message
- `message_count` (integer) - Computed

### trips table

- `id` (uuid, primary key)
- `user_id` (uuid, foreign key) - TODO: implement auth
- `conversation_id` (uuid, foreign key, nullable) - Link to source conversation
- `places` (jsonb) - Array of Place objects
- `created_at` (timestamp)
- `updated_at` (timestamp)

### user_personas table

- `user_id` (uuid, primary key)
- `personas` (text[]) - Array of selected persona types
- `updated_at` (timestamp)

## Key Dependencies

- **Effect**: Functional error handling, dependency injection, Effect.gen composition
- **OpenRouter API**: AI completions with structured output (JSON mode) and reasoning
- **Google Maps API**: Place validation via Text Search
- **@dnd-kit**: Drag-and-drop for itinerary reordering
- **vaul**: Native drawer components for mobile
- **Supabase**: Database persistence for conversations, trips, personas
- **Zod**: Schema validation for API inputs/outputs
- **Shadcn/ui**: UI components (Card, Badge, Button, ScrollArea, Drawer, etc.)

## Future Enhancements (TODOs in Code)

- **Error Toasts**: User-facing error notifications (currently console.error)
- **Authentication**: User accounts and auth-protected data
- **Conversation Titles**: Allow user-editable conversation titles
- **Multi-turn Refinement**: Better handling of conversation context for iterative refinement
- **Photo Lightbox**: Full-screen photo viewing in suggestions
- **Trip Notes**: Add notes/descriptions to saved trips
- **Share Conversations**: Export/share conversations and itineraries
- **Offline Support**: Service worker for offline conversation viewing

