# Mobile Test Plan for map-v2 Page using Playwright MCP

## Overview

Create comprehensive mobile UI/UX tests for the map-v2 trip planning page, focusing on responsive design, safe-area-inset handling, touch interactions, and mobile-specific features on iPhone 14 Pro viewport (393x852).

## Test Approach

### Test Organization
- **Single test file**: Create test script using Playwright MCP browser tools
- **Sequential execution**: Tests run one after another to avoid state conflicts
- **iPhone 14 Pro viewport**: 393x852 with notch safe-area simulation

### Setup Requirements
1. Local dev server running at `localhost:3000`
2. Test URL parameters:
   - `tripId=6e8b03a9-2859-4e55-86d1-b3ef02c6cd21`
   - `conversationId=efd3ccb6-6c3d-444d-9739-9826329dbcc8`
3. Playwright MCP browser tools available

## Test Categories (12 Core Tests)

### 1. Layout & Responsive Design
**Test 1: Mobile Viewport and Layout Initialization**
- Verify viewport size (393x852)
- Confirm header fixed at top (48px height)
- Confirm bottom nav fixed at bottom (60px + safe-area-inset)
- Verify main content area height calculation
- Check all core components render (header buttons, tabs, map)

### 2. Safe-Area-Inset Handling
**Test 2: Bottom Navigation Safe-Area**
- Verify bottom nav `padding-bottom: calc(16px + env(safe-area-inset-bottom))`
- Confirm `position: fixed` and `bottom: 0`
- Verify `z-index: 60`

**Test 11: Floating AI Button Safe-Area**
- Verify FAB `bottom: calc(60px + 20px + env(safe-area-inset-bottom))`
- Confirm button size >= 56x56px
- Check `position: fixed` and `right: 16px`

### 3. Navigation & Tab Switching
**Test 3: Bottom Tab Navigation**
- Switch between Map ’ Discover ’ Plan tabs
- Verify active tab indicator (aria-current)
- Confirm fade-in transitions (200ms)
- Check tab content updates correctly
- Verify badge count on Plan tab (if items exist)

### 4. Overlays & Modals
**Test 4: Search Overlay**
- Open search via header button
- Verify full-screen overlay with slide-in animation
- Confirm input auto-focus
- Test Escape key closes overlay
- Verify recent searches display (if any)

**Test 8: AI Chat Modal**
- Open via Floating AI Button
- Verify full-screen modal rendering
- Confirm header, scrollable messages, fixed footer
- Test Escape key dismissal
- Verify modal closes and FAB reappears

**Test 6: Filter Bottom Sheet**
- Open filter sheet from Map view
- Verify slide-up animation and backdrop
- Confirm max-height constraint (70vh)
- Test category radio buttons interaction
- Apply filters and verify sheet closes

### 5. Floating Button Behavior
**Test 5: Floating AI Button Visibility Rules**
- Verify FAB visible on initial load
- Open AI modal ’ confirm FAB hidden
- Close modal ’ confirm FAB reappears
- (Note: Test filter sheet hiding if applicable)

### 6. Z-Index Layering
**Test 9: Z-Index Stacking Order**
- Verify header z-index: 50
- Verify bottom nav z-index: 60
- Verify floating button z-index: 40
- Verify overlays/modals z-index: 50+
- Confirm correct visual stacking

### 7. Touch Accessibility
**Test 7: Touch Target Sizes**
- Measure all interactive elements (buttons, tabs, inputs)
- Verify minimum size 44x44px (iOS) or 48x48px (Android)
- Check header buttons, bottom tabs, floating buttons, filter controls
- Report any undersized targets

### 8. View-Specific Features
**Test 10: Plan View Empty State**
- Navigate to Plan tab
- Verify empty state message ("Your itinerary is empty")
- Click "Switch to Map" CTA
- Confirm navigation to Map tab (aria-current update)

**Test 12: Discover View Scroll Behavior**
- Navigate to Discover tab
- Verify sticky header (position: sticky, top: 0)
- Simulate scroll if content available
- Confirm header remains visible during scroll

## Playwright MCP Tool Usage

### Navigation & Setup
```typescript
// Resize to iPhone 14 Pro
await browser_resize({ width: 393, height: 852 });

// Navigate to map-v2 with test IDs
await browser_navigate({
  url: 'http://localhost:3000/map-v2?tripId=6e8b03a9-2859-4e55-86d1-b3ef02c6cd21&conversationId=efd3ccb6-6c3d-444d-9739-9826329dbcc8'
});

// Wait for map initialization
await browser_wait_for({ time: 2 });
```

### Interactions
```typescript
// Click elements
await browser_click({
  element: "Discover tab",
  ref: "button:has-text('Discover')"
});

// Type in inputs
await browser_type({
  element: "Search input",
  ref: "input[placeholder*='Search']",
  text: "Paris"
});

// Press keys
await browser_press_key({ key: "Escape" });

// Wait for animations
await browser_wait_for({ time: 0.3 });
```

### Assertions
```typescript
// Accessibility tree verification (PRIMARY)
const snapshot = await browser_snapshot({});
// Check for elements in snapshot

// CSS property verification
const styles = await browser_evaluate({
  function: `() => {
    const el = document.querySelector('.selector');
    const computed = window.getComputedStyle(el);
    return { zIndex: computed.zIndex, position: computed.position };
  }`
});

// Measure element dimensions
const sizes = await browser_evaluate({
  function: `() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.map(btn => ({
      label: btn.getAttribute('aria-label'),
      width: btn.offsetWidth,
      height: btn.offsetHeight
    }));
  }`
});
```

## Implementation Flow

### Phase 1: Foundation Tests (1-3)
1. Test 1: Layout initialization
2. Test 2: Bottom nav safe-area
3. Test 3: Tab switching

### Phase 2: Overlay Tests (4-6)
4. Test 4: Search overlay
5. Test 5: Floating AI button visibility
6. Test 6: Filter bottom sheet

### Phase 3: Accessibility & Polish (7-9)
7. Test 7: Touch target sizes
8. Test 8: AI chat modal
9. Test 9: Z-index layering

### Phase 4: View-Specific Tests (10-12)
10. Test 10: Plan view empty state
11. Test 11: FAB safe-area positioning
12. Test 12: Discover scroll behavior

## Key Implementation Considerations

### Async Handling
- Wait 2s after navigation for Google Maps to load
- Wait 200-300ms for CSS transitions (slide-in, fade)
- Use `browser_wait_for({ text: "..." })` for dynamic content

### Error Handling
- Take screenshots on test failures for debugging
- Implement retry logic for flaky elements (lazy-loaded content)
- Clear localStorage between tests if state conflicts occur

### Safe-Area-Inset Testing
- Use `browser_evaluate` to compute CSS calc() formulas
- Verify actual pixel values, not just CSS strings
- Test positioning of bottom nav, FAB, and scrollable areas

### Touch Targets
- Measure bounding boxes with `offsetWidth/offsetHeight`
- Flag any elements < 44x44px for iOS compliance
- Focus on: tabs, header buttons, floating buttons, form controls

## Critical Files Reference

- `src/components/map-v2/mobile/MobileLayout.tsx` - Root orchestrator
- `src/components/map-v2/mobile/MobileBottomNav.tsx` - Tab navigation
- `src/components/map-v2/mobile/FloatingAIButton.tsx` - FAB with visibility rules
- `src/components/map-v2/mobile/SearchOverlay.tsx` - Full-screen search
- `src/components/map-v2/filters/FilterBottomSheet.tsx` - Filter UI
- `src/components/map-v2/mobile/AIChatModal.tsx` - AI chat interface
- `src/components/map-v2/mobile/views/MapView.tsx` - Map tab content
- `src/components/map-v2/mobile/views/DiscoverView.tsx` - Discover tab content
- `src/components/map-v2/mobile/views/PlanView.tsx` - Plan tab content

## Success Criteria

 All 12 tests pass consistently
 No touch targets smaller than 44x44px
 Safe-area-inset properly applied to bottom UI elements
 All overlays/modals open and close with correct animations
 Tab navigation works smoothly with state preservation
 Z-index layering prevents UI conflicts
 Keyboard interactions (Escape) work as expected
 Empty states display appropriate CTAs
