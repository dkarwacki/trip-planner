import { test as setup, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

/**
 * Authentication setup for E2E tests.
 *
 * This file logs in and saves the authentication state to be reused by other tests.
 * Test credentials should be provided via environment variables in .env:
 * - E2E_USERNAME_ID: Test user ID (optional, for reference)
 * - E2E_USERNAME: Test user email
 * - E2E_PASSWORD: Test user password
 */

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E test credentials not provided. " +
        "Set E2E_USERNAME and E2E_PASSWORD environment variables in .env file.\n" +
        "Required: E2E_USERNAME, E2E_PASSWORD\n" +
        `Current values: E2E_USERNAME=${email ? "[set]" : "[missing]"}, E2E_PASSWORD=${password ? "[set]" : "[missing]"}`
    );
  }

  const loginPage = new LoginPage(page);

  // Navigate to login page
  await loginPage.goto();

  // Wait for the login form to be visible (using data-testid)
  await loginPage.loginForm.waitFor({ state: "visible", timeout: 10000 });

  // Perform login
  await loginPage.login(email, password);

  // Wait for the submit button to show loading state (indicates form submission started)
  // Then wait for navigation
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15000,
    waitUntil: "networkidle",
  });

  // Verify we're logged in (not on login page)
  await expect(page).not.toHaveURL(/\/login/);

  // Save storage state (cookies, localStorage, etc.)
  await page.context().storageState({ path: authFile });
});
