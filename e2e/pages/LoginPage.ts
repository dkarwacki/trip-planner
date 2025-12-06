import { type Locator, type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Login page.
 * Handles authentication flow for E2E tests.
 */
export class LoginPage extends BasePage {
  // Locators
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly signupLink: Locator;

  constructor(page: Page) {
    super(page);

    // Define locators using data-testid (following guidelines)
    this.loginForm = page.getByTestId("login-form");
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.errorMessage = page.locator('[role="alert"]');
    this.signupLink = page.getByRole("link", { name: /sign up/i });
  }

  /**
   * Navigate to the login page
   */
  async goto(redirectTo?: string): Promise<void> {
    const path = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login";
    await super.goto(path);
  }

  /**
   * Fill in login credentials
   */
  async fillCredentials(email: string, password: string): Promise<void> {
    // Wait for inputs to be ready (handles React hydration timing)
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });

    // Clear any existing values and fill
    await this.emailInput.clear();
    await this.emailInput.fill(email);

    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
  }

  /**
   * Submit the login form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Perform full login flow
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  /**
   * Login and wait for successful redirect
   */
  async loginAndWaitForRedirect(email: string, password: string, expectedUrl: string | RegExp = "/"): Promise<void> {
    await this.login(email, password);

    // Wait for navigation away from login page
    await this.page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 10000,
    });

    // Optionally verify we're on the expected page
    if (typeof expectedUrl === "string") {
      await expect(this.page).toHaveURL(expectedUrl);
    } else {
      await expect(this.page).toHaveURL(expectedUrl);
    }
  }

  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }
}
