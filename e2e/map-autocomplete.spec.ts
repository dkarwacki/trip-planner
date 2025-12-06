import { expect, test } from "@playwright/test";
import { MapPage } from "./pages";

/**
 * E2E test suite for Map Autocomplete feature.
 * Test Case: TC-AUTO-002 - Autocomplete Suggestions Display
 *
 * This test validates that:
 * - Autocomplete suggestions are displayed after typing a query
 * - Each suggestion shows both name (mainText) and address (secondaryText)
 * - The feature works on both desktop and mobile viewports
 */
test.describe("Map Autocomplete - TC-AUTO-002", () => {
  test.describe("Desktop viewport", () => {
    let mapPage: MapPage;

    test.beforeEach(async ({ page }) => {
      // Use Desktop Chrome viewport (default from playwright.config.ts)
      mapPage = new MapPage(page);
      await mapPage.gotoMap();
    });

    test("should display autocomplete suggestions with name and address", async () => {
      // Step 1: Navigate to /map (done in beforeEach)
      await expect(mapPage.desktopLayout).toBeVisible();

      // Step 2: Type "Paris" in desktop search
      await mapPage.typeInDesktopSearch("Paris");

      // Step 3: Wait for suggestions dropdown to appear
      await mapPage.waitForDesktopSuggestions();

      // Step 4: Wait for search to complete (in case of loading state)
      await mapPage.waitForSearchToComplete();

      // Step 5: Verify suggestions are displayed
      const suggestions = mapPage.getDesktopSuggestions();
      const suggestionCount = await suggestions.count();

      // Assert: At least 1 suggestion is displayed
      expect(suggestionCount).toBeGreaterThan(0);

      // Step 6: Verify each suggestion has name and address
      for (let i = 0; i < suggestionCount; i++) {
        const suggestion = suggestions.nth(i);

        // Verify suggestion structure
        const { hasName, hasAddress } = await mapPage.verifySuggestionStructure(suggestion);

        // Assert: Each suggestion has visible name
        expect(hasName).toBe(true);

        // Assert: Each suggestion has visible address
        expect(hasAddress).toBe(true);

        // Additional verification: name and address have content
        const name = await mapPage.getSuggestionName(suggestion);
        const address = await mapPage.getSuggestionAddress(suggestion);

        expect(name.trim().length).toBeGreaterThan(0);
        expect(address.trim().length).toBeGreaterThan(0);
      }
    });

    test("should show loading state while fetching suggestions", async () => {
      // Type slowly to potentially catch loading state
      await mapPage.desktopSearchInput.type("Lond", { delay: 50 });

      // Check if loading indicator appears (it might be very fast)
      const loadingVisible = await mapPage.searchResultsLoading.isVisible().catch(() => false);

      if (loadingVisible) {
        // If loading is visible, verify it disappears
        await expect(mapPage.searchResultsLoading).toBeHidden();
      }

      // Verify results appear after loading
      await mapPage.waitForDesktopSuggestions();
      const suggestions = mapPage.getDesktopSuggestions();
      await expect(suggestions.first()).toBeVisible();
    });

    test("should clear search input and hide suggestions", async () => {
      // Type search query
      await mapPage.typeInDesktopSearch("Berlin");
      await mapPage.waitForDesktopSuggestions();

      // Verify dropdown is visible
      await expect(mapPage.desktopSearchDropdown).toBeVisible();

      // Clear search
      await mapPage.clearDesktopSearch();

      // Verify input is cleared
      await expect(mapPage.desktopSearchInput).toHaveValue("");

      // Verify dropdown is hidden
      await expect(mapPage.desktopSearchDropdown).not.toBeVisible();
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

    test("should display autocomplete suggestions with name and address", async () => {
      // Step 1: Navigate to /map (done in beforeEach)
      await expect(mapPage.mobileLayout).toBeVisible();

      // Step 2: Open mobile search overlay
      await mapPage.openMobileSearch();

      // Verify overlay is visible
      await expect(mapPage.mobileSearchOverlay).toBeVisible();

      // Step 3: Type "Paris" in mobile search
      await mapPage.typeInMobileSearch("Paris");

      // Step 4: Wait for suggestions to appear
      await mapPage.waitForMobileSuggestions();

      // Step 5: Wait for search to complete
      await mapPage.waitForSearchToComplete();

      // Step 6: Verify suggestions are displayed
      const suggestions = mapPage.getMobileSuggestions();
      const suggestionCount = await suggestions.count();

      // Assert: At least 1 suggestion is displayed
      expect(suggestionCount).toBeGreaterThan(0);

      // Step 7: Verify each suggestion has name and address
      for (let i = 0; i < suggestionCount; i++) {
        const suggestion = suggestions.nth(i);

        // Verify suggestion structure
        const { hasName, hasAddress } = await mapPage.verifySuggestionStructure(suggestion);

        // Assert: Each suggestion has visible name
        expect(hasName).toBe(true);

        // Assert: Each suggestion has visible address
        expect(hasAddress).toBe(true);

        // Additional verification: name and address have content
        const name = await mapPage.getSuggestionName(suggestion);
        const address = await mapPage.getSuggestionAddress(suggestion);

        expect(name.trim().length).toBeGreaterThan(0);
        expect(address.trim().length).toBeGreaterThan(0);
      }
    });

    test("should show loading state while fetching suggestions", async () => {
      await mapPage.openMobileSearch();

      // Type slowly to potentially catch loading state
      await mapPage.mobileSearchInput.type("Toky", { delay: 50 });

      // Check if loading indicator appears (it might be very fast)
      const loadingVisible = await mapPage.searchResultsLoading.isVisible().catch(() => false);

      if (loadingVisible) {
        // If loading is visible, verify it disappears
        await expect(mapPage.searchResultsLoading).toBeHidden();
      }

      // Verify results appear after loading
      await mapPage.waitForMobileSuggestions();
      const suggestions = mapPage.getMobileSuggestions();
      await expect(suggestions.first()).toBeVisible();
    });

    test("should clear search input in mobile overlay", async () => {
      await mapPage.openMobileSearch();

      // Type search query
      await mapPage.typeInMobileSearch("Rome");
      await mapPage.waitForMobileSuggestions();

      // Clear search using clear button
      await mapPage.mobileSearchClearButton.click();

      // Verify input is cleared
      await expect(mapPage.mobileSearchInput).toHaveValue("");
    });

    test("should close mobile search overlay", async () => {
      await mapPage.openMobileSearch();
      await expect(mapPage.mobileSearchOverlay).toBeVisible();

      // Close overlay
      await mapPage.closeMobileSearch();

      // Verify overlay is hidden
      await expect(mapPage.mobileSearchOverlay).not.toBeVisible();
    });
  });

  test.describe("Unified API (responsive)", () => {
    test("should work on desktop using unified API", async ({ page }) => {
      const mapPage = new MapPage(page);
      await mapPage.gotoMap();

      // Use unified API that auto-detects desktop
      await mapPage.searchForPlace("Madrid");
      await mapPage.waitForSuggestions();

      const suggestions = mapPage.getSuggestions();
      const count = await suggestions.count();

      expect(count).toBeGreaterThan(0);

      // Verify first suggestion structure
      const firstSuggestion = suggestions.first();
      const { hasName, hasAddress } = await mapPage.verifySuggestionStructure(firstSuggestion);

      expect(hasName).toBe(true);
      expect(hasAddress).toBe(true);
    });

    test("should work on mobile using unified API", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 390, height: 844 });

      const mapPage = new MapPage(page);
      await mapPage.gotoMap();

      // Use unified API that auto-detects mobile
      await mapPage.searchForPlace("Barcelona");
      await mapPage.waitForSuggestions();

      const suggestions = mapPage.getSuggestions();
      const count = await suggestions.count();

      expect(count).toBeGreaterThan(0);

      // Verify first suggestion structure
      const firstSuggestion = suggestions.first();
      const { hasName, hasAddress } = await mapPage.verifySuggestionStructure(firstSuggestion);

      expect(hasName).toBe(true);
      expect(hasAddress).toBe(true);
    });
  });

  test.describe("Edge cases", () => {
    test("should handle no results gracefully on desktop", async ({ page }) => {
      const mapPage = new MapPage(page);
      await mapPage.gotoMap();

      // Type a query that should return no results
      await mapPage.typeInDesktopSearch("xyzabc123notarealplace");

      // Wait a moment for search to complete
      await page.waitForTimeout(1000);

      // Either no dropdown appears or it shows "no results"
      const dropdownVisible = await mapPage.desktopSearchDropdown.isVisible().catch(() => false);

      if (dropdownVisible) {
        // Dropdown might be visible but with no results
        const suggestions = mapPage.getDesktopSuggestions();
        const count = await suggestions.count();
        expect(count).toBe(0);
      }
    });

    test("should handle rapid typing with debounce on desktop", async ({ page }) => {
      const mapPage = new MapPage(page);
      await mapPage.gotoMap();

      // Type rapidly - use "New York" with space for better API results
      await mapPage.desktopSearchInput.type("New York", { delay: 10 });

      // Wait for suggestions to appear (handles debounce internally)
      await mapPage.waitForDesktopSuggestions();
      const suggestions = mapPage.getDesktopSuggestions();

      expect(await suggestions.count()).toBeGreaterThan(0);
    });
  });
});
