---
description: Unit testing patterns with Vitest for TypeScript projects
globs: tests/**/*.test.ts, tests/**/*.test.tsx
alwaysApply: false
---

# Unit Testing with Vitest

## Test Structure

- **Use Given/When/Then comments for clarity**
  - `// Given` - Set up test data and preconditions
  - `// When` - Execute the code under test
  - `// Then` - Assert expected outcomes
  - Keep comments concise - just the keyword, no descriptions

- **Group tests hierarchically with describe blocks**
  - Use descriptive names that reference requirements
  - Nest describe blocks to organize related test suites
  - Component-level → Feature-level → Scenario-level

- **Write descriptive test names**
  - Use full sentences starting with "should"
  - Include the expected behavior and context
  - Example: `should return 100 when attraction type matches persona`

## Test Data & Fixtures

- **Create fixtures files for reusable test data**
  - Place in same directory as tests: `tests/domain/*/fixtures.ts`
  - Export as object with factory functions: `export const EntityFixtures = { create, ... }`
  - NEVER use classes for fixtures - use plain functions to avoid linter issues

- **Implement factory functions with sensible defaults**
  - Base `create()` function with default values and overrides parameter
  - Specialized factories for common scenarios (e.g., `createHighQuality()`, `withReviews()`)
  - Accept partial overrides: `Partial<Omit<Entity, "id" | "location">> & { id?: string }`
  - Use type assertion `as Entity` when working with branded types

- **Handle branded types in fixtures**
  - Apply brand constructors in the factory: `PlaceId(id || "default-id")`
  - Use type assertion on return if needed: `return { ... } as Entity`
  - This centralizes type complexity away from test code

## Type Safety

- **Avoid non-null assertions in tests**
  - Use optional chaining: `result.find(...)?.property`
  - Provide fallback values: `?? 0` or `?? ""`
  - Use `expect(value).toBeDefined()` before accessing properties if needed

- **Import only what you need from vitest**
  - Import specific functions: `import { describe, expect, it } from "vitest"`
  - Avoid importing entire vi object unless using mocks

- **Preserve type information**
  - Keep fixtures strongly typed
  - Use `z.infer<typeof Schema>` for Zod-validated types
  - Ensure mocks preserve original type signatures with `vi.fn<Type>()`

## Assertions

- **Use appropriate matchers**
  - `toBe()` for primitives and references
  - `toEqual()` for objects and arrays
  - `toBeCloseTo(value, decimals)` for floating-point numbers
  - `toBeGreaterThan()`, `toBeLessThan()` for comparisons

- **Include explanatory comments for complex assertions**
  - Document formulas
  - Explain expected values
  - Keep formulas inline near assertions

- **Test edge cases explicitly**
  - Missing/undefined values
  - Zero values
  - Empty arrays/objects
  - Boundary conditions

## Mocking

- **Use vi.fn() for function mocks**
  - `const mockFn = vi.fn().mockReturnValue(value)`
  - Verify calls with `expect(mockFn).toHaveBeenCalledWith(args)`

- **Place vi.mock() at top level**
  - Mock factory functions run before imports
  - Return typed mock implementations
  - Use `mockImplementation()` for dynamic behavior

## Test Organization

- **Follow mirror structure**
  - Tests in `tests/` mirror `src/` structure
  - Co-locate component tests: `Component.test.tsx` next to `Component.tsx`
  - Keep fixtures close to tests that use them

- **Name test files consistently**
  - `*.test.ts` or `*.test.tsx`

- **Separate test concerns**
  - Domain tests: Pure functions, business logic
  - Application tests: Use cases with mocked dependencies
  - Infrastructure tests: External service interactions (mocked)
  - Component tests: UI behavior and rendering

## Development Workflow

- **Run tests in watch mode during development**
  - `npm run test` for watch mode
  - `npm run test:run` for single run
  - Filter with `-t "pattern"` to focus on specific tests

- **Check coverage purposefully**
  - `npm run test:coverage` generates coverage report
  - Focus on meaningful tests, not arbitrary coverage percentages
  - Critical paths should have high coverage

- **Use UI mode for debugging**
  - `vitest --ui` opens visual test explorer
  - Helpful for large test suites and debugging failures
