# PRD Alignment Review

**Review Date:** 2025-11-08  
**Reviewed Against:** `.ai/prd.md`

## Executive Summary

This document identifies misalignments between the PRD specifications and the current codebase implementation. The application has several features implemented correctly, but there are critical gaps in authentication, persona implementation, and auto-save functionality.

---

## 🔴 Critical Misalignments

### 1. Authentication (US-001) - NOT IMPLEMENTED

**PRD Requirement:**
- Google OAuth integration for user authentication (required for all access)
- User profile storage including name and email
- Session management and secure access control
- Unauthenticated users cannot access any application features

**Current State:**
- ❌ No authentication implementation found
- ❌ Application is fully accessible without login
- ❌ No user profile storage
- ❌ No session management

**Impact:** HIGH - This is listed as "In Scope for MVP" and required for access

**Files to Create/Modify:**
- Authentication middleware needed
- User profile storage system
- Session management layer

---

### 2. Persona Count Mismatch (US-002)

**PRD Requirement:**
- Four persona options: general tourist, nature lover, first-time visitor, art enthusiast

**Current State:**
- ❌ Code has **8 personas** instead of 4
- Current personas in `src/domain/plan/models/Persona.ts`:
  1. General Tourist ✅
  2. Nature Lover ✅
  3. Art Enthusiast ✅
  4. Foodie Traveler ❌ (not in PRD)
  5. Adventure Seeker ❌ (not in PRD)
  6. Digital Nomad ❌ (not in PRD)
  7. History Buff ❌ (not in PRD - might be "first-time visitor"?)
  8. Photography Enthusiast ❌ (not in PRD)

**Impact:** MEDIUM - Affects AI prompts, UX, and product scope

**Files to Modify:**
- `src/domain/plan/models/Persona.ts`
- `src/application/plan/inputs.ts`

---

### 3. Auto-Save Functionality (US-012) - NOT IMPLEMENTED

**PRD Requirement:**
- Changes to the itinerary on /map are saved automatically without user action
- Adding/removing places on map updates the history entry
- Explicit "Save" button needed - all changes are saved once it's clicked
- Visual indicator shows when changes are being saved
- If user returns to same trip later, all modifications are preserved

**Current State:**
- ❌ No "Save" button found on map interface
- ❌ No auto-save mechanism for map changes
- ❌ Changes made on /map are NOT persisted to trip history
- ✅ Trip history loads correctly when opening from history
- ❌ But subsequent modifications are lost

**Impact:** HIGH - Core feature for trip persistence

**Files to Modify:**
- `src/components/map/MapPlanner.tsx` - Add save button and save logic
- `src/lib/common/storage.ts` - Already has `updateTripInHistory` function but it's never called

---

### 4. Persona Selection on Mobile (US-002)

**PRD Requirement:**
- Desktop shows personas in horizontal row layout ✅
- Mobile shows personas in dropdown format

**Current State:**
- ✅ Desktop: Horizontal row with badges (correct)
- ⚠️  Mobile: Uses a **Drawer** (bottom sheet) instead of dropdown
  - Implemented in `src/components/plan/PersonaSelectorDrawer.tsx`
  - Uses floating button that opens drawer
  - Functionally similar but technically not a "dropdown"

**Impact:** LOW - Functionally equivalent, just different UI pattern

**Decision Needed:** Is the drawer pattern acceptable, or must it be a dropdown?

---

## 🟡 Moderate Misalignments

### 5. Persona Default Behavior (US-003)

**PRD Requirement:**
- General tourist is pre-selected on first visit ✅
- Selecting any other persona deselects general tourist
- Deselecting all personas reverts to general tourist

**Current State:**
- ⚠️  Code in `PersonaSelector.tsx` lines 48-52:
  ```typescript
  if (isSelected) {
    const newSelection = selected.filter((p) => p !== persona);
    // Ensure at least one is selected (default to general tourist)
    onChange(newSelection.length > 0 ? newSelection : personas.slice(0, 1).map((p) => p.type));
  } else {
    onChange([...selected, persona]);
  }
  ```
- ✅ Ensures at least one persona is always selected
- ❌ Does NOT automatically deselect general tourist when other personas are selected
- ❌ Allows general tourist + other personas simultaneously

**Impact:** MEDIUM - Affects AI prompt quality and user confusion

**Files to Modify:**
- `src/components/plan/PersonaSelector.tsx` - Update toggle logic

---

### 6. Persona Persistence (US-002)

**PRD Requirement:**
- "Selections persist across sessions for logged-in users"

**Current State:**
- ⚠️  Uses localStorage in `src/lib/common/storage.ts`
- ⚠️  However, PRD planning notes say "it will reset each session" (contradictory)
- Since no auth exists, this is using local browser storage

**Impact:** LOW - Conflicting requirements in PRD documentation

**Decision Needed:** Clarify whether personas should persist or reset per session

---

## ✅ Correctly Implemented Features

### 7. Chat Interface (US-004, US-005)

- ✅ Natural language input for travel queries
- ✅ AI suggests places and destinations only
- ✅ Concise, actionable list responses
- ✅ "Show details" expandable sections per suggestion
- ✅ Persistent expanded state
- ✅ Context-aware responses based on personas
- ✅ Structured JSON responses with reasoning

**Files:** `src/application/plan/TravelPlanningChat.ts`, `src/components/plan/ChatInterface.tsx`

---

### 8. Place Validation (US-006, US-022)

- ✅ Places validated through Google Maps when added
- ✅ Validation retrieves place ID and coordinates
- ✅ Error messages if validation fails
- ✅ Failed places not added to itinerary

**Files:** `src/infrastructure/common/google-maps/GoogleMapsClient.ts`, `src/application/plan/TravelPlanningChat.ts`

---

### 9. Itinerary Management (US-007, US-008)

- ✅ Add/remove places from itinerary
- ✅ Visual confirmation of additions/removals
- ✅ Real-time itinerary count updates
- ✅ **Drag-and-drop reordering** (US-008)
- ✅ Order preserved when exporting to map
- ✅ Empty state messaging

**Files:** `src/components/plan/ItineraryPanel.tsx`, `src/components/plan/ChatPage.tsx`

---

### 10. Map Interface (US-011, US-013, US-014)

- ✅ Interactive map with markers
- ✅ Zoom and pan functionality
- ✅ Place details display
- ✅ Attractions and restaurants discovery
- ✅ Quality/diversity/confidence scoring
- ✅ Score badges with explanations
- ✅ Discovery is generic (not persona-driven)

**Files:** `src/components/map/MapPlanner.tsx`, `src/components/map/AttractionsPanel.tsx`

---

### 11. Export to Map (US-009)

- ✅ "Show on Map" button available
- ✅ Creates timestamped trip
- ✅ Redirects to /map with places
- ✅ Places appear in order from itinerary
- ✅ Initial export saved to history

**Files:** `src/components/plan/ChatPage.tsx` (lines 224-253)

---

### 12. Trip History (US-010)

- ✅ History panel accessible from planning interface
- ✅ Chronological list of past exports
- ✅ Timestamp display
- ✅ Clicking entry reopens map
- ✅ Recent trips at top

**Files:** `src/components/plan/TripHistoryPanel.tsx`, `src/lib/common/storage.ts`

---

## 📋 Summary Table

| Feature | PRD ID | Status | Priority |
|---------|--------|--------|----------|
| Google OAuth | US-001 | ❌ Not Implemented | HIGH |
| 4 Personas (not 8) | US-002 | ❌ Wrong Count | MEDIUM |
| Persona Dropdown (Mobile) | US-002 | ⚠️  Drawer Instead | LOW |
| Persona Auto-Deselect | US-003 | ❌ Not Implemented | MEDIUM |
| Chat Interface | US-004 | ✅ Implemented | - |
| Expandable Details | US-005 | ✅ Implemented | - |
| Add Place to Itinerary | US-006 | ✅ Implemented | - |
| Remove Place | US-007 | ✅ Implemented | - |
| Reorder Itinerary | US-008 | ✅ Implemented | - |
| Export to Map | US-009 | ✅ Implemented | - |
| Trip History | US-010 | ✅ Implemented | - |
| Map Interface | US-011 | ✅ Implemented | - |
| Auto-Save Map Changes | US-012 | ❌ Not Implemented | HIGH |
| Attraction Discovery | US-013 | ✅ Implemented | - |
| Score Display | US-014 | ✅ Implemented | - |
| Place Validation | US-022 | ✅ Implemented | - |

---

## 🎯 Recommended Actions

### Immediate (Critical Path)

1. **Decide on Authentication**
   - Is Google OAuth still required for MVP?
   - If yes, significant implementation needed
   - If no, update PRD to reflect localStorage-only approach

2. **Fix Persona Count**
   - Reduce from 8 to 4 personas as specified
   - Update all references and prompts
   - Alternative: Update PRD to document all 8 personas

3. **Implement Auto-Save**
   - Add "Save" button to map interface
   - Call `updateTripInHistory()` on save
   - Add visual save indicator
   - Test trip persistence across sessions

### Secondary (Quality Improvements)

4. **Fix Persona Default Behavior**
   - Auto-deselect general tourist when other personas selected
   - Ensure selection logic matches PRD

5. **Clarify Persona Persistence**
   - Resolve contradiction in PRD docs
   - Implement consistent behavior

6. **Mobile Persona UI**
   - Decide if drawer is acceptable or dropdown required
   - Update implementation or PRD accordingly

---

## 📝 Notes

### Contradictions in PRD Documentation

The PRD contains some internal contradictions:

1. **Persona Persistence:**
   - Section 3.2 says: "Persistent persona choices across sessions"
   - Planning questions doc says: "it will reset each session"

2. **Itinerary Order:**
   - Planning summary says: "unordered collections"
   - US-008 says: "ordered collection" with drag-drop reordering
   - Code implements: Ordered with drag-drop (matching US-008)

### Documentation vs Code: "First-Time Visitor" Persona

The PRD mentions "first-time visitor" as one of 4 personas, but this doesn't exist in the code. The code has "History Buff" instead. This might be:
- A renaming that wasn't updated in PRD
- Or a complete replacement
- Needs clarification

---

## 🔍 Code References

**Persona Implementation:**
- `src/domain/plan/models/Persona.ts` (lines 8-17) - 8 persona types defined
- `src/application/plan/inputs.ts` (lines 4-13) - Schema includes all 8
- `src/components/plan/PersonaSelector.tsx` - Desktop UI
- `src/components/plan/PersonaSelectorDrawer.tsx` - Mobile UI (drawer pattern)

**Storage Implementation:**
- `src/lib/common/storage.ts` - Has `updateTripInHistory()` function (line 104-127)
- This function exists but is NEVER CALLED from map components

**Map Implementation:**
- `src/components/map/MapPlanner.tsx` - Main map component
- No save button or auto-save logic found
- Loads trips from history but doesn't update them

---

## Conclusion

The application has strong core functionality implemented (chat, itinerary, map, scoring), but is missing critical features defined in the PRD:

1. **Authentication** - Completely absent but marked as MVP requirement
2. **Auto-Save** - Not implemented despite being core to trip management
3. **Persona Count** - Implementation has 100% more personas than specified

These gaps need to be addressed either by:
- Implementing the missing features, OR
- Updating the PRD to reflect the current implementation direction

