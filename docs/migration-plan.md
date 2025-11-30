# Migration Plan: Replace Old Map/Plan Components with V2 Versions

## Executive Summary

This plan details the safe migration from old map/plan components to v2 versions, including:

- Replacing route implementations (/map, /plan)
- Renaming component directories (map-v2 → map, plan-v2 → plan)
- Consolidating lib directories (lib/map-v2 → lib/map)
- Removing old component directories
- Updating index page
- Preserving git history where possible

**Estimated Time:** 45-60 minutes
**Risk Level:** Medium (many moving parts, but atomic with rollback strategy)

---

## Current State Analysis

### Routes

- `/map.astro` → uses `MapPlanner` from `components/map/` (client:load)
- `/map-v2.astro` → uses `MapPlannerV2` from `components/map-v2/` (client:only="react")
- `/plan.astro` → uses `ChatPage` from `components/plan/` (client:load)
- `/plan-v2.astro` → uses `PlanPage` from `components/plan-v2/` (client:only="react")

### Component Structure

- **Old map:** 12 files in `src/components/map/`
- **New map:** ~60 files across 16 subdirectories in `src/components/map-v2/`
- **Old plan:** 10 files in `src/components/plan/`
- **New plan:** ~54 files across 10 subdirectories in `src/components/plan-v2/`

### Lib Structure

- `src/lib/map/` - 1 file (map-utils.ts) - used by map-v2
- `src/lib/map-v2/` - 11 files - used by map-v2 components

### Shared Components

- `src/components/PhotoLightbox.tsx` - imports from map-v2, used by both old and new

### Import Dependencies Found

**Files importing from components/map/ (will break when deleted):**

- Internal: map/MapPlanner.tsx, map/AttractionsPanel.tsx, map/ScoreBadge.tsx, plan/ChatInterface.tsx, map/PlaceListItem.tsx
- Routes: pages/map.astro

**Files importing from components/map-v2/:**

- Internal: all map-v2 components
- External: components/PhotoLightbox.tsx, plan-v2/layout/PlanLayout.tsx
- Routes: pages/map-v2.astro
- Lib: lib/map-v2/filterPersistence.ts

**Files importing from lib/map/:**

- map/MapPlanner.tsx (OLD - will be deleted)
- map/AttractionsPanel.tsx (OLD - will be deleted)
- map/AttractionDetailsDialog.tsx (OLD - will be deleted)
- **map-v2/map/hooks/useMapSearch.ts (NEW - needs migration)**

**Files importing from lib/map-v2/:**

- 49 files within map-v2 components
- infrastructure/map/api/schemas.ts

---

## Migration Strategy

We'll use a **branch-based migration** approach:

1. Create a migration branch from current state
2. Perform all changes atomically
3. Test thoroughly
4. Merge or rollback

This is safer than trying to do partial migrations because the directory renames and import updates are highly interdependent.

---

## Detailed Step-by-Step Plan

### Phase 1: Preparation (5 min)

**1.1 Create Migration Branch**

```bash
git checkout -b migration/replace-old-components
```

**1.2 Ensure Clean Working Directory**

```bash
git status  # Should show clean tree
```

**1.3 Create Backup Tag (Safety Net)**

```bash
git tag -a pre-migration-backup -m "Backup before component migration"
```

**1.4 Document Current State**

```bash
# Count files to verify later
find src/components/map -type f | wc -l
find src/components/map-v2 -type f | wc -l
find src/components/plan -type f | wc -l
find src/components/plan-v2 -type f | wc -l
```

---

### Phase 2: Migrate Shared Components (5 min)

**2.1 Move PhotoLightbox**

```bash
# Use git mv to preserve history
git mv src/components/PhotoLightbox.tsx src/components/map-v2/shared/PhotoLightbox.tsx
```

**2.2 Update PhotoLightbox Imports**
Files to update:

- `src/components/plan-v2/chat/PlaceSuggestionCard.tsx`
- `src/components/map-v2/sidebar/ai/SuggestionCard.tsx`
- `src/components/map-v2/map/ExpandedPlaceCard.tsx`
- `src/components/map-v2/discover/PlaceListItem.tsx`
- `src/components/map-v2/discover/PlaceCard.tsx`
- `src/components/map-v2/mobile/MobileSuggestionCard.tsx`

Change from:

```typescript
import PhotoLightbox from "@/components/PhotoLightbox";
```

To:

```typescript
import PhotoLightbox from "@/components/map-v2/shared/PhotoLightbox";
```

**Note:** Old map components also import PhotoLightbox but they'll be deleted in Phase 4.

---

### Phase 3: Migrate lib/ Directories (10 min)

**3.1 Merge lib/map into lib/map-v2**

First, copy the utility to map-v2:

```bash
cp src/lib/map/map-utils.ts src/lib/map-v2/map-utils.ts
```

**3.2 Update lib/map-v2/index.ts**
Add export for map-utils:

```typescript
// Add to existing exports
export * from "./map-utils";
```

**3.3 Update Import in useMapSearch.ts**
File: `src/components/map-v2/map/hooks/useMapSearch.ts`

Change from:

```typescript
import { calculateDistance } from "@/lib/map/map-utils";
```

To:

```typescript
import { calculateDistance } from "@/lib/map-v2/map-utils";
```

**3.4 Verify No Other Imports from lib/map**

```bash
grep -r "from.*@/lib/map/" src/components/map-v2/
grep -r "from.*@/lib/map/" src/pages/
grep -r "from.*@/lib/map/" src/infrastructure/
```

Only old map/ components should appear (they'll be deleted).

**3.5 Remove Old lib/map Directory**

```bash
git rm -r src/lib/map/
```

---

### Phase 4: Delete Old Components (5 min)

**4.1 Delete Old Map Components**

```bash
git rm -r src/components/map/
```

This removes:

- MapPlanner.tsx
- AttractionsPanel.tsx
- AttractionDetailsDialog.tsx
- MarkerTooltip.tsx
- PhotoLightbox.tsx (old copy)
- PlaceAutocomplete.tsx
- PlaceListItem.tsx
- PlaceSuggestionItem.tsx
- PlaceSuggestionsButton.tsx
- ScoreBadge.tsx
- ScoreExplanation.tsx

**4.2 Delete Old Plan Components**

```bash
git rm -r src/components/plan/
```

This removes:

- ChatInterface.tsx
- ChatPage.tsx
- ConversationHistoryPanel.tsx
- ItineraryPanel.tsx
- NarrativeDisplay.tsx
- PersonaSelector.tsx
- PlannedItemsList.tsx
- SaveCurrentConversationDialog.tsx
- TripHistoryPanel.tsx

---

### Phase 5: Rename V2 Directories (15 min)

This is the critical phase. We'll use `git mv` to preserve history.

**5.1 Rename Component Directories**

```bash
# Create temporary names to avoid conflicts
git mv src/components/map-v2 src/components/map-temp
git mv src/components/plan-v2 src/components/plan-temp

# Rename to final names
git mv src/components/map-temp src/components/map
git mv src/components/plan-temp src/components/plan
```

**5.2 Rename Lib Directory**

```bash
git mv src/lib/map-v2 src/lib/map
```

**5.3 Update All Imports from map-v2 → map**

Files that import from `@/components/map-v2/*` (49+ files):

- All files within the newly renamed `src/components/map/`
- `src/components/plan/layout/PlanLayout.tsx` (formerly plan-v2)
- Infrastructure files

Strategy: Use find & replace

```bash
# Update TypeScript/TSX files
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/components/map-v2/|@/components/map/|g' {} +

# Update Astro files
find src -type f -name "*.astro" -exec sed -i '' 's|@/components/map-v2|@/components/map|g' {} +
find src -type f -name "*.astro" -exec sed -i '' 's|from "../components/map-v2"|from "../components/map"|g' {} +
```

**5.4 Update All Imports from lib/map-v2 → lib/map**

```bash
# Update all TypeScript/TSX files
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/lib/map-v2/|@/lib/map/|g' {} +
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|from.*lib/map-v2|from "@/lib/map|g' {} +
```

**5.5 Update All Imports from plan-v2 → plan**

```bash
# Update TypeScript/TSX files
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|@/components/plan-v2/|@/components/plan/|g' {} +

# Update Astro files
find src -type f -name "*.astro" -exec sed -i '' 's|@/components/plan-v2|@/components/plan|g' {} +
find src -type f -name "*.astro" -exec sed -i '' 's|from "../components/plan-v2"|from "../components/plan"|g' {} +
```

---

### Phase 6: Update Route Files (10 min)

**6.1 Update /map.astro**

File: `src/pages/map.astro`

Current:

```astro
---
import Layout from "../layouts/Layout.astro";
import MapPlanner from "../components/map/MapPlanner";

export const prerender = false;

const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY_PUBLIC || import.meta.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  throw new Error(
    "Google Maps API key is not configured. Please set GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY_PUBLIC in your .env file."
  );
}

const mapId = import.meta.env.GOOGLE_MAPS_MAP_ID;
const tripId = Astro.url.searchParams.get("tripId");
const conversationId = Astro.url.searchParams.get("conversationId");
---

<Layout title="Map Planner">
  <MapPlanner client:load apiKey={apiKey} mapId={mapId} tripId={tripId} conversationId={conversationId} />
</Layout>
```

Replace with (matching map-v2.astro structure):

```astro
---
import Layout from "../layouts/Layout.astro";
import { MapPlannerV2 } from "../components/map";

// Disable SSR for this fully interactive page
export const prerender = false;

// Get API key for map display
// Use GOOGLE_MAPS_API_KEY_PUBLIC if available (domain-restricted),
// otherwise fall back to GOOGLE_MAPS_API_KEY
const apiKey = import.meta.env.GOOGLE_MAPS_API_KEY_PUBLIC || import.meta.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  throw new Error(
    "Google Maps API key is not configured. Please set GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY_PUBLIC in your .env file."
  );
}

// Optional: Get Map ID for AdvancedMarkerElement support
const mapId = import.meta.env.GOOGLE_MAPS_MAP_ID;

// Extract URL parameters
const { searchParams } = Astro.url;
const tripId = searchParams.get("tripId") || undefined;
const conversationId = searchParams.get("conversationId") || undefined;
---

<Layout title="Trip Planner - Map">
  <MapPlannerV2 client:only="react" apiKey={apiKey} mapId={mapId} tripId={tripId} conversationId={conversationId} />
</Layout>
```

Key changes:

- Import from `"../components/map"` (uses index export from renamed directory)
- Component name: `MapPlannerV2`
- Change `client:load` → `client:only="react"`
- Update title to "Trip Planner - Map"
- Extract searchParams more cleanly
- Add comment about SSR

**6.2 Update /plan.astro**

File: `src/pages/plan.astro`

Current:

```astro
---
import Layout from "../layouts/Layout.astro";
import ChatPage from "../components/plan/ChatPage";

export const prerender = false;
---

<Layout title="Trip Planner - Chat">
  <ChatPage client:load />
</Layout>
```

Replace with (matching plan-v2.astro structure):

```astro
---
import Layout from "@/layouts/Layout.astro";
import { PlanPage } from "@/components/plan/PlanPage";

export const prerender = false;

const conversationId = Astro.url.searchParams.get("conversationId");
---

<Layout title="Trip Planner">
  <PlanPage client:only="react" conversationId={conversationId} />
</Layout>
```

Key changes:

- Import from `"@/components/plan/PlanPage"` (after rename)
- Component name: `PlanPage`
- Change `client:load` → `client:only="react"`
- Pass conversationId prop
- Update title to "Trip Planner"

**6.3 Delete Old V2 Routes**

```bash
git rm src/pages/map-v2.astro
git rm src/pages/plan-v2.astro
```

---

### Phase 7: Update Index Page (5 min)

**7.1 Update index.astro**

File: `src/pages/index.astro`

Remove the "Map v2 (Beta)" card (lines 72-98):

```astro
<a
  href="/map-v2"
  class="group p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500"
>
  <div class="flex items-center gap-4 mb-3">
    <div
      class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 text-purple-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        ></path>
      </svg>
    </div>
    <h2 class="text-2xl font-semibold text-gray-900">Map v2 (Beta)</h2>
  </div>
  <p class="text-gray-600">New redesigned map experience - testing in progress</p>
</a>
```

Change grid from `md:grid-cols-3` to `md:grid-cols-2`:

```astro
<div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"></div>
```

Update card descriptions:

- "Start Planning" card: Already good
- "Explore Map" card description: "Discover attractions and restaurants near your selected places" → "Interactive map to explore, plan, and visualize your trip"

---

### Phase 8: Verification & Testing (10-15 min)

**8.1 Verify File Structure**

```bash
# Should NOT exist
ls src/components/map-v2  # Should fail
ls src/components/plan-v2  # Should fail
ls src/lib/map-v2  # Should fail
ls src/pages/map-v2.astro  # Should fail
ls src/pages/plan-v2.astro  # Should fail

# Should exist
ls src/components/map  # Should show new map files
ls src/components/plan  # Should show new plan files
ls src/lib/map  # Should show merged lib files
```

**8.2 Check for Broken Imports**

```bash
# Search for any remaining -v2 references
grep -r "map-v2" src/
grep -r "plan-v2" src/

# Should only find in comments or non-import contexts, if any
```

**8.3 TypeScript Compilation Check**

```bash
npm run build

# Or just type check:
npx tsc --noEmit
```

**8.4 Start Development Server**

```bash
npm run dev
```

**8.5 Manual Testing Checklist**

Navigate to each route and verify:

**Test /plan:**

- [ ] Page loads without errors
- [ ] Can start a new conversation
- [ ] Persona selector works
- [ ] Chat interface responds
- [ ] Can save conversation
- [ ] Itinerary panel shows/updates
- [ ] Library drawer opens and shows conversations

**Test /map:**

- [ ] Page loads without errors
- [ ] Map renders correctly
- [ ] Can search for places
- [ ] Markers appear correctly
- [ ] Can switch between Discover/Plan/AI modes
- [ ] Trip selector works
- [ ] Mobile view works (resize browser)
- [ ] Photo lightbox opens when clicking photos
- [ ] Can add places to itinerary

**Test Navigation:**

- [ ] Index page shows only 2 cards (Plan and Map)
- [ ] Links work correctly from index
- [ ] No broken /map-v2 or /plan-v2 links

**Test URL Parameters:**

- [ ] `/map?tripId=xxx` loads trip correctly
- [ ] `/map?conversationId=xxx` loads conversation
- [ ] `/plan?conversationId=xxx` loads conversation

**8.6 Console Errors Check**
Open browser DevTools and check:

- [ ] No 404s for missing modules
- [ ] No TypeScript errors in console
- [ ] No React hydration errors
- [ ] No warnings about missing components

---

### Phase 9: Commit and Document (5 min)

**9.1 Review Changes**

```bash
git status
git diff --cached  # If already staged
git diff  # If not staged
```

**9.2 Stage All Changes**

```bash
git add -A
```

**9.3 Commit with Detailed Message**

```bash
git commit -m "refactor: migrate from old map/plan components to v2 versions

BREAKING CHANGE: Replace old map and plan components with v2 implementations

Routes updated:
- /map now uses MapPlannerV2 (client:only='react')
- /plan now uses PlanPage (client:only='react')
- Removed /map-v2 and /plan-v2 routes

Directory changes:
- Renamed components/map-v2 → components/map
- Renamed components/plan-v2 → components/plan
- Renamed lib/map-v2 → lib/map
- Deleted old components/map/ (MapPlanner + 11 files)
- Deleted old components/plan/ (ChatPage + 9 files)
- Deleted old lib/map/

Component consolidation:
- Moved PhotoLightbox to components/map/shared/
- Merged lib/map/map-utils.ts into lib/map/

Import updates:
- All @/components/map-v2/* → @/components/map/*
- All @/components/plan-v2/* → @/components/plan/*
- All @/lib/map-v2/* → @/lib/map/*

Index page:
- Removed 'Map v2 (Beta)' card
- Updated grid to 2 columns
- Improved map card description

Testing:
- ✅ TypeScript compilation passes
- ✅ Both routes load and function correctly
- ✅ No broken imports or 404s
- ✅ Client hydration works (client:only)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Rollback Strategy

If something goes wrong, we have multiple safety nets:

### Option 1: Rollback Uncommitted Changes

If you haven't committed yet:

```bash
git reset --hard HEAD
git clean -fd  # Remove any untracked files
```

### Option 2: Rollback to Backup Tag

If you've committed but want to undo:

```bash
git reset --hard pre-migration-backup
```

### Option 3: Revert the Migration Commit

If you've already pushed:

```bash
git revert <commit-hash>
# Or if it's the last commit:
git revert HEAD
```

### Option 4: Create Hotfix Branch

If the migration is merged but broken:

```bash
git checkout -b hotfix/rollback-migration
git revert <migration-commit-hash>
git push origin hotfix/rollback-migration
# Create PR to merge hotfix
```

---

## Risks and Mitigation

### Risk 1: Import Path Updates Miss Files

**Impact:** TypeScript compilation errors, runtime import failures
**Mitigation:**

- Use comprehensive sed commands that cover all patterns
- Run TypeScript compilation check before committing
- Verify with grep that no -v2 references remain

### Risk 2: client:only vs client:load Hydration Issues

**Impact:** Components may not hydrate properly
**Mitigation:**

- V2 components are already tested with client:only="react"
- Test thoroughly in development before merging
- Check browser console for hydration errors

### Risk 3: Lost Git History

**Impact:** Can't trace component evolution
**Mitigation:**

- Use `git mv` for renames to preserve history
- Use `git log --follow` to trace renamed files
- Backup tag created before migration

### Risk 4: Broken Production Deployment

**Impact:** App fails to build or run in production
**Mitigation:**

- Run full production build before merging: `npm run build`
- Test preview build: `npm run preview`
- Deploy to staging environment first if available

### Risk 5: Browser Caching Issues

**Impact:** Users see old components or errors
**Mitigation:**

- Astro handles this with content hashing in filenames
- Clear browser cache during testing
- Consider adding cache-busting headers if needed

---

## Post-Migration Checklist

After successful migration and deployment:

- [ ] Update any documentation that references old component paths
- [ ] Update CLAUDE.md if it references specific component locations
- [ ] Check if any external tools (IDE settings, search configs) reference old paths
- [ ] Remove the backup tag after 1 week of stable operation:
  ```bash
  git tag -d pre-migration-backup
  ```
- [ ] Update any team documentation about the codebase structure
- [ ] Consider updating the PR template if it references these paths

---

## Dependencies Between Steps

Critical ordering (cannot be changed):

1. **PhotoLightbox must move BEFORE** deleting old components (Phase 2 → Phase 4)
2. **lib/map-v2 must merge BEFORE** deleting lib/map (Phase 3)
3. **Old components must delete BEFORE** renaming v2 dirs (Phase 4 → Phase 5)
   - Prevents naming conflicts
4. **Directories must rename BEFORE** import updates (Phase 5.1-5.2 → Phase 5.3-5.5)
   - Git mv first, then fix imports
5. **Import updates must complete BEFORE** route updates (Phase 5 → Phase 6)
   - Routes depend on renamed imports working

---

## Expected Outcomes

After successful migration:

### File Count Changes

- **Deleted:** ~22 old component files + 2 old route files + 1 lib file
- **Renamed:** ~114 v2 files (map + plan)
- **Modified:** index.astro + import statements across codebase

### Route Behavior

- `/plan` → Full-featured chat interface with personas, library, itinerary
- `/map` → Advanced map with Discover/Plan/AI modes, mobile-responsive
- `/map-v2` → 404 (removed)
- `/plan-v2` → 404 (removed)

### Code Quality

- Cleaner directory structure without -v2 suffix
- Consistent client:only="react" hydration strategy
- Consolidated lib/map utilities
- Single source of truth for each component

### Bundle Size

- Should decrease (removing duplicate old components)
- Verify with `npm run build` and check dist/ size

---

## Troubleshooting Guide

### "Cannot find module '@/components/map-v2/...'"

**Cause:** Import not updated during sed replacement
**Fix:** Manually update the import to use `@/components/map/`

### "Module has no exported member 'MapPlannerV2'"

**Cause:** Export might have changed during directory operations
**Fix:** Check `src/components/map/index.ts` has correct export

### "Hydration failed" error in browser

**Cause:** client:only might not be compatible with component
**Fix:**

1. Check for SSR-specific code (window, document) that needs guards
2. Verify component has no server-side dependencies
3. Try client:load as fallback (but investigate why)

### TypeScript errors after renaming

**Cause:** TS server might have cached old paths
**Fix:**

1. Restart TS server in IDE
2. Delete node_modules/.astro and rebuild
3. Run `npx tsc --noEmit` to see actual errors

### Build succeeds but runtime errors

**Cause:** Dynamic imports or runtime path references
**Fix:**

1. Check for dynamic imports using string templates
2. Search for any `require()` statements
3. Look for path references in non-TS files (CSS, JSON)

---

## Estimated Timeline

| Phase | Task                      | Time      | Cumulative |
| ----- | ------------------------- | --------- | ---------- |
| 1     | Preparation               | 5 min     | 5 min      |
| 2     | Migrate shared components | 5 min     | 10 min     |
| 3     | Migrate lib directories   | 10 min    | 20 min     |
| 4     | Delete old components     | 5 min     | 25 min     |
| 5     | Rename v2 directories     | 15 min    | 40 min     |
| 6     | Update route files        | 10 min    | 50 min     |
| 7     | Update index page         | 5 min     | 55 min     |
| 8     | Verification & Testing    | 10-15 min | 65-70 min  |
| 9     | Commit and document       | 5 min     | 70-75 min  |

**Total: 70-75 minutes** (including thorough testing)

If you skip detailed testing and trust the automated checks: **~40 minutes**

---

## Success Criteria

Migration is successful when:

1. ✅ `npm run build` completes without errors
2. ✅ `/plan` loads and functions identically to old `/plan-v2`
3. ✅ `/map` loads and functions identically to old `/map-v2`
4. ✅ No console errors in browser DevTools
5. ✅ No 404s for missing modules
6. ✅ All URL parameters work (tripId, conversationId)
7. ✅ Mobile responsive behavior works
8. ✅ No remaining references to `-v2` in imports
9. ✅ Git history preserved (can trace with `git log --follow`)
10. ✅ Index page shows only 2 cards with correct links

---

## Notes

- **Git History:** Using `git mv` preserves file history. Use `git log --follow <file>` to trace.
- **Sed Commands:** On macOS, sed requires `-i ''` for in-place editing. On Linux, use `-i` without quotes.
- **Atomic Operation:** All changes are in one commit. Either the entire migration works or we rollback.
- **No Partial States:** Don't commit intermediate states. Complete all phases before committing.

---

## Final Checklist Before Execution

Before starting the migration, verify:

- [ ] Working directory is clean (`git status`)
- [ ] All dependencies are installed (`node_modules/` exists)
- [ ] Development server can start (`npm run dev`)
- [ ] Current build works (`npm run build`)
- [ ] You understand the rollback strategy
- [ ] You have time to complete all phases (don't leave halfway)
- [ ] You've informed the team (if applicable)

Ready to migrate! 🚀
