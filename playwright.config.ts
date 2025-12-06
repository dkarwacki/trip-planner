import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for E2E tests.
 * @see https://playwright.dev/docs/test-configuration
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
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
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
