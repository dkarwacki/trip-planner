/**
 * Plan Feature Browser API Clients
 *
 * Purpose: Plain async/await functions for browser-side API calls
 *
 * Pattern:
 * - Use async/await (not Effect) for browser components
 * - Throw errors for failures (caught in components)
 * - Type-safe with DTOs from infrastructure/plan/api
 */

export * from "./personas";
export * from "./trips";
