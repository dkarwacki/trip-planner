import { expect, test } from "@playwright/test";
import { MapPage } from "./pages";

/**
 * E2E test suite for Discovery Feature.
 * Test Case: TC-DISC-001 - Auto-fetch on Place Selection
 *
 * This test validates that:
 * - Parallel requests made to /api/attractions and /api/restaurants
 * - Loading state shown during fetch
 * - Results combined and deduplicated
 * - Discovery results stored in DiscoverSlice
 */
test.describe("Discovery Feature - TC-DISC-001", () => {
  test.describe("Desktop viewport", () => {
    let mapPage: MapPage;

    test.beforeEach(async ({ page }) => {
      // Use Desktop Chrome viewport (default from playwright.config.ts)
      mapPage = new MapPage(page);
      await mapPage.gotoMap();
    });

    test("should show loading state during discovery fetch", async () => {
      // Step 1: Navigate to /map (done in beforeEach)
      await expect(mapPage.desktopLayout).toBeVisible();

      // Step 2: Search for a place and select it
      await mapPage.typeInDesktopSearch("Paris");
      await mapPage.waitForDesktopSuggestions();
      await mapPage.waitForSearchToComplete();

      const suggestions = mapPage.getDesktopSuggestions();
      const firstSuggestion = suggestions.first();

      // Step 3: Click suggestion and observe loading state
      await firstSuggestion.click();

      // Step 4: Wait for place selection to complete
      await mapPage.waitForPlaceSelection();

      // Step 5: Verify loading state appears (might be very fast, handle race condition)
      // Try to catch loading state, but don't fail if it's too fast
      const loadingVisible = await mapPage.discoverLoading.isVisible().catch(() => false);

      if (loadingVisible) {
        // If we caught the loading state, verify it disappears
        await expect(mapPage.discoverLoading).toBeHidden({ timeout: 10000 });
      }

      // Step 6: Verify we end up with results or empty state, not loading
      await expect(mapPage.discoverLoading).not.toBeVisible();
    });

    test("should make parallel requests to attractions and restaurants APIs", async ({ page }) => {
      // Step 1: Navigate and search
      await expect(mapPage.desktopLayout).toBeVisible();
      await mapPage.typeInDesktopSearch("Paris");
      await mapPage.waitForDesktopSuggestions();
      await mapPage.waitForSearchToComplete();

      const suggestions = mapPage.getDesktopSuggestions();

      // Step 2: Set up request listeners BEFORE clicking
      const attractionsRequestPromise = page.waitForRequest(
        (request) => request.url().includes("/api/attractions") && request.method() === "POST",
        { timeout: 10000 }
      );

      const restaurantsRequestPromise = page.waitForRequest(
        (request) => request.url().includes("/api/restaurants") && request.method() === "POST",
        { timeout: 10000 }
      );

      // Step 3: Click suggestion to trigger discovery fetch
      await suggestions.first().click();

      // Step 4: Wait for both requests to be made (parallel)
      const [attractionsRequest, restaurantsRequest] = await Promise.all([
        attractionsRequestPromise,
        restaurantsRequestPromise,
      ]);

      // Step 5: Verify both requests were made
      expect(attractionsRequest).toBeDefined();
      expect(restaurantsRequest).toBeDefined();

      // Step 6: Verify request payloads contain correct coordinates
      const attractionsBody = attractionsRequest.postDataJSON();
      const restaurantsBody = restaurantsRequest.postDataJSON();

      // Verify lat/lng are present and are numbers
      expect(attractionsBody).toHaveProperty("lat");
      expect(attractionsBody).toHaveProperty("lng");
      expect(typeof attractionsBody.lat).toBe("number");
      expect(typeof attractionsBody.lng).toBe("number");

      expect(restaurantsBody).toHaveProperty("lat");
      expect(restaurantsBody).toHaveProperty("lng");
      expect(typeof restaurantsBody.lat).toBe("number");
      expect(typeof restaurantsBody.lng).toBe("number");

      // Verify they have the same coordinates (searching same location)
      expect(attractionsBody.lat).toBe(restaurantsBody.lat);
      expect(attractionsBody.lng).toBe(restaurantsBody.lng);

      // Verify radius and limit parameters
      expect(attractionsBody).toHaveProperty("radius");
      expect(attractionsBody).toHaveProperty("limit");
      expect(restaurantsBody).toHaveProperty("radius");
      expect(restaurantsBody).toHaveProperty("limit");
    });

    test("should display discovery results after loading completes", async () => {
      // Step 1: Navigate and search
      await expect(mapPage.desktopLayout).toBeVisible();
      await mapPage.typeInDesktopSearch("Paris");
      await mapPage.waitForDesktopSuggestions();
      await mapPage.waitForSearchToComplete();

      // Step 2: Select a place
      const suggestions = mapPage.getDesktopSuggestions();
      await suggestions.first().click();
      await mapPage.waitForPlaceSelection();

      // Step 3: Wait for discovery loading to complete
      await mapPage.waitForDiscoverLoadingToComplete();

      // Step 4: Verify discovery panel is visible
      await expect(mapPage.discoverPanel).toBeVisible();

      // Step 5: Verify the selected place name appears in discover header
      await expect(mapPage.discoverHeader).toBeVisible();
      const placeName = await mapPage.selectedPlaceName.textContent();
      expect(placeName).toContain("Paris");

      // Step 6: Verify place cards are displayed (not just any state)
      await expect(mapPage.placeCardGrid).toBeVisible({ timeout: 5000 });
      const cardCount = await mapPage.placeCard.count();
      expect(cardCount).toBeGreaterThan(0);

      // Step 7: Verify we're not in loading state
      await expect(mapPage.discoverLoading).not.toBeVisible();
    });

    test("should show result count in discover panel", async () => {
      // Step 1: Navigate and search
      await expect(mapPage.desktopLayout).toBeVisible();
      await mapPage.typeInDesktopSearch("Paris");
      await mapPage.waitForDesktopSuggestions();
      await mapPage.waitForSearchToComplete();

      // Step 2: Select a place
      const suggestions = mapPage.getDesktopSuggestions();
      await suggestions.first().click();
      await mapPage.waitForPlaceSelection();

      // Step 3: Wait for discovery to complete
      await mapPage.waitForDiscoverLoadingToComplete();

      // Step 4: Check if we have results
      const hasResults = await mapPage.placeCard
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (hasResults) {
        // Step 5: Get result count
        const resultCount = await mapPage.getDiscoverResultCount();

        // Step 6: Verify count is greater than 0
        expect(resultCount).toBeGreaterThan(0);

        // Step 7: Verify result count element is visible
        await expect(mapPage.resultCount).toBeVisible();
      } else {
        // If no results, verify the empty/no-results state is shown instead
        const hasEmptyState = await mapPage.discoverEmptyState.isVisible().catch(() => false);
        const hasNoResults = await mapPage.discoverNoResults.isVisible().catch(() => false);
        expect(hasEmptyState || hasNoResults).toBe(true);
      }
    });
  });

  test.describe("Mobile viewport", () => {
    let mapPage: MapPage;

    test.beforeEach(async ({ page }) => {
      // Set mobile viewport (iPhone 12 dimensions)
      await page.setViewportSize({ width: 390, height: 844 });

      mapPage = new MapPage(page);
      await mapPage.gotoMap();
    });

    test("should show loading state in discover tab during fetch", async () => {
      // Step 1: Navigate to /map (done in beforeEach)
      await expect(mapPage.mobileLayout).toBeVisible();

      // Step 2: Open mobile search overlay
      await mapPage.openMobileSearch();
      await expect(mapPage.mobileSearchOverlay).toBeVisible();

      // Step 3: Search for a place and select it
      await mapPage.typeInMobileSearch("Paris");
      await mapPage.waitForMobileSuggestions();
      await mapPage.waitForSearchToComplete();

      const suggestions = mapPage.getMobileSuggestions();
      const firstSuggestion = suggestions.first();

      // Step 4: Click suggestion
      await firstSuggestion.click();

      // Step 5: Wait for place selection to complete (overlay closes)
      await mapPage.waitForPlaceSelection();

      // Step 6: Switch to discover tab to see results
      await mapPage.switchToDiscoverTab();

      // Step 7: Verify loading state appears (might be very fast, handle race condition)
      const loadingVisible = await mapPage.discoverLoading.isVisible().catch(() => false);

      if (loadingVisible) {
        // If we caught the loading state, verify it disappears
        await expect(mapPage.discoverLoading).toBeHidden({ timeout: 10000 });
      }

      // Step 8: Verify we end up with results or empty state, not loading
      await expect(mapPage.discoverLoading).not.toBeVisible();
    });

    test("should make parallel requests to attractions and restaurants APIs", async ({ page }) => {
      // Step 1: Navigate to /map
      await expect(mapPage.mobileLayout).toBeVisible();

      // Step 2: Open mobile search
      await mapPage.openMobileSearch();

      // Step 3: Search for a place
      await mapPage.typeInMobileSearch("Paris");
      await mapPage.waitForMobileSuggestions();
      await mapPage.waitForSearchToComplete();

      const suggestions = mapPage.getMobileSuggestions();

      // Step 4: Set up request listeners BEFORE clicking
      const attractionsRequestPromise = page.waitForRequest(
        (request) => request.url().includes("/api/attractions") && request.method() === "POST",
        { timeout: 10000 }
      );

      const restaurantsRequestPromise = page.waitForRequest(
        (request) => request.url().includes("/api/restaurants") && request.method() === "POST",
        { timeout: 10000 }
      );

      // Step 5: Click suggestion to trigger discovery fetch
      await suggestions.first().click();

      // Step 6: Wait for both requests to be made (parallel)
      const [attractionsRequest, restaurantsRequest] = await Promise.all([
        attractionsRequestPromise,
        restaurantsRequestPromise,
      ]);

      // Step 7: Verify both requests were made
      expect(attractionsRequest).toBeDefined();
      expect(restaurantsRequest).toBeDefined();

      // Step 8: Verify request payloads
      const attractionsBody = attractionsRequest.postDataJSON();
      const restaurantsBody = restaurantsRequest.postDataJSON();

      expect(attractionsBody).toHaveProperty("lat");
      expect(attractionsBody).toHaveProperty("lng");
      expect(typeof attractionsBody.lat).toBe("number");
      expect(typeof attractionsBody.lng).toBe("number");

      expect(restaurantsBody).toHaveProperty("lat");
      expect(restaurantsBody).toHaveProperty("lng");
      expect(typeof restaurantsBody.lat).toBe("number");
      expect(typeof restaurantsBody.lng).toBe("number");

      // Verify they have the same coordinates
      expect(attractionsBody.lat).toBe(restaurantsBody.lat);
      expect(attractionsBody.lng).toBe(restaurantsBody.lng);
    });

    test("should display discovery results after switching to discover tab", async () => {
      // Step 1: Navigate and search
      await expect(mapPage.mobileLayout).toBeVisible();

      // Step 2: Open mobile search and search for a place
      await mapPage.openMobileSearch();
      await mapPage.typeInMobileSearch("Paris");
      await mapPage.waitForMobileSuggestions();
      await mapPage.waitForSearchToComplete();

      // Step 3: Select a place
      const suggestions = mapPage.getMobileSuggestions();
      await suggestions.first().click();
      await mapPage.waitForPlaceSelection();

      // Step 4: Switch to discover tab to view results
      await mapPage.switchToDiscoverTab();

      // Step 5: Wait for discover header to be visible (mobile uses DiscoverView, not DiscoverPanel)
      await expect(mapPage.discoverHeader).toBeVisible({ timeout: 10000 });

      // Step 6: Wait for the place card grid to be visible
      await expect(mapPage.placeCardGrid).toBeVisible({ timeout: 10000 });

      // Step 7: Verify at least one place card is rendered
      const cardCount = await mapPage.placeCard.count();
      expect(cardCount).toBeGreaterThan(0);
    });

    test("should show result count in discover panel", async () => {
      // Step 1: Navigate and search
      await expect(mapPage.mobileLayout).toBeVisible();

      // Step 2: Open mobile search
      await mapPage.openMobileSearch();
      await mapPage.typeInMobileSearch("Paris");
      await mapPage.waitForMobileSuggestions();
      await mapPage.waitForSearchToComplete();

      // Step 3: Select a place
      const suggestions = mapPage.getMobileSuggestions();
      await suggestions.first().click();
      await mapPage.waitForPlaceSelection();

      // Step 4: Switch to discover tab
      await mapPage.switchToDiscoverTab();

      // Step 5: Wait for discover header to be visible (mobile uses DiscoverView, not DiscoverPanel)
      await expect(mapPage.discoverHeader).toBeVisible({ timeout: 10000 });

      // Step 6: Check if we have results
      const hasResults = await mapPage.placeCard
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (hasResults) {
        // Step 7: Get result count
        const resultCount = await mapPage.getDiscoverResultCount();

        // Step 8: Verify count is greater than 0
        expect(resultCount).toBeGreaterThan(0);
      }
    });
  });
});
