# Score Breakdown Help Tooltip Implementation Plan

## Objective
Add a help icon ("?") next to all "Score Breakdown" sections that displays a tooltip explaining how Quality Score, Diversity Score, and Locality Score are calculated.

## Current State Analysis

### Existing Implementation
- **Location**: Score Breakdown is displayed in `src/components/AttractionsPanel.tsx` (line 117)
- **Current UI**: Shows inside a tooltip when hovering over the overall score badge
- **Scoring Logic**: Implemented in `src/lib/services/attractions/scoring.ts`
  - Quality Score (40% weight): Based on rating and review count
  - Diversity Score (30% weight): Penalizes over-representation of common types
  - Locality Score (30% weight): Favors local places over tourist traps

## Implementation Plan

### Phase 1: Component Structure

#### 1.1 Create Reusable Help Icon Component
**File**: `src/components/ui/help-icon.tsx`
- Create a reusable component that wraps the Lucide `HelpCircle` icon
- Props: `content` (React.ReactNode), `side` (tooltip position), `className`
- Uses shadcn/ui Tooltip components for consistency

#### 1.2 Create Score Explanation Content Component
**File**: `src/components/ScoreExplanation.tsx`
- Create a dedicated component for the score explanations
- Structured content with clear sections for each score type
- Include formula explanations in user-friendly language

### Phase 2: UI Implementation

#### 2.1 Modify AttractionsPanel Component
**File**: `src/components/AttractionsPanel.tsx`
- Import the new HelpIcon component
- Add help icon next to "Score Breakdown" text (line 117)
- Ensure proper spacing and alignment

#### 2.2 Tooltip Content Structure
The help tooltip should display:

```
📊 How Scores Are Calculated

Quality Score (40% weight)
• Based on rating and review count
• Higher ratings with more reviews score better
• Formula: rating × log10(reviews + 1)

Diversity Score (30% weight)  
• Rewards unique place types
• Penalizes over-represented categories
• Boosts for art galleries, museums, parks, cafes

Locality Score (30% weight)
• Favors local gems over tourist traps
• Sweet spot: 500-5000 reviews
• Prefers moderate pricing ($ or $$)

Overall Score = 40% Quality + 30% Diversity + 30% Locality
```

### Phase 3: Styling & UX Considerations

#### 3.1 Visual Design
- Use a subtle help icon (12-14px size)
- Icon color: `text-muted-foreground` with hover state
- Tooltip width: ~300px for comfortable reading
- Consistent with existing tooltip styling

#### 3.2 Interaction Patterns
- Trigger: Hover on desktop, click on mobile
- Tooltip appears with slight delay (200ms)
- Ensure tooltip doesn't overlap with score values
- Consider nested tooltip handling (score tooltip + help tooltip)

### Phase 4: Accessibility

#### 4.1 ARIA Labels
- Add `aria-label="Score calculation help"`
- Ensure keyboard navigation support
- Tab-focusable help icon

#### 4.2 Screen Reader Support
- Descriptive text for screen readers
- Proper heading hierarchy in tooltip content

## Technical Decisions

### Component Architecture
1. **Separate Component**: Create dedicated components for reusability
2. **Composition**: Use component composition pattern for flexibility
3. **Type Safety**: Define TypeScript interfaces for all props

### State Management
- No additional state needed (tooltip managed by shadcn/ui)
- Content is static and doesn't change

### Performance Considerations
- Help content loaded once and reused
- No impact on initial bundle size (lazy loaded with tooltip)
- Minimal DOM additions

## Implementation Steps

### Step 1: Create Help Icon Component
```tsx
// src/components/ui/help-icon.tsx
- Import necessary dependencies (HelpCircle, Tooltip components)
- Create HelpIcon component with tooltip wrapper
- Export for use in other components
```

### Step 2: Create Score Explanation Component
```tsx
// src/components/ScoreExplanation.tsx
- Define scoring explanation content
- Structure with clear sections
- Use consistent formatting
```

### Step 3: Integrate into AttractionsPanel
```tsx
// src/components/AttractionsPanel.tsx (line 117)
- Import HelpIcon and ScoreExplanation
- Add HelpIcon next to "Score Breakdown" text
- Pass ScoreExplanation as content prop
```

### Step 4: Testing
- Verify tooltip appears on hover
- Check alignment and spacing
- Test on different screen sizes
- Ensure no z-index issues

## Alternative Approaches Considered

1. **Modal Dialog**: Too heavy for simple explanations
2. **Inline Expandable**: Would clutter the UI
3. **Separate Documentation Page**: Less discoverable
4. **Icon in Each Score Row**: Too repetitive

## Success Criteria

- [ ] Help icon visible next to "Score Breakdown" text
- [ ] Tooltip displays clear explanations for all three scores
- [ ] Consistent styling with existing UI
- [ ] Works on both desktop and mobile
- [ ] No performance impact
- [ ] Accessible via keyboard navigation

## Future Enhancements

1. **Interactive Examples**: Show example calculations
2. **Visual Charts**: Add small bar charts for score breakdown
