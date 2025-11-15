# UX Plan

## 1. Features List

| Feature | Description | Priority | User Benefit | UX Considerations |
|--------|-------------|----------|--------------|-------------------|
| Conversational Travel Assistant | AI-driven dialogue interface that suggests hubs/areas based on user input, personas, and conversation context. | High | Users can explore ideas naturally, without complex filtering. | Keep structure readable: collapsible reasoning, clear suggestion cards, immediate “Add to Plan” action. |
| Travel Style Selector | Multi-select persona chips that influence the AI’s entire suggestion workflow. | High | Helps users shape the tone and style of recommendations instantly. | Must remain visible; mobile requires compact version with overflow. |
| Pre-Map Itinerary Builder | Curated list of chosen hubs/areas before exporting to map view. | High | Users collect, reorder, and refine destinations in one simple list. | Drag handles should be clear, actions predictable, “Open Trip Map” prominent. |
| Conversation Library | Saved history of planning sessions with titles, persona tags, message counts, and linked trips. | Medium | Offers continuity and easy return to earlier plans. | Needs clear active state and confirmation when leaving an unsaved session. |
| Rich Place Suggestions | Detailed cards with photos, reasoning, validation, and direct add-to-plan actions. | High | Helps users compare options visually and trust accuracy. | Cards must be scannable, with obvious validity and duplicate states. |
| Narrative Intro with Interactive Mentions | First AI reply delivered as a flowing story with tappable highlighted place names. | Medium | Helps users emotionally connect with suggestions while remaining actionable. | Clicking names scrolls to linked cards; narrative must not overwhelm. |
| Map Export & Sync | Flow that transforms the itinerary into a geographic trip and opens map view. | High | Smooth transition from ideation to exploration. | Provide clear “Return to Planning” on map side; no ambiguity in state. |
| Mobile-Optimized Planner UI | Bottom navigation, drawer panels, compact persona bar, touch-friendly UI. | High | Keeps full functionality usable on small screens. | Respect safe-area insets, provide large tap targets, predictable tab switching. |
| Auto-Save & State Persistence | Background saving of messages, personas, itinerary, and trip data. | High | Users never lose progress and can safely switch routes. | Keep save feedback subtle; auto-recover state on reload. |
| AI Suggestions (Map) | Per-place AI suggestions for attractions, restaurants, and tips with priorities. | High | Helps users enrich each location with meaningful stops. | Separate from “Discovery” results; keep Accept/Reject crisp. |
| Interactive Map Canvas | Pan, zoom, click-to-add, search-area update, smart markers. | High | Gives spatial context for planning. | Avoid clutter; keep search and contextual controls consistent. |
| Place Autocomplete Search | Predictive search for cities/hubs with keyboard and mouse support. | High | Instantly jump to new areas. | Clear dropdown hierarchy, avoid confusing map movements. |
| Nearby Discovery Lists | Parallel panels for attractions and restaurants with scoring, photos, and filters. | High | Helps users compare nearby points of interest. | Strong scanning hierarchy; consistent metadata; clear score logic. |
| Per-Place Planning | Add or reorder attractions/restaurants within each hub. | High | Supports day-by-day or hub-based structuring. | Clear separation of categories, intuitive drag behavior. |
| Custom Locations | Click-to-add arbitrary map points with editable labels. | Medium | Allows non-indexed landmarks. | Confirm addition, handle duplicates gracefully. |
| Mobile Map Navigation | Bottom tabs for Places, Map, Explore, and Plan with chat-return when relevant. | High | Makes map usage efficient on touch devices. | Smart auto-switching between tabs when selecting places. |
| Collapsible Desktop Sidebars | Expand/collapse side panels for maximizing map. | Medium | Offers flexibility without losing context. | Smooth animations, persistent icons, tooltip hints. |
| Trip Autosave | Debounced saving of map-based trip edits. | High | Guarantees stable trip progress. | Save indicator must be consistent with planner-side autosave. |
---

## 2. User Flows per Feature

### Conversational Travel Assistant

- User enters a message → AI processes → returns narrative (first turn) + suggestion cards + optional reasoning block.  
- User clicks a bolded place name in narrative → screen scrolls to the corresponding suggestion card.  
- User adds place → card updates to “Added”; itinerary updates live.  
- User continues conversation → new validated suggestions appear; duplicates clearly indicated.  
- User starts new conversation → system asks to save/discard unsaved messages → loads fresh session.

### Travel Style Selector

- Desktop: Always visible at top; Mobile: compact pill row in chat header.  
- User taps persona pill → toggles selected/unselected.  
- If user deselects all → system re-applies fallback persona.  
- Changes auto-save silently.  
- All AI requests include selected personas.

### Pre-Map Itinerary Builder

- When a place is added, panel shows it with drag handle and remove option.  
- User reorders hubs by dragging.  
- “Open Trip Map” button becomes active once ≥1 place exists.  
- On click → planner creates/updates conversation, creates trip, clears local itinerary → navigates to map.

### Conversation Library

- List shows titles, personas, message count, time, and trip tag.  
- Selecting an entry triggers:  
  - If unsaved messages → save/discard prompt.  
  - Loads selected conversation, personas, and any linked trip.  
- User can delete entries (confirmation required).  
- User can jump to map for entries with trips.

### Rich Place Suggestions

- Cards appear under chat message bubble.  
- Validation spinner shows until Google verification completes.  
- Verified → normal add button; unverified → disabled with small message.  
- Duplicate places show “Already added”.  
- Reasoning collapsible under description.

### Narrative Intro with Interactive Mentions

- First reply includes a narrative blob with tappable highlighted names.  
- Clicking a name scrolls to and highlights the matching suggestion card.  
- Only first message uses narrative; later messages use plain structured style.

### Map Export & Sync

- From the itinerary panel, user triggers export → system:  
  - Saves conversation if needed  
  - Creates trip with hubs  
  - Links conversation to trip  
  - Moves user to `/map?tripId=&conversationId=`  
- Map route includes “Return to Planning” button visible if conversationId is present.

### Mobile-Optimized Planner UI

- Bottom nav: Planner (chat), Hubs (itinerary), Sessions (history).  
- Itinerary drawer slides up to 85vh, with sticky header + drag handle.  
- History drawer behaves similarly.  
- Switching conversations closes drawers and loads chat.

### Auto-Save & State Persistence

- Messages changes → “Saving…” then “Saved”.  
- Errors → small retry hint.  
- Persona, messages, and itinerary restore on reload.  
- URL parameter `conversationId` takes precedence.

---

### AI Suggestions on Map

- User selects a hub on map → Explore panel shows AI suggestions control.  
- User requests suggestions → AI returns attractions (with priorities), restaurants, and tips.  
- Each suggestion has Accept/Reject.  
- Accept adds item to hub’s plan.  
- Follow-up prompts refine results using history.

### Interactive Map Canvas

- User pans/zooms → if moved far enough, “Search Nearby” appears.  
- Clicking updates discovery lists.  
- Marker selection shows details in right panel or Explore tab.  
- Clicking on map (no place) initiates custom point creation.

### Place Autocomplete Search

- User types in top search bar → predictive suggestions appear.  
- Selecting entry pans map and focuses the hub.  
- Duplicate places highlight existing entry instead of re-adding.

### Nearby Discovery Lists

- When hub selected, Attractions/Restaurants lists show photos, scores, ratings, and status.  
- Hover highlights corresponding marker.  
- Clicking opens full details dialog with photo preview and “Add to Plan”.  
- “Show high-quality only” toggle reduces list; label shows counts.

### Per-Place Planning

- Left sidebar or Plan tab shows expandable hub cards.  
- Each reveals two categories: Attractions and Dining.  
- Drag items within group to reorder.  
- Clicking item recenters map and opens details.

### Custom Locations

- Clicking empty spot → temporary green marker + popover appears.  
- Reverse geocoding resolves name; user can edit label.  
- Confirm → adds as custom hub.  
- Cancel removes temporary marker.

### Mobile Map Navigation

- Bottom nav: Hubs → Map → Explore → Plan.  
- Selecting a hub in Hubs tab switches to Explore automatically.  
- Explore uses drawers for POI lists.  
- Plan tab aggregates all planned POIs with jump-to-map behavior.  
- When conversationId present → “Back to Planning” button appears at top.

### Collapsible Desktop Sidebars

- Left and right sidebars collapse to slim rails with icons.  
- Clicking rail expands panel; tooltips clarify purpose.  
- Selecting place or viewing details can auto-expand right panel.

### Trip Autosave

- Adding/removing/reordering POIs triggers autosave after short debounce.  
- Status pill: “Saving…”, then “Saved”.  
- On error, pill becomes warning with retry action.

---

## 3. UI Components and Layout Decisions

### Cross-Route Consistency

- Shared typography, spacing, and component patterns ensure `/plan` and `/map` feel unified.  
- Consistent hierarchy:  
  - Global header  
  - Primary workspace  
  - Secondary side panels/drawers  
  - Tertiary controls  
- WCAG AA contrast, keyboard support, and ARIA semantics required throughout.

---

### `/plan` Layout

**Desktop Structure**  
- Left: Sessions/History panel  
- Center: Chat + message feed  
- Top-center: Personas  
- Right: Itinerary panel  

**Components**

- **Chat Messages**: Assistant messages can host structured suggestion sections; reasoning toggle stays inside message block.  
- **Suggestion Cards**:  
  - Photo block  
  - Name + short context (e.g. city/area)  
  - Tags + validation badge  
  - Primary CTA (“Add to Plan”)  
- **Persona Selector**: Pill/Chip UI with icons; multi-select; hover and selected states.  
- **Itinerary Panel**:  
  - Header with count  
  - Reorderable list  
  - Remove control  
  - “Open Trip Map” CTA  
- **Empty States**: Provide guidance when no suggestions or itinerary items.

**Mobile Layout**  
- Bottom nav: Chat / Plan / Sessions  
- Full-height drawers for Plan and Sessions  
- Compact persona bar in chat header  
- Safe-area spacing applied

---

### `/map` Layout

**Desktop Structure**  
- Left sidebar: Hubs list & per-hub plan  
- Center: Interactive map  
- Right sidebar: Explore panel (Attractions/Restaurants + AI suggestions)

**Components**

- **Map Toolbar**: Search field, contextual “Search Nearby” button, optional map controls.  
- **Hub Cards** (Left Panel): Expandable sections for planned attractions/dining; clear category labels.  
- **Discovery Items**: Thumbnail image, score chip, star rating, review count, category tags, open/closed status.  
- **Details Dialog**: High-quality photo, metadata, description, and primary “Add to Plan”.  
- **AI Suggestions Panel**: Prioritized groups with Accept/Reject.  
- **Custom Location Popover**: Editable field, confirm/cancel.

**Mobile Layout**

- Bottom nav: Hubs / Map / Explore / Plan  
- Explore tab uses full-height drawer  
- Plan tab aggregates across all hubs  
- “Back to Planning” shown when coming from `/plan`  
- Larger touch markers on map

---

### Accessibility & Interaction Patterns

- Clear ARIA labels for: collapse buttons, persona toggles, suggestion actions, draw handles.  
- Keyboard support for all essential actions including reordering via keyboard shortcuts.  
- Loading states must mirror final layout (skeletons).  
- Inline error messages placed near problematic actions.  
- Focus management:  
  - Opening dialogs → focus on heading  
  - Closing → return focus to triggering element  