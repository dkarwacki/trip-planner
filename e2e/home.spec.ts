import { expect, test } from "@playwright/test";
import { HomePage } from "./pages";

/**
 * Example E2E test suite for the Home page.
 * Demonstrates Page Object Model pattern and Playwright best practices.
 *
 * TODO: Remove this file once you have real E2E tests in place.
 */
test.describe("Home Page", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("should load successfully", async () => {
    await expect(homePage.page).toHaveURL("/");
  });

  test("should have correct title", async () => {
    const title = await homePage.getTitle();
    expect(title).toBeTruthy();
  });

  test("should display page content", async ({ page }) => {
    // Wait for the page to be fully loaded
    await homePage.waitForPageLoad();

    // Verify body has content
    const body = page.locator("body");
    await expect(body).toBeVisible();
    await expect(body).not.toBeEmpty();
  });

  test.describe("Navigation", () => {
    test("should navigate to map page", async ({ page }) => {
      // Skip if map link is not present on the page
      const mapLinkVisible = await homePage.mapLink.isVisible().catch(() => false);

      if (mapLinkVisible) {
        await homePage.goToMap();
        await expect(page).toHaveURL(/\/map/);
      } else {
        test.skip();
      }
    });

    test("should navigate to plan page", async ({ page }) => {
      // Skip if plan link is not present on the page
      const planLinkVisible = await homePage.planLink.isVisible().catch(() => false);

      if (planLinkVisible) {
        await homePage.goToPlan();
        await expect(page).toHaveURL(/\/plan/);
      } else {
        test.skip();
      }
    });
  });
});

