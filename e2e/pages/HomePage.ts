import { type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Home page.
 * Encapsulates all interactions with the home page.
 *
 * TODO: Remove this example file once you have real page objects.
 */
export class HomePage extends BasePage {
  // Locators
  readonly heroSection: Locator;
  readonly mapLink: Locator;
  readonly planLink: Locator;

  constructor(page: Page) {
    super(page);

    // Define locators using resilient selectors
    this.heroSection = page.locator('[data-testid="hero-section"]').or(page.locator("main").first());
    this.mapLink = page.getByRole("link", { name: /map/i });
    this.planLink = page.getByRole("link", { name: /plan/i });
  }

  /**
   * Navigate to the home page
   */
  async goto(): Promise<void> {
    await super.goto("/");
  }

  /**
   * Navigate to the map page via the link
   */
  async goToMap(): Promise<void> {
    await this.mapLink.click();
    await this.page.waitForURL("**/map");
  }

  /**
   * Navigate to the plan page via the link
   */
  async goToPlan(): Promise<void> {
    await this.planLink.click();
    await this.page.waitForURL("**/plan");
  }

  /**
   * Check if the hero section is visible
   */
  async isHeroVisible(): Promise<boolean> {
    return await this.heroSection.isVisible();
  }
}

