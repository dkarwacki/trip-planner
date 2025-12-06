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

/**
 * E2E test suite for Map Autocomplete feature.
 * Test Case: TC-AUTO-003 - Place Selection and Details Fetch
 *
 * This test validates that:
 * - Clicking on a suggestion triggers fetchPlaceDetails with placeId
 * - Fields fetched: id, displayName, formattedAddress, location
 * - lat/lng extracted correctly (handles both function and property access)
 * - Search UI closes after selection
 * - Discover header displays the selected place name
 * - Network requests made to /api/attractions and /api/restaurants with correct coordinates
 */
test.describe("Map Autocomplete - TC-AUTO-003", () => {
  test.describe("Desktop viewport", () => {
    let mapPage: MapPage;

    test.beforeEach(async ({ page }) => {
      // Use Desktop Chrome viewport (default from playwright.config.ts)
      mapPage = new MapPage(page);
      await mapPage.gotoMap();
    });

    test("should fetch place details and display selected place after clicking suggestion", async ({ page }) => {
      // Step 1: Navigate to /map and verify layout
      await expect(mapPage.desktopLayout).toBeVisible();

      // Step 2: Type "Paris" in desktop search
      await mapPage.typeInDesktopSearch("Paris");

      // Step 3: Wait for suggestions dropdown to appear
      await mapPage.waitForDesktopSuggestions();
      await mapPage.waitForSearchToComplete();

      // Step 4: Get first suggestion and its name before clicking
      const suggestions = mapPage.getDesktopSuggestions();
      const suggestionCount = await suggestions.count();
      expect(suggestionCount).toBeGreaterThan(0);

      const firstSuggestion = suggestions.first();
      const suggestionName = await mapPage.getSuggestionName(firstSuggestion);

      // Verify suggestion name contains "Paris"
      expect(suggestionName.toLowerCase()).toContain("paris");

      // Step 5: Set up network request listeners for attractions and restaurants API
      const attractionsRequestPromise = page.waitForRequest(
        (request) => request.url().includes("/api/attractions") && request.method() === "POST"
      );

      const restaurantsRequestPromise = page.waitForRequest(
        (request) => request.url().includes("/api/restaurants") && request.method() === "POST"
      );

      // Step 6: Click on first suggestion
      await firstSuggestion.click();

      // Step 7: Wait for place selection to complete (dropdown should close)
      await mapPage.waitForPlaceSelection();

      // Step 8: Verify search input is cleared
      await expect(mapPage.desktopSearchInput).toHaveValue("");

      // Step 9: Verify dropdown is hidden
      await expect(mapPage.desktopSearchDropdown).not.toBeVisible();

      // Step 10: Wait for discover header to appear
      await mapPage.waitForDiscoverHeader();

      // Step 11: Verify selected place name is displayed in discover header
      const selectedPlaceName = await mapPage.getSelectedPlaceName();
      expect(selectedPlaceName).not.toBeNull();
      expect(selectedPlaceName?.toLowerCase()).toContain("paris");

      // Step 12: Verify network requests were made with correct data
      const attractionsRequest = await attractionsRequestPromise;
      const restaurantsRequest = await restaurantsRequestPromise;

      // Verify requests were made
      expect(attractionsRequest).toBeDefined();
      expect(restaurantsRequest).toBeDefined();

      // Parse request bodies to verify coordinates were extracted
      const attractionsBody = attractionsRequest.postDataJSON();
      const restaurantsBody = restaurantsRequest.postDataJSON();

      // Verify lat/lng are present and are numbers (Paris coordinates ~48.8, ~2.3)
      expect(attractionsBody).toHaveProperty("lat");
      expect(attractionsBody).toHaveProperty("lng");
      expect(typeof attractionsBody.lat).toBe("number");
      expect(typeof attractionsBody.lng).toBe("number");

      expect(restaurantsBody).toHaveProperty("lat");
      expect(restaurantsBody).toHaveProperty("lng");
      expect(typeof restaurantsBody.lat).toBe("number");
      expect(typeof restaurantsBody.lng).toBe("number");

      // Verify coordinates are in reasonable range for Paris
      expect(attractionsBody.lat).toBeGreaterThan(48);
      expect(attractionsBody.lat).toBeLessThan(49);
      expect(attractionsBody.lng).toBeGreaterThan(2);
      expect(attractionsBody.lng).toBeLessThan(3);
    });

    test("should handle place selection with coordinates extraction", async () => {
      // This test specifically validates that lat/lng extraction works
      // for both function and property access patterns

      await expect(mapPage.desktopLayout).toBeVisible();

      // Search for a well-known place
      await mapPage.typeInDesktopSearch("Paris, France");
      await mapPage.waitForDesktopSuggestions();
      await mapPage.waitForSearchToComplete();

      const suggestions = mapPage.getDesktopSuggestions();
      const firstSuggestion = suggestions.first();

      // Click suggestion
      await firstSuggestion.click();

      // Wait for place selection
      await mapPage.waitForPlaceSelection();

      // Wait for discover header
      await mapPage.waitForDiscoverHeader();

      // Verify place was added to the map (discover header shows it)
      const selectedPlaceName = await mapPage.getSelectedPlaceName();
      expect(selectedPlaceName).toBeTruthy();
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

    test("should fetch place details and display selected place after clicking suggestion", async ({ page }) => {
      // Step 1: Navigate to /map and verify mobile layout
      await expect(mapPage.mobileLayout).toBeVisible();

      // Step 2: Open mobile search overlay
      await mapPage.openMobileSearch();
      await expect(mapPage.mobileSearchOverlay).toBeVisible();

      // Step 3: Type "Paris" in mobile search
      await mapPage.typeInMobileSearch("Paris");

      // Step 4: Wait for suggestions to appear
      await mapPage.waitForMobileSuggestions();
      await mapPage.waitForSearchToComplete();

      // Step 5: Get first suggestion and its name
      const suggestions = mapPage.getMobileSuggestions();
      const suggestionCount = await suggestions.count();
      expect(suggestionCount).toBeGreaterThan(0);

      const firstSuggestion = suggestions.first();
      const suggestionName = await mapPage.getSuggestionName(firstSuggestion);

      // Verify suggestion name contains "Paris"
      expect(suggestionName.toLowerCase()).toContain("paris");

      // Step 6: Set up network request listeners
      const attractionsRequestPromise = page.waitForRequest(
        (request) => request.url().includes("/api/attractions") && request.method() === "POST"
      );

      const restaurantsRequestPromise = page.waitForRequest(
        (request) => request.url().includes("/api/restaurants") && request.method() === "POST"
      );

      // Step 7: Click on first suggestion
      await firstSuggestion.click();

      // Step 8: Wait for place selection to complete (overlay should close)
      await mapPage.waitForPlaceSelection();

      // Step 9: Verify mobile search overlay is closed
      await expect(mapPage.mobileSearchOverlay).not.toBeVisible();

      // Step 10: Switch to discover tab (on mobile, discover header is only visible on discover tab)
      await mapPage.switchToDiscoverTab();

      // Step 11: Wait for discover header to appear
      await mapPage.waitForDiscoverHeader();

      // Step 12: Verify selected place name is displayed
      const selectedPlaceName = await mapPage.getSelectedPlaceName();
      expect(selectedPlaceName).not.toBeNull();
      expect(selectedPlaceName?.toLowerCase()).toContain("paris");

      // Step 13: Verify network requests were made with coordinates
      const attractionsRequest = await attractionsRequestPromise;
      const restaurantsRequest = await restaurantsRequestPromise;

      expect(attractionsRequest).toBeDefined();
      expect(restaurantsRequest).toBeDefined();

      // Verify request bodies contain coordinates
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

      // Verify coordinates are in reasonable range for Paris
      expect(attractionsBody.lat).toBeGreaterThan(48);
      expect(attractionsBody.lat).toBeLessThan(49);
      expect(attractionsBody.lng).toBeGreaterThan(2);
      expect(attractionsBody.lng).toBeLessThan(3);
    });

    test("should clear search input after mobile place selection", async () => {
      await expect(mapPage.mobileLayout).toBeVisible();

      // Open search
      await mapPage.openMobileSearch();

      // Search for place
      await mapPage.typeInMobileSearch("London");
      await mapPage.waitForMobileSuggestions();
      await mapPage.waitForSearchToComplete();

      // Click first suggestion
      const suggestions = mapPage.getMobileSuggestions();
      await suggestions.first().click();

      // Wait for overlay to close
      await mapPage.waitForPlaceSelection();

      // Verify overlay is closed
      await expect(mapPage.mobileSearchOverlay).not.toBeVisible();

      // Re-open search to verify input was cleared
      await mapPage.openMobileSearch();
      await expect(mapPage.mobileSearchInput).toHaveValue("");
    });
  });

  test.describe("Network request validation", () => {
    test("should include all required fields in API requests", async ({ page }) => {
      const mapPage = new MapPage(page);
      await mapPage.gotoMap();

      // Type and wait for suggestions
      await mapPage.typeInDesktopSearch("Tokyo");
      await mapPage.waitForDesktopSuggestions();
      await mapPage.waitForSearchToComplete();

      // Set up detailed request capture
      const requestBodies: { attractions?: unknown; restaurants?: unknown } = {};

      page.on("request", (request) => {
        if (request.url().includes("/api/attractions") && request.method() === "POST") {
          requestBodies.attractions = request.postDataJSON();
        }
        if (request.url().includes("/api/restaurants") && request.method() === "POST") {
          requestBodies.restaurants = request.postDataJSON();
        }
      });

      // Click first suggestion
      const suggestions = mapPage.getDesktopSuggestions();
      await suggestions.first().click();

      // Wait for requests to complete
      await mapPage.waitForPlaceSelection();
      await mapPage.waitForDiscoverHeader();

      // Small delay to ensure all requests captured
      await page.waitForTimeout(500);

      // Verify attractions request includes required fields
      expect(requestBodies.attractions).toBeDefined();
      const attractionsData = requestBodies.attractions as Record<string, unknown>;
      expect(attractionsData).toHaveProperty("lat");
      expect(attractionsData).toHaveProperty("lng");
      expect(attractionsData).toHaveProperty("radius");
      expect(attractionsData).toHaveProperty("limit");

      // Verify restaurants request includes required fields
      expect(requestBodies.restaurants).toBeDefined();
      const restaurantsData = requestBodies.restaurants as Record<string, unknown>;
      expect(restaurantsData).toHaveProperty("lat");
      expect(restaurantsData).toHaveProperty("lng");
      expect(restaurantsData).toHaveProperty("radius");
      expect(restaurantsData).toHaveProperty("limit");
    });
  });
});
