import { type Locator, type Page } from "@playwright/test";
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

  // Shared Search Results Locators
  readonly searchResults: Locator;
  readonly searchResultsLoading: Locator;

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
    this.mobileSearchButton = page.getByRole("button", { name: "Search" });
    this.mobileSearchOverlay = page.getByTestId("mobile-search-overlay");
    this.mobileSearchInput = page.getByTestId("mobile-search-input");
    this.mobileSearchCloseButton = page.getByTestId("mobile-search-close-button");
    this.mobileSearchClearButton = page.getByTestId("mobile-search-clear-button");

    // Shared locators
    this.searchResults = page.getByTestId("search-results");
    this.searchResultsLoading = page.getByTestId("search-results-loading");
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
}
