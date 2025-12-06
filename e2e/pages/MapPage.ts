import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Map page.
 * Supports both desktop and mobile viewports for autocomplete search.
 */
export class MapPage extends BasePage {
  // Desktop Layout Locators
  readonly desktopLayout: Locator;
  readonly desktopSearchBar: Locator;
  readonly desktopSearchInput: Locator;
  readonly desktopSearchClearButton: Locator;
  readonly desktopSearchDropdown: Locator;

  // Mobile Layout Locators
  readonly mobileLayout: Locator;
  readonly mobileSearchButton: Locator;
  readonly mobileSearchOverlay: Locator;
  readonly mobileSearchInput: Locator;
  readonly mobileSearchCloseButton: Locator;
  readonly mobileSearchClearButton: Locator;

  // Mobile Tab Navigation Locators
  readonly mobileTabMap: Locator;
  readonly mobileTabDiscover: Locator;
  readonly mobileTabPlan: Locator;

  // Shared Search Results Locators
  readonly searchResults: Locator;
  readonly searchResultsLoading: Locator;

  // Discover Header Locators
  readonly discoverHeader: Locator;
  readonly selectedPlaceName: Locator;

  // Discovery Panel Locators
  readonly discoverPanel: Locator;
  readonly discoverLoading: Locator;
  readonly discoverEmptyState: Locator;
  readonly discoverNoResults: Locator;
  readonly discoverContent: Locator;
  readonly placeCardGrid: Locator;
  readonly placeCard: Locator;
  readonly resultCount: Locator;

  constructor(page: Page) {
    super(page);

    // Desktop locators
    this.desktopLayout = page.getByTestId("map-desktop-layout");
    this.desktopSearchBar = page.getByTestId("place-search-bar");
    this.desktopSearchInput = page.getByTestId("place-search-input");
    this.desktopSearchClearButton = page.getByTestId("place-search-clear-button");
    this.desktopSearchDropdown = page.getByTestId("place-search-dropdown");

    // Mobile locators
    this.mobileLayout = page.getByTestId("map-mobile-layout");
    this.mobileSearchButton = page.getByTestId("mobile-search-button");
    this.mobileSearchOverlay = page.getByTestId("mobile-search-overlay");
    this.mobileSearchInput = page.getByTestId("mobile-search-input");
    this.mobileSearchCloseButton = page.getByTestId("mobile-search-close-button");
    this.mobileSearchClearButton = page.getByTestId("mobile-search-clear-button");

    // Mobile tab navigation locators
    this.mobileTabMap = page.getByTestId("mobile-tab-map");
    this.mobileTabDiscover = page.getByTestId("mobile-tab-discover");
    this.mobileTabPlan = page.getByTestId("mobile-tab-plan");

    // Shared locators
    this.searchResults = page.getByTestId("search-results");
    this.searchResultsLoading = page.getByTestId("search-results-loading");

    // Discover header locators
    this.discoverHeader = page.getByTestId("discover-header");
    this.selectedPlaceName = page.getByTestId("selected-place-name");

    // Discovery panel locators
    this.discoverPanel = page.getByTestId("discover-panel");
    this.discoverLoading = page.getByTestId("discover-loading");
    this.discoverEmptyState = page.getByTestId("discover-empty-state");
    this.discoverNoResults = page.getByTestId("discover-no-results");
    this.discoverContent = page.getByTestId("discover-content");
    this.placeCardGrid = page.getByTestId("place-card-grid");
    this.placeCard = page.getByTestId("place-card");
    this.resultCount = page.getByTestId("result-count");
  }

  /**
   * Navigate to the map page
   */
  async gotoMap(options?: { tripId?: string; conversationId?: string }): Promise<void> {
    const params = new URLSearchParams();
    if (options?.tripId) {
      params.append("tripId", options.tripId);
    }
    if (options?.conversationId) {
      params.append("conversationId", options.conversationId);
    }

    const path = params.toString() ? `/map?${params.toString()}` : "/map";
    await super.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to the map page (overrides base class)
   */
  async goto(path = "/map"): Promise<void> {
    await super.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Check if desktop layout is active
   */
  async isDesktopLayout(): Promise<boolean> {
    return await this.desktopLayout.isVisible();
  }

  /**
   * Check if mobile layout is active
   */
  async isMobileLayout(): Promise<boolean> {
    return await this.mobileLayout.isVisible();
  }

  // ========================================
  // Desktop Autocomplete Methods
  // ========================================

  /**
   * Get desktop search input locator
   */
  getDesktopSearchInput(): Locator {
    return this.desktopSearchInput;
  }

  /**
   * Type in desktop search input
   */
  async typeInDesktopSearch(query: string): Promise<void> {
    await this.desktopSearchInput.fill(query);
  }

  /**
   * Wait for desktop suggestions dropdown to appear
   */
  async waitForDesktopSuggestions(): Promise<void> {
    await this.desktopSearchDropdown.waitFor({ state: "visible" });
  }

  /**
   * Get all desktop suggestion items
   */
  getDesktopSuggestions(): Locator {
    return this.desktopSearchDropdown.getByTestId("search-result-item");
  }

  /**
   * Clear desktop search input
   */
  async clearDesktopSearch(): Promise<void> {
    await this.desktopSearchClearButton.click();
  }

  // ========================================
  // Mobile Autocomplete Methods
  // ========================================

  /**
   * Open mobile search overlay
   */
  async openMobileSearch(): Promise<void> {
    await this.mobileSearchButton.click();
    await this.mobileSearchOverlay.waitFor({ state: "visible" });
  }

  /**
   * Get mobile search input locator
   */
  getMobileSearchInput(): Locator {
    return this.mobileSearchInput;
  }

  /**
   * Type in mobile search input
   */
  async typeInMobileSearch(query: string): Promise<void> {
    await this.mobileSearchInput.fill(query);
  }

  /**
   * Wait for mobile suggestions to appear
   */
  async waitForMobileSuggestions(): Promise<void> {
    await this.mobileSearchOverlay.getByTestId("search-results").waitFor({ state: "visible" });
  }

  /**
   * Get all mobile suggestion items
   */
  getMobileSuggestions(): Locator {
    return this.mobileSearchOverlay.getByTestId("search-result-item");
  }

  /**
   * Close mobile search overlay
   */
  async closeMobileSearch(): Promise<void> {
    await this.mobileSearchCloseButton.click();
  }

  // ========================================
  // Mobile Tab Navigation Methods
  // ========================================

  /**
   * Switch to discover tab on mobile
   * Uses force: true to click through Astro dev toolbar overlay
   */
  async switchToDiscoverTab(): Promise<void> {
    await this.mobileTabDiscover.click({ force: true });
  }

  /**
   * Switch to map tab on mobile
   * Uses force: true to click through Astro dev toolbar overlay
   */
  async switchToMapTab(): Promise<void> {
    await this.mobileTabMap.click({ force: true });
  }

  /**
   * Switch to plan tab on mobile
   * Uses force: true to click through Astro dev toolbar overlay
   */
  async switchToPlanTab(): Promise<void> {
    await this.mobileTabPlan.click({ force: true });
  }

  // ========================================
  // Unified Autocomplete Methods (auto-detect viewport)
  // ========================================

  /**
   * Search for a place (auto-detects desktop or mobile)
   */
  async searchForPlace(query: string): Promise<void> {
    const isDesktop = await this.isDesktopLayout();

    if (isDesktop) {
      await this.typeInDesktopSearch(query);
    } else {
      await this.openMobileSearch();
      await this.typeInMobileSearch(query);
    }
  }

  /**
   * Wait for suggestions to appear (auto-detects desktop or mobile)
   */
  async waitForSuggestions(): Promise<void> {
    const isDesktop = await this.isDesktopLayout();

    if (isDesktop) {
      await this.waitForDesktopSuggestions();
    } else {
      await this.waitForMobileSuggestions();
    }
  }

  /**
   * Get all suggestion items (auto-detects desktop or mobile)
   */
  getSuggestions(): Locator {
    // Note: This returns a locator that will work for both desktop and mobile
    // Playwright will automatically find the visible one
    return this.page.getByTestId("search-result-item");
  }

  /**
   * Verify suggestion structure (name and address present)
   */
  async verifySuggestionStructure(suggestion: Locator): Promise<{
    hasName: boolean;
    hasAddress: boolean;
  }> {
    const name = suggestion.getByTestId("search-result-name");
    const address = suggestion.getByTestId("search-result-address");

    const hasName = await name.isVisible();
    const hasAddress = await address.isVisible();

    return { hasName, hasAddress };
  }

  // ========================================
  // Suggestion Interaction Methods
  // ========================================

  /**
   * Click on nth suggestion (0-indexed)
   */
  async clickSuggestion(index: number): Promise<void> {
    const suggestions = this.getSuggestions();
    await suggestions.nth(index).click();
  }

  /**
   * Get suggestion name text
   */
  async getSuggestionName(suggestion: Locator): Promise<string> {
    const name = suggestion.getByTestId("search-result-name");
    return (await name.textContent()) || "";
  }

  /**
   * Get suggestion address text
   */
  async getSuggestionAddress(suggestion: Locator): Promise<string> {
    const address = suggestion.getByTestId("search-result-address");
    return (await address.textContent()) || "";
  }

  /**
   * Get all suggestion items as array with name and address
   */
  async getSuggestionsList(): Promise<{ name: string; address: string }[]> {
    const suggestions = this.getSuggestions();
    const count = await suggestions.count();
    const results: { name: string; address: string }[] = [];

    for (let i = 0; i < count; i++) {
      const suggestion = suggestions.nth(i);
      const name = await this.getSuggestionName(suggestion);
      const address = await this.getSuggestionAddress(suggestion);
      results.push({ name, address });
    }

    return results;
  }

  /**
   * Wait for loading state to finish
   */
  async waitForSearchToComplete(): Promise<void> {
    // Wait for loading indicator to disappear if it appears
    try {
      await this.searchResultsLoading.waitFor({ state: "visible", timeout: 1000 });
      await this.searchResultsLoading.waitFor({ state: "hidden" });
    } catch {
      // Loading indicator might not appear for cached results, that's fine
    }
  }

  // ========================================
  // Place Selection Verification Methods
  // ========================================

  /**
   * Wait for place selection to complete (search UI closes)
   * Auto-detects desktop or mobile layout
   */
  async waitForPlaceSelection(): Promise<void> {
    const isDesktop = await this.isDesktopLayout();

    if (isDesktop) {
      // Wait for dropdown to close
      await this.desktopSearchDropdown.waitFor({ state: "hidden", timeout: 5000 });
    } else {
      // Wait for mobile overlay to close
      await this.mobileSearchOverlay.waitFor({ state: "hidden", timeout: 5000 });
    }
  }

  /**
   * Get the selected place name from discover header
   * Returns null if discover header is not visible
   */
  async getSelectedPlaceName(): Promise<string | null> {
    try {
      const isVisible = await this.discoverHeader.isVisible();
      if (!isVisible) {
        return null;
      }

      const text = await this.selectedPlaceName.textContent();
      // Extract place name from "Selected: {placeName}" format
      if (text && text.startsWith("Selected: ")) {
        return text.replace("Selected: ", "").trim();
      }
      return text ? text.trim() : null;
    } catch {
      return null;
    }
  }

  /**
   * Wait for discover header to appear with place name
   */
  async waitForDiscoverHeader(): Promise<void> {
    await this.discoverHeader.waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Verify that the selected place name appears in the discover header
   */
  async verifySelectedPlaceInHeader(expectedName: string): Promise<void> {
    await this.discoverHeader.waitFor({ state: "visible" });
    const placeName = await this.selectedPlaceName.textContent();
    expect(placeName).toContain(expectedName);
  }

  // ========================================
  // Discovery Panel Methods
  // ========================================

  /**
   * Wait for discovery loading state to appear
   */
  async waitForDiscoverLoading(): Promise<void> {
    await this.discoverLoading.waitFor({ state: "visible", timeout: 2000 });
  }

  /**
   * Wait for discovery loading to complete
   * Handles race condition where loading might be too fast to catch
   */
  async waitForDiscoverLoadingToComplete(): Promise<void> {
    try {
      // Try to wait for loading to appear first
      await this.discoverLoading.waitFor({ state: "visible", timeout: 1000 });
      // Then wait for it to disappear
      await this.discoverLoading.waitFor({ state: "hidden", timeout: 10000 });
    } catch {
      // Loading might have been too fast, that's fine
      // Just verify we're not in loading state anymore
      const isLoading = await this.discoverLoading.isVisible().catch(() => false);
      if (isLoading) {
        await this.discoverLoading.waitFor({ state: "hidden", timeout: 10000 });
      }
    }
  }

  /**
   * Wait for discovery results to appear
   * Verifies that place cards are displayed
   */
  async waitForDiscoveryResults(): Promise<void> {
    await this.waitForDiscoverLoadingToComplete();
    // Wait for either place card grid or first place card to appear
    await this.placeCard.first().waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Get the number of discovery results displayed
   */
  async getDiscoverResultCount(): Promise<number> {
    // Try to get count from result-count element first
    try {
      const countText = await this.resultCount.textContent();
      if (countText) {
        // Extract number from text like "12 results" or "Showing 5 of 20"
        const match = countText.match(/(\d+)/);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
    } catch {
      // Fall back to counting place cards
    }

    // Fall back to counting place card elements
    return await this.placeCard.count();
  }
}
