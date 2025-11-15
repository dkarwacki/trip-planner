# Conversation Summary: /plan View Rebuild
**Date:** 2025-01-15 02:15
**Task:** Rebuild `/plan` view from scratch based on UX plan specifications

---

## What Works and Should Be Kept

### 1. **Project Structure and Setup** ✅
**Location:** `src/components/plan-v2/`, `src/pages/plan-v2.astro`

**What was implemented:**
- Complete component directory structure with proper organization by feature
- Barrel exports (index.ts files) for clean imports
- TypeScript types file (`types.ts`) with comprehensive interfaces
- Temporary `/plan-v2` route to avoid breaking existing functionality

**Why it works well:**
- Follows the project's Clean Architecture principles
- Maintains separation between layout/, chat/, personas/, itinerary/, library/, mobile/, shared/, and hooks/
- Type-safe with branded domain types
- Easy to navigate and understand

**Requirements fulfilled:**
- Phase 1: Project setup without disrupting existing `/plan` route
- Scalable structure for future additions

---

### 2. **Responsive Layout System** ✅
**Location:** `src/components/plan-v2/layout/`

**Components created:**
- `PlanLayout.tsx` - Main orchestrator that detects viewport size
- `DesktopLayout.tsx` - 3-column layout (Library | Chat | Itinerary)
- `MobileLayout.tsx` - Bottom nav with tab switching
- `SaveStatusIndicator.tsx` - Status display component

**Why it works well:**
- Clean separation between desktop and mobile layouts
- Responsive detection using window.innerWidth
- Proper collapsible sidebars with smooth transitions
- Mobile-first approach with safe-area insets (pb-safe utility)
- State management using React hooks (no Redux needed)

**Requirements fulfilled:**
- UX Plan Phase 3: Desktop 3-column layout
- UX Plan Phase 3: Mobile layout with bottom navigation
- Fully responsive without code duplication

---

### 3. **Persona Selection System** ✅
**Location:** `src/components/plan-v2/personas/`, `src/components/plan-v2/hooks/usePersonas.ts`

**Components created:**
- `PersonaChip.tsx` - Individual persona badge with icon
- `PersonaSelector.tsx` - Desktop multi-select interface
- `PersonaSelectorMobile.tsx` - Compact horizontal scrolling version
- `usePersonas` hook - State management with auto-save

**Why it works well:**
- Icons properly mapped from Lucide library (MapPin, TreePine, Palette, etc.)
- Multi-select with at least one persona required (fallback to general_tourist)
- Auto-saves to `/api/personas` endpoint on change
- Loading states while fetching user preferences
- Desktop shows all personas with labels, mobile shows icon-only compact version
- Accessible with proper ARIA attributes (aria-label, aria-pressed)

**Requirements fulfilled:**
- UX Plan Phase 4: Multi-select persona UI
- UX Plan Phase 4: Auto-save functionality
- UX Plan Phase 4: Desktop and mobile versions

**Integration:**
- Integrated into both DesktopLayout and MobileLayout
- Personas passed to AI chat endpoint for personalized suggestions

---

### 4. **Chat Interface** ✅
**Location:** `src/components/plan-v2/chat/`

**Components created:**
- `ChatInterface.tsx` - Main container
- `MessageList.tsx` - Auto-scrolling message feed
- `UserMessage.tsx` - Right-aligned user bubbles
- `AssistantMessage.tsx` - Left-aligned assistant bubbles with avatar
- `MessageInput.tsx` - Auto-resizing textarea with send button
- `ChatEmptyState.tsx` - Welcome message with example prompts
- `useChatMessages` hook - State management and AI integration

**Why it works well:**
- Proper message display with timestamps (toLocaleTimeString)
- Auto-scroll to bottom on new messages using useRef
- Auto-resizing textarea (adjusts height based on content)
- Keyboard shortcuts (Enter to send, Shift+Enter for newline)
- Loading states with "Thinking..." indicator
- Error handling with retry capability
- Full integration with `/api/plan` endpoint
- Conversation history properly formatted for AI context

**Requirements fulfilled:**
- UX Plan Phase 5: Complete chat interface
- UX Plan Phase 5: Message input with auto-resize
- UX Plan Phase 5: Empty state with guidance

**API Integration:**
```typescript
// Calls POST /api/plan with:
{
  message: string,
  personas: PersonaType[],
  conversation_history: { role, content }[]
}

// Receives:
{
  message: string,
  suggested_places?: PlaceSuggestion[],
  thinking?: string[]
}
```

---

### 5. **Place Suggestion Cards** ✅
**Location:** `src/components/plan-v2/chat/PlaceSuggestionCard.tsx`, `src/components/plan-v2/shared/`

**Components created:**
- `PlaceSuggestionCard.tsx` - Rich place card
- `PhotoBlock.tsx` - Image display with fallback icon
- `ValidationBadge.tsx` - Verification status (verified, not_found, partial)
- `ReasoningSection.tsx` - Collapsible reasoning display

**Why it works well:**
- Photo display with error handling and fallback to ImageIcon
- Validation status clearly indicated with color-coded badges:
  - Green checkmark = verified
  - Red warning = not_found
  - Yellow help icon = partial
  - Loading spinner = validating
- Collapsible reasoning section (collapsed by default)
- Multiple button states: normal, adding, added, already added, unverified
- Add button disabled for unverified places with clear messaging
- Responsive grid layout (2 columns on larger screens)
- Smooth animations with Tailwind transitions

**Requirements fulfilled:**
- UX Plan Phase 6: Rich place suggestion cards
- UX Plan Phase 6: Validation flow with clear status
- UX Plan Phase 6: Photo blocks with fallback

**Data flow:**
- PlaceSuggestion comes from AI response with validationStatus
- Cards rendered in grid under AssistantMessage
- onAdd callback triggers itinerary update

---

### 6. **Interactive Narrative** ✅
**Location:** `src/components/plan-v2/chat/NarrativeDisplay.tsx`

**Why it works well:**
- Case-insensitive place name matching using regex
- Regex special characters properly escaped
- Clickable place names styled as buttons with focus states
- Smooth scroll to card with highlight effect (2-second ring animation)
- Only shown for first assistant message in conversation
- Graceful fallback to plain text if parsing fails
- Proper ARIA attributes for accessibility

**Requirements fulfilled:**
- UX Plan Phase 7: Interactive narrative with clickable place names
- UX Plan Phase 7: Scroll-to-card functionality

**Implementation details:**
```typescript
// Parsing logic:
1. Build map of place names to IDs
2. Split message content by place names (case-insensitive)
3. Render matches as clickable buttons
4. Click handler scrolls to card and adds ring highlight
```

---

### 7. **Itinerary Management** ✅
**Location:** `src/components/plan-v2/itinerary/`, `src/components/plan-v2/hooks/useItinerary.ts`

**Components created:**
- `ItineraryPanel.tsx` - Desktop right sidebar with collapsible state
- `ItineraryDrawer.tsx` - Mobile full-height view
- `ItineraryList.tsx` - Drag-drop container using @dnd-kit
- `ItineraryItem.tsx` - Individual place card with drag handle
- `ItineraryEmptyState.tsx` - Empty state with guidance
- `ExportButton.tsx` - "Open Trip Map" button
- `useItinerary` hook - State management

**Why it works well:**
- Drag-and-drop reordering using @dnd-kit/sortable (already installed)
- Keyboard navigation support via @dnd-kit KeyboardSensor
- Touch support for mobile via PointerSensor
- Photo thumbnails (16x16 on mobile, larger on desktop)
- Coordinates display with MapPin icon
- Remove confirmation using browser confirm() dialog
- Empty state with helpful guidance
- Export button shows place count, disabled when empty
- Auto-switch to plan tab on mobile when place added
- Duplicate detection via addedPlaceIds Set

**Requirements fulfilled:**
- UX Plan Phase 8: Itinerary panel with drag-drop
- UX Plan Phase 8: Desktop collapsible sidebar
- UX Plan Phase 8: Mobile drawer
- UX Plan Phase 8: Export button (placeholder for trip creation)

**Current behavior:**
- Places stored in local React state (useItinerary hook)
- "Add to Plan" button fully functional
- Drag to reorder works on desktop and mobile
- Remove with confirmation works
- **NOT YET IMPLEMENTED:** Persistence to backend (planned for Phase 10)

---

### 8. **Hooks Architecture** ✅
**Location:** `src/components/plan-v2/hooks/`

**Hooks created:**
- `usePersonas.ts` - Persona selection with auto-save
- `useChatMessages.ts` - Message state and AI integration
- `useItinerary.ts` - Itinerary state management

**Why it works well:**
- Clean separation of concerns
- Proper error handling with try-catch
- Loading states tracked correctly
- useCallback for performance optimization
- TypeScript return types clearly defined

**Requirements fulfilled:**
- Clean Architecture: Presentation layer properly separated from business logic
- Reusable state management across components

---

## Where Our Approach Failed

### 1. **PhotoBlock Component - Type Mismatch** ❌
**Location:** `src/components/plan-v2/shared/PhotoBlock.tsx:38`

**The Problem:**
```typescript
// PhotoBlock.tsx tries to access photo.url
<img src={photo.url} ... />

// But PlacePhoto domain model has:
interface PlacePhoto {
  photoReference: string;  // NOT url
  width: number;
  height: number;
  attributions: string[];
}
```

**Error:**
```
Property 'url' does not exist on type 'PlacePhoto'. [2339]
```

**Why this happened:**
- Inconsistency between how photos are handled in plan-v2 vs existing map components
- Existing map components use PhotoImage component with photoReference
- Plan-v2 PhotoBlock was created assuming direct URL access
- Did not verify PlacePhoto type structure before implementing

**What we tried:**
- Created PhotoBlock component without checking existing photo handling patterns
- Should have looked at existing PhotoImage component in `src/components/common/PhotoImage.tsx`

**Correct approach should be:**
- Use existing PhotoImage component OR
- PhotoBlock should accept photoReference and use `/api/photos` endpoint
- Check `src/components/common/PhotoImage.tsx` for reference implementation

---

### 2. **Incomplete Type Definitions** ⚠️
**Location:** `src/components/plan-v2/types.ts`

**The Problem:**
```typescript
export interface ItineraryPlace {
  id: string;
  name: string;
  description?: string;
  coordinates: { lat: number; lng: number; };
  photos?: Array<{ url: string; attribution?: string; }>;  // Wrong structure
}
```

**Why this is wrong:**
- Custom photo interface doesn't match PlacePhoto domain type
- Should use PlacePhoto[] from domain models
- Creates type inconsistency across the application

**Correct approach:**
```typescript
import type { PlacePhoto } from "@/domain/common/models";

export interface ItineraryPlace {
  photos?: PlacePhoto[];  // Use domain type
}
```

---

### 3. **Missing AlertDialog Component** ❌
**Location:** `src/components/plan-v2/itinerary/ItineraryItem.tsx`

**The Problem:**
- Tried to import `@/components/ui/alert-dialog` which doesn't exist
- Build failed with: "Rollup failed to resolve import"

**What we tried:**
- Initially wrote code assuming shadcn alert-dialog was installed
- Had to fallback to browser confirm() dialog

**Resolution:**
- Replaced with window.confirm() for now
- Works but not ideal UX (native browser dialog)
- Should either install shadcn alert-dialog OR create custom dialog component

---

### 4. **Unused React Import** ⚠️
**Location:** `src/components/plan-v2/shared/PhotoBlock.tsx:1`

**The Problem:**
```typescript
import React, { useState } from "react";  // React not used
```

**Why this happened:**
- Modern React with JSX transform doesn't require React import
- TypeScript warning: 'React' is declared but its value is never read [6133]

**Not critical but should be cleaned up**

---

## What We Learned

### 1. **Photo Handling Pattern in This Project**
- **Discovery:** The project uses a centralized photo proxy pattern
- **Location:** `src/components/common/PhotoImage.tsx`
- **How it works:**
  - Photos stored as `photoReference` (Google Maps reference string)
  - PhotoImage component builds URL: `/api/photos?ref={photoReference}&maxWidth={width}`
  - Backend proxy handles Google Maps API calls
  - Browser caches photos automatically (48-hour Cache-Control headers)
- **Why this matters:** Should reuse this pattern instead of creating new photo components

### 2. **Existing Infrastructure is Comprehensive**
- **Discovery:** All API endpoints already exist
  - `/api/personas` (GET, PUT)
  - `/api/conversations` (GET, POST, PUT, DELETE)
  - `/api/conversations/:id/messages` (PUT for bulk update)
  - `/api/plan` (POST for AI chat)
- **Database tables exist:**
  - conversations (id, user_id, title, messages JSONB, personas JSONB, timestamps)
  - trips (id, user_id, conversation_id, title, places_data JSONB, timestamps)
  - user_personas (user_id, persona_types JSONB, timestamps)
- **Domain models are well-structured:**
  - Branded types for type safety (PersonaType, MessageId, ConversationId, etc.)
  - Clean separation between domain, application, and infrastructure layers

### 3. **@dnd-kit Library is Already Installed**
- **Discovery:** Project uses @dnd-kit (v6.3.1) for drag-and-drop
- **Available packages:**
  - @dnd-kit/core
  - @dnd-kit/sortable
  - @dnd-kit/utilities
- **Implementation pattern:**
  - useSortable hook for items
  - SortableContext wrapper
  - DndContext provider
  - Sensors for pointer and keyboard input

### 4. **Mobile-First Utilities**
- **Discovery:** Project has `pb-safe` utility for safe-area insets
- **Usage:** Applied to bottom of mobile layouts to avoid notch overlap
- **Pattern:** Consistently used in MobileLayout components

### 5. **Shadcn/ui Components**
- **Discovery:** Not all shadcn components are installed
- **Available:** Button, (need to verify others)
- **Not available:** AlertDialog, (possibly others)
- **Pattern:** Should check component existence before using OR install as needed

---

## Updated Problem Context

### Primary Objective
Rebuild the `/plan` view from scratch to match UX specifications in `docs/ux-plan.md`, creating a modern trip planning interface with AI-powered suggestions and itinerary management.

### Current Status: 8/17 Phases Complete (47%)

**Completed and Working:**
1. ✅ Project structure (plan-v2 route, component organization)
2. ✅ Responsive layouts (desktop 3-column, mobile tabs)
3. ✅ Persona selector (multi-select with auto-save)
4. ✅ Chat interface (AI integration, message display)
5. ✅ Place suggestion cards (validation, reasoning)
6. ✅ Interactive narrative (clickable place names)
7. ✅ Itinerary panel (drag-drop, add/remove)
8. ⚠️ **Has bugs that need fixing (see below)**

**Not Yet Implemented:**
9. Conversation library (save/load conversations)
10. Auto-save system (debounced persistence)
11. Mobile bottom navigation (already built, just listed separately)
12. Loading states (some exist, need comprehensive coverage)
13. Error handling (basic exists, needs enhancement)
14. Accessibility (ARIA present, needs review)
15. Polish & animations (basic done, needs refinement)
16. Migration (replace /plan with plan-v2)
17. Testing & bug fixes

### Critical Bugs to Fix

#### Bug 1: Photo Display Not Working
**Location:** `src/components/plan-v2/shared/PhotoBlock.tsx`

**Problem:**
- PhotoBlock tries to access `photo.url` but PlacePhoto domain type has `photoReference`
- TypeScript error: Property 'url' does not exist on type 'PlacePhoto'

**Solution Options:**
A. **Use existing PhotoImage component** (RECOMMENDED)
   - Import from `@/components/common/PhotoImage.tsx`
   - Pass `photoReference` prop
   - Benefits: Reuses existing caching and proxy logic

B. **Fix PhotoBlock to use photoReference**
   - Update to match PlacePhoto type
   - Build URL using `/api/photos?ref={photoReference}&maxWidth={width}`

**Affected Components:**
- PhotoBlock (direct)
- PlaceSuggestionCard (uses PhotoBlock)
- ItineraryItem (uses PhotoBlock)

**Test Case:**
1. Chat with AI and get place suggestions
2. Verify photos display in suggestion cards
3. Add place to itinerary
4. Verify photo displays in itinerary item

---

#### Bug 2: Type Inconsistency in ItineraryPlace
**Location:** `src/components/plan-v2/types.ts`

**Problem:**
```typescript
// Current (wrong):
photos?: Array<{ url: string; attribution?: string; }>;

// Should be:
photos?: PlacePhoto[];  // From domain
```

**Solution:**
```typescript
import type { PlacePhoto } from "@/domain/common/models";

export interface ItineraryPlace {
  id: string;
  name: string;
  description?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  photos?: PlacePhoto[];  // Use domain type
}
```

---

### Remaining Work (Phases 9-17)

#### Phase 9: Conversation Library (4-5 hours)
**Requirements:**
- Desktop: Left sidebar with conversation list
- Mobile: Drawer accessed via "Sessions" tab
- Features needed:
  - Load existing conversations from `/api/conversations`
  - Display: title, personas, message count, timestamp, trip link
  - Actions: Continue (load), Delete (with confirmation), New conversation
  - Save/discard dialog when switching conversations
  - Active conversation highlighting

**Components to Create:**
- `ConversationLibraryPanel.tsx` (desktop)
- `ConversationLibraryDrawer.tsx` (mobile)
- `ConversationList.tsx` (shared list)
- `ConversationListItem.tsx` (individual item)
- `NewConversationButton.tsx`
- `SaveConversationDialog.tsx`
- `DeleteConversationDialog.tsx`
- `useConversation` hook

**API Integration:**
- GET `/api/conversations` - list all
- GET `/api/conversations/:id` - load specific
- POST `/api/conversations` - create new
- PUT `/api/conversations/:id` - update title
- DELETE `/api/conversations/:id` - delete
- PUT `/api/conversations/:id/messages` - save messages

---

#### Phase 10: Auto-Save System (2-3 hours)
**Requirements:**
- Debounced auto-save (2s delay after last change)
- Track dirty state for: messages, personas, itinerary
- Save status indicator states: "Saving...", "Saved", "Error"
- localStorage fallback if save fails
- Restore from localStorage on reload
- Retry logic (max 3 attempts)

**What to Save:**
- New messages after AI response
- Persona changes
- Conversation title changes
- **Trip creation when exporting to map**

**Components to Create:**
- `useAutoSave` hook
- Update SaveStatusIndicator to show states

**Critical Implementation:**
- Export to map flow:
  1. Save conversation if dirty
  2. Create trip via POST `/api/trips` with places
  3. Link conversation to trip
  4. Navigate to `/map?tripId=X&conversationId=Y`

---

#### Phases 11-17: Polish & Finalize
- Phase 11: Already built (mobile bottom nav)
- Phase 12: Add skeleton loaders and loading states
- Phase 13: Comprehensive error handling with retry
- Phase 14: Full accessibility audit (ARIA, keyboard, screen reader)
- Phase 15: Animation polish (transitions, micro-interactions)
- Phase 16: Replace /plan route with plan-v2
- Phase 17: End-to-end testing and bug fixes

---

### Technical Constraints

**Must Maintain:**
- Clean Architecture (domain → application → infrastructure → presentation)
- Existing API contracts (no breaking changes)
- Existing database schema
- TypeScript strict mode
- Branded types for type safety

**Libraries in Use:**
- React 19 (functional components, hooks only)
- @dnd-kit for drag-and-drop
- Lucide for icons
- Tailwind CSS 4 for styling
- Zod for validation
- Effect for backend (not used in plan-v2 yet)

**Patterns to Follow:**
- Barrel exports (index.ts files)
- Hooks for state management (no Redux)
- Branded types from domain models
- Photo handling via PhotoImage component
- Responsive with Tailwind breakpoints
- Safe-area insets for mobile (pb-safe)

---

### Success Criteria

**Functional Requirements:**
- [ ] Fix photo display bug
- [ ] All 17 phases implemented
- [ ] Chat with AI works end-to-end
- [ ] Add places to itinerary works
- [ ] Drag-and-drop reordering works
- [ ] Conversation save/load works
- [ ] Auto-save prevents data loss
- [ ] Export to map creates trip

**Non-Functional Requirements:**
- [ ] Build succeeds without TypeScript errors
- [ ] Responsive on mobile and desktop
- [ ] Keyboard accessible
- [ ] Fast performance (no janky animations)
- [ ] No breaking changes to existing /map view

---

### Next Steps (Priority Order)

1. **Fix Bug 1: Photo Display** (HIGH PRIORITY)
   - Replace PhotoBlock with PhotoImage component
   - OR fix PhotoBlock to use photoReference
   - Verify photos display in cards and itinerary

2. **Fix Bug 2: Type Consistency** (MEDIUM PRIORITY)
   - Update ItineraryPlace to use PlacePhoto[]
   - Clean up unused React imports

3. **Implement Phase 9: Conversation Library** (NEXT FEATURE)
   - Load/save conversations
   - Switch between conversations
   - New conversation flow

4. **Implement Phase 10: Auto-Save** (CRITICAL FEATURE)
   - Debounced save to prevent data loss
   - Trip creation on export

5. **Polish Phases 12-17** (FINAL STEPS)
   - Loading states, error handling, accessibility
   - Replace /plan route
   - Full testing

---

### Files Changed in This Session

**Created:**
```
src/pages/plan-v2.astro
src/components/plan-v2/PlanPage.tsx
src/components/plan-v2/types.ts
src/components/plan-v2/index.ts

src/components/plan-v2/layout/
  PlanLayout.tsx
  DesktopLayout.tsx
  MobileLayout.tsx
  SaveStatusIndicator.tsx
  index.ts

src/components/plan-v2/chat/
  ChatInterface.tsx
  MessageList.tsx
  UserMessage.tsx
  AssistantMessage.tsx
  MessageInput.tsx
  ChatEmptyState.tsx
  PlaceSuggestionCard.tsx
  ReasoningSection.tsx
  NarrativeDisplay.tsx
  index.ts

src/components/plan-v2/personas/
  PersonaSelector.tsx
  PersonaSelectorMobile.tsx
  PersonaChip.tsx
  index.ts

src/components/plan-v2/itinerary/
  ItineraryPanel.tsx
  ItineraryDrawer.tsx
  ItineraryList.tsx
  ItineraryItem.tsx
  ExportButton.tsx
  ItineraryEmptyState.tsx
  index.ts

src/components/plan-v2/shared/
  PhotoBlock.tsx (HAS BUG)
  ValidationBadge.tsx
  index.ts

src/components/plan-v2/hooks/
  usePersonas.ts
  useChatMessages.ts
  useItinerary.ts
  index.ts

src/components/plan-v2/mobile/
  index.ts (exports not implemented yet)

src/components/plan-v2/library/
  index.ts (exports not implemented yet)
```

**Updated:**
```
docs/ux-implementation-plan.md (progress tracking)
```

**Not Created (stubs only):**
```
src/components/plan-v2/library/* (all components)
src/components/plan-v2/mobile/* (BottomNavigation, DrawerPanel)
src/components/plan-v2/shared/CollapsiblePanel.tsx
src/components/plan-v2/shared/LoadingSkeleton.tsx
src/components/plan-v2/hooks/useAutoSave.ts
src/components/plan-v2/hooks/useConversation.ts
```

---

## Conclusion

We successfully implemented **8 out of 17 phases (47%)** of the /plan view rebuild. The core functionality is working:
- Chat with AI ✅
- Place suggestions ✅
- Add to itinerary ✅
- Drag-and-drop ✅
- Responsive layouts ✅

**Critical issues to fix before continuing:**
1. Photo display (PhotoBlock vs PhotoImage mismatch)
2. Type consistency (ItineraryPlace photos property)

**Once bugs are fixed, the path forward is clear:**
1. Implement conversation library (save/load)
2. Implement auto-save system
3. Polish and test
4. Replace old /plan route

The architecture is solid and follows the project's patterns. The remaining work is mostly feature completion, not fundamental restructuring.
