---
trigger: always_on
---

# AI Rules for Trip Planner

## Our relationship

- Im experienced Scala Developer which value well writen functional code
- Im willing to learn how to write good TypeScript code keeping best practices from functional programming
- YOU MUST speak up immediately when you don't know something
- When you disagree with my approach, YOU MUST push back, citing specific technical reasons if you have them
- YOU MUST call out bad ideas, unreasonable expectations, and mistakes - I depend on this
- NEVER be agreeable just to be nice - I need your honest technical judgment
- NEVER utter the phrase "You're absolutely right!" We're working together because I value your opinion.
- YOU MUST ALWAYS ask for clarification rather than making assumptions.
- If you're having trouble, YOU MUST STOP and ask for help, especially for tasks where human input would be valuable.

## Tech Stack

- Astro 5
- TypeScript 5
- React 19
- Tailwind 4
- Shadcn/ui
- Effect

## Project Structure

When introducing changes to the project, always follow the directory structure below:

The project follows **Clean Architecture** principles with clear separation of concerns, organized by **feature domains**: `map` (interactive map exploration), `plan` (trip planning chat), and `common` (shared utilities).

- `./src` - source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages
- `./src/pages/api` - API endpoints (thin adapters calling application use cases)
- `./src/middleware/index.ts` - Astro middleware

### Feature-based Organization

- `./src/domain` - Domain layer (pure business logic, no dependencies)
  - `./src/domain/common/` - Shared domain logic
    - `models/` - Core entities
    - `errors/` - Shared errors
  - `./src/domain/{feature}/` - Feature domain
    - `models/` - Feature entities
    - `errors/` - Feature errors
    - `scoring/` - Business rules and algorithms (if applicable)

- `./src/application` - Application layer (use cases with Effect)
  - **No validation logic**: Purely business logic orchestration
  - Use cases implement domain logic with Effect
  - `./src/application/{feature}/` - Feature use cases

- `./src/infrastructure` - Infrastructure layer (external services, I/O)
  - `./src/infrastructure/common/` - Shared infrastructure
    - `api/` - Shared validation schemas and types
      - `schemas.ts` - Common Zod schemas (UUID, coordinates, photos)
      - `types.ts` - Type definitions using z.infer
      - `index.ts` - Barrel exports
    - `config/` - Configuration service
    - `database/` - Supabase database infrastructure
      - `types.ts` - Supabase generated Database types
      - `SupabaseClient.ts` - Effect service wrapper
      - `index.ts` - Barrel exports
    - `google-maps/` - Google Maps API client
      - `schemas.ts` - API response validation schemas
      - `types.ts` - Type definitions for external API
    - `openai/` - OpenAI client
    - `http/` - HTTP utilities (validation, response mappers)
    - `runtime.ts` - Effect runtime with all dependencies
  - `./src/infrastructure/{feature}/` - Feature-specific infrastructure
    - `api/` - API contracts (DTOs and validation)
      - `schemas.ts` - Zod schemas with branded type transforms
      - `types.ts` - DTOs derived with z.infer (all have DTO suffix)
      - `mappers.ts` - Convert DTOs to domain types (toDomain functions)
      - `index.ts` - Barrel exports
    - `database/` - Database layer (DAOs, repositories)
    - `cache/` - Effect cache services (if applicable)
    - `clients/` - Browser API clients

- `./src/components` - Client-side components
  - `./src/components/common/` - Shared components
  - `./src/components/{feature}/` - Feature components
  - `./src/components/ui/` - Shadcn/ui components

- `./src/lib` - Shared utilities
  - `./src/lib/common/` - Shared utilities (storage, utils)
  - `./src/lib/{feature}/` - Feature utilities

- `./src/assets` - static internal assets
- `./public` - public assets

When modifying the directory structure, always update this section.

## Coding practices

### General Guidelines

- Use Astro components (.astro) for static content and layout
- Implement framework components in React only when interactivity is needed

### Guidelines for Clean Code

- Use feedback from linters to improve the code when making changes.
- Prioritize error handling and edge cases.
- Handle errors and edge cases at the beginning of functions.
- Use early returns for error conditions to avoid deeply nested if statements.
- Place the happy path last in the function for improved readability.
- Avoid unnecessary else statements; use if-return pattern instead.
- Use guard clauses to handle preconditions and invalid states early.
- Implement proper error logging and user-friendly error messages.
- Consider using custom error types or error factories for consistent error handling.

### Validation and Data Transfer Objects (DTOs)

- Use Zod for validation: define schemas in `infrastructure/*/api/schemas.ts`, use `z.infer<>` in `types.ts`
- **Schemas** (`api/schemas.ts`): Define Zod schemas with `.transform()` to branded types (from domain)
- **DTOs** (`api/types.ts`): Derive types using `z.infer<typeof Schema>` - all API types have DTO suffix
- **Barrel exports** (`api/index.ts`): Re-export all schemas and types for convenient imports
- Validate using `safeParse()`, wrap in Effect with tagged errors for error handling

**DTO Naming Conventions:**

- Command inputs: `*CommandDTO` (e.g., `CreateTripCommandDTO`, `ChatRequestCommandDTO`) - live in `infrastructure/*/api/types.ts`
- Query results from repositories: `*DTO` (e.g., `TripDTO`, `AttractionDTO`, `PlaceDTO`)
- Domain command/query types: `*Command` or `*Query` (e.g., `ChatRequestCommand`, `GetAttractionsQuery`) - live in `domain/*/models/types.ts`
- **Infrastructure layer owns DTOs, domain layer owns command/query types**
- **Application layer uses ONLY domain types, never infrastructure types**

**Data Flow:**

1. API route receives raw request → validates with infrastructure schema → gets CommandDTO
2. API route maps DTO to domain type using `toDomain` mappers → gets domain command/query
3. Use case receives domain command → implements business logic → returns domain result
4. No validation or DTO handling in application layer - it works with pure domain types

**Mappers:**

- `infrastructure/*/api/mappers.ts` - Convert DTOs to domain types
- Export `toDomain` object with mapping functions (e.g., `toDomain.chatRequest(dto)`)
- Infrastructure layer owns the mapping responsibility

### Guidelines for Effect

- **Use Effect for server-side logic** (API routes, use cases, infrastructure services)
- **Use plain async/await in browser components** (React hooks, event handlers)
- **Always use `Effect.gen`** (generator-style) for effect composition instead of pipe
- **Always yield the service tag first to get the instance**, then call methods on that instance
- **Use tagged errors** (objects with `_tag` field) for better error discrimination
- **Never throw exceptions** - use `Effect.fail` for expected errors and track them in the type system
- **Use Context.Tag + Layer** for dependency injection (see `infrastructure/runtime.ts`)
- **Use branded types** for domain primitives (IDs, emails, etc.)
- **See detailed best practices** in `.cursor/rules/effect.mdc`

### Guidelines for React

- Use functional components with hooks instead of class components
- Never use "use client" and other Next.js directives as we use React with Astro
- Implement React.memo() for expensive components that render often with the same props
- Utilize React.lazy() and Suspense for code-splitting and performance optimization
- Use the useCallback hook for event handlers passed to child components to prevent unnecessary re-renders
- Prefer useMemo for expensive calculations to avoid recomputation on every render
- Implement useId() for generating unique IDs for accessibility attributes
- Consider using the new useOptimistic hook for optimistic UI updates in forms
- Use useTransition for non-urgent state updates to keep the UI responsive

### Guidelines for Astro

- Leverage View Transitions API for smooth page transitions (use ClientRouter)
- Use content collections with type safety for blog posts, documentation, etc.
- Leverage Server Endpoints for API routes
- Use POST, GET - uppercase format for endpoint handlers
- Use `export const prerender = false` for API routes
- Extract logic into services in `src/lib/services`
- Implement middleware for request/response modification
- Use image optimization with the Astro Image integration
- Implement hybrid rendering with server-side rendering where needed
- Use Astro.cookies for server-side cookie management
- Leverage import.meta.env for environment variables

### Guidelines for Styling

#### Tailwind

- Use the @layer directive to organize styles into components, utilities, and base layers
- Use arbitrary values with square brackets (e.g., w-[123px]) for precise one-off designs
- Implement the Tailwind configuration file for customizing theme, plugins, and variants
- Leverage the theme() function in CSS for accessing Tailwind theme values
- Implement dark mode with the dark: variant
- Use responsive variants (sm:, md:, lg:, etc.) for adaptive designs
- Leverage state variants (hover:, focus-visible:, active:, etc.) for interactive elements

### Guidelines for Accessibility

#### ARIA Best Practices

- Use ARIA landmarks to identify regions of the page (main, navigation, search, etc.)
- Apply appropriate ARIA roles to custom interface elements that lack semantic HTML equivalents
- Set aria-expanded and aria-controls for expandable content like accordions and dropdowns
- Use aria-live regions with appropriate politeness settings for dynamic content updates
- Implement aria-hidden to hide decorative or duplicative content from screen readers
- Apply aria-label or aria-labelledby for elements without visible text labels
- Use aria-describedby to associate descriptive text with form inputs or complex elements
- Implement aria-current for indicating the current item in a set, navigation, or process
- Avoid redundant ARIA that duplicates the semantics of native HTML elements
