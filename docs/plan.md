# Plan: Click Attraction/Restaurant Markers to Focus List Items

## Overview

Add bidirectional interaction between map markers and list items - clicking a marker scrolls to and highlights the corresponding item in the AttractionsPanel.

## Requirements Summary

1. **Smooth scroll**: When clicking a marker, scroll smoothly to the list item
2. **Hover highlight**: Items highlight when hovered in list (existing behavior maintained)
3. **Tab-specific**: Only show markers for the active tab (attractions/restaurants)
4. **Bidirectional hover**: Hovering marker enlarges it (same as hovering list item)
5. **No selection state**: Use existing hover behavior for highlighting
6. **Marker visual feedback**: Markers enlarge on hover
7. **Closed panel**: When panel is closed, no markers are visible (no action needed)

## Implementation Steps

### 1. Add State Management (TripPlanner.tsx)

Add new state for scroll synchronization:
```tsx
const [scrollToAttractionId, setScrollToAttractionId] = useState<string | null>(null);
```

Add callback to clear scroll state:
```tsx
const handleScrollComplete = useCallback(() => {
  setScrollToAttractionId(null);
}, []);
```

### 2. Add Marker Click & Hover Handlers (TripPlanner.tsx ~lines 296-316)

In the useEffect that creates attraction/restaurant markers:

```tsx
data.forEach((scored) => {
  const { attraction } = scored;

  const pinElement = document.createElement("div");
  // ... existing styling ...

  const marker = new markerLibrary.AdvancedMarkerElement({
    map,
    position: { lat: attraction.location.lat, lng: attraction.location.lng },
    content: pinElement,
    title: attraction.name,
  });

  // NEW: Add click listener to scroll to list item
  marker.addListener("click", () => {
    setScrollToAttractionId(attraction.placeId);
  });

  // NEW: Add hover listeners for bidirectional hover effect
  pinElement.addEventListener("mouseenter", () => {
    setHoveredAttractionId(attraction.placeId);
  });

  pinElement.addEventListener("mouseleave", () => {
    setHoveredAttractionId(null);
  });

  markersMap.set(attraction.placeId, { marker, element: pinElement });
});
```

### 3. Pass Props to AttractionsPanel (TripPlanner.tsx ~line 464)

Update the AttractionsPanel component call:
```tsx
<AttractionsPanel
  attractions={attractions}
  isLoadingAttractions={isLoadingAttractions}
  attractionsError={attractionsError}
  restaurants={restaurants}
  isLoadingRestaurants={isLoadingRestaurants}
  restaurantsError={restaurantsError}
  placeName={selectedPlace.name}
  onClose={handleCloseAttractions}
  onTabChange={handleTabChange}
  onAttractionHover={setHoveredAttractionId}
  scrollToAttractionId={scrollToAttractionId}  // NEW
  onScrollComplete={handleScrollComplete}      // NEW
/>
```

### 4. Update AttractionsPanel Component (AttractionsPanel.tsx)

#### Update Props Interface
```tsx
interface AttractionsPanelProps {
  // ... existing props ...
  scrollToAttractionId?: string | null;
  onScrollComplete?: () => void;
}
```

#### Update renderContent Function

Add refs parameter and logic:
```tsx
const renderContent = (
  data: AttractionScore[],
  isLoading: boolean,
  error: string | null,
  emptyMessage: string,
  type: "attractions" | "restaurants",
  onAttractionHover?: (placeId: string | null) => void,
  scrollToAttractionId?: string | null,  // NEW
  onScrollComplete?: () => void          // NEW
) => {
  // Create refs map for scrolling
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Handle scroll when scrollToAttractionId changes
  useEffect(() => {
    if (scrollToAttractionId) {
      const element = itemRefs.current.get(scrollToAttractionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        onScrollComplete?.();
      }
    }
  }, [scrollToAttractionId, onScrollComplete]);

  // ... existing loading/error/empty states ...

  // In the success state, add ref callback:
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {data.map((scored) => {
          const { attraction, score, breakdown } = scored;
          const topTypes = attraction.types.slice(0, 3);

          return (
            <div
              key={attraction.placeId}
              ref={(el) => {
                if (el) {
                  itemRefs.current.set(attraction.placeId, el);
                } else {
                  itemRefs.current.delete(attraction.placeId);
                }
              }}
              className="space-y-3 cursor-pointer rounded-lg p-2 -mx-2 transition-colors hover:bg-accent"
              onMouseEnter={() => onAttractionHover?.(attraction.placeId)}
              onMouseLeave={() => onAttractionHover?.(null)}
            >
              {/* ... existing content ... */}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
```

#### Update renderContent Calls

Pass new props to both TabsContent calls:
```tsx
<TabsContent value="attractions" className="flex-1 overflow-hidden mt-0">
  {renderContent(
    attractions,
    isLoadingAttractions,
    attractionsError,
    "No attractions found for this location.",
    "attractions",
    onAttractionHover,
    scrollToAttractionId,  // NEW
    onScrollComplete       // NEW
  )}
</TabsContent>

<TabsContent value="restaurants" className="flex-1 overflow-hidden mt-0">
  {renderContent(
    restaurants,
    isLoadingRestaurants,
    restaurantsError,
    "No restaurants found for this location.",
    "restaurants",
    onAttractionHover,
    scrollToAttractionId,  // NEW
    onScrollComplete       // NEW
  )}
</TabsContent>
```

## Technical Details

### Scroll Behavior
- Use `scrollIntoView({ behavior: 'smooth', block: 'center' })` for smooth animation
- `block: 'center'` centers the item vertically in the scroll area

### Ref Management
- Use Map<string, HTMLDivElement> for O(1) lookup by placeId
- Use ref callback pattern to populate/cleanup refs on mount/unmount

### Event Listeners
- Marker click: Google Maps API `marker.addListener("click", ...)`
- Marker hover: DOM events `addEventListener("mouseenter/mouseleave")` on pinElement

### State Flow
1. User clicks marker → `setScrollToAttractionId(placeId)`
2. Prop passed to AttractionsPanel → `scrollToAttractionId={placeId}`
3. useEffect detects change → finds ref → calls `scrollIntoView()`
4. Calls `onScrollComplete()` → clears `scrollToAttractionId` state

## Files to Modify

- `src/components/TripPlanner.tsx` - Add state, handlers, pass props
- `src/components/AttractionsPanel.tsx` - Add scroll logic with refs

## Testing Checklist

- [ ] Click attraction marker scrolls to attraction in list
- [ ] Click restaurant marker scrolls to restaurant in list
- [ ] Hover on marker enlarges it (same as hovering list item)
- [ ] Hover on list item still enlarges marker (existing behavior)
- [ ] Smooth scroll animation works
- [ ] Multiple rapid clicks don't cause issues
- [ ] Tab switching still works correctly
- [ ] No markers visible when panel is closed
