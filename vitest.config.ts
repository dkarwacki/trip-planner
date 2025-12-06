import { defineConfig } from "vitest/config";
import react from "@astrojs/react";

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment for DOM testing (React components)
    environment: "jsdom",

    // Global setup file
    setupFiles: ["./tests/setup.ts"],

    // Enable globals (describe, it, expect) without imports
    globals: true,

    // Include patterns for test files
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/unit/**/*.{test,spec}.{ts,tsx}"],

    // Exclude patterns
    exclude: ["node_modules", "dist", "e2e/**/*"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/env.d.ts",
        "src/components/ui/**", // Shadcn UI components
      ],
    },

    // Path aliases matching tsconfig
    alias: {
      "@/": new URL("./src/", import.meta.url).pathname,
      "@/domain/": new URL("./src/domain/", import.meta.url).pathname,
      "@/application/": new URL("./src/application/", import.meta.url).pathname,
      "@/infrastructure/": new URL("./src/infrastructure/", import.meta.url).pathname,
    },

    // TypeScript configuration
    typecheck: {
      enabled: false, // Enable if you want type checking during tests
    },
  },
});
