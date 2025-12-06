import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Playwright configuration for E2E tests.
 * @see https://playwright.dev/docs/test-configuration
 *
 * Authentication:
 * Tests require authentication. Set these environment variables in .env:
 * - E2E_USERNAME: Test user email
 * - E2E_PASSWORD: Test user password
 * - E2E_USERNAME_ID: Test user UUID (for database cleanup)
 */
export default defineConfig({
  // Directory containing test files
  testDir: "./e2e",

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [["html", { open: "never" }], ["list"]],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: "http://localhost:3000",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Take screenshot on failure
    screenshot: "only-on-failure",

    // Record video on retry
    video: "on-first-retry",
  },

  // Configure projects for Chromium/Desktop Chrome only (as per guidelines)
  projects: [
    // Setup project - runs authentication
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      teardown: "cleanup",
    },

    // Teardown project - cleans up test data
    {
      name: "cleanup",
      testMatch: /global\.teardown\.ts/,
    },

    // Main tests project - depends on setup
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use authenticated state from setup
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  // Run your local dev server before starting the tests
  // NOTE: Start the server manually with `npm run dev:astro` before running E2E tests,
  // or ensure Supabase is running if the app requires it.
  webServer: {
    command: "npm run dev:astro",
    url: "http://localhost:3000",
    reuseExistingServer: true, // Always reuse existing server - start it manually first
    timeout: 120000,
    stdout: "pipe",
    stderr: "pipe",
  },

  // Output folder for test artifacts
  outputDir: "test-results",

  // Timeout for each test
  timeout: 30000,

  // Timeout for expect assertions
  expect: {
    timeout: 5000,
  },
});
