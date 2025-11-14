# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

- **Astro 5** - Modern web framework with server-side rendering
- **React 19** - UI library for interactive components (functional components with hooks)
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/ui** - UI component library (new-york style, with lucide icons)
- **Effect** - Functional effect system for type-safe error handling and composable business logic

## Development Commands

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

## Project Structure

The project follows **Clean Architecture** principles with clear separation of concerns, organized by **feature domains**: `map` (interactive map exploration), `plan` (trip planning chat), and `common` (shared utilities).

- `./src` - Source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages (file-based routing)
- `./src/pages/api` - API endpoints (call application use cases)
- `./src/middleware/index.ts` - Astro middleware

### Clean Architecture Layers (Feature-based)

The structure below uses `{feature}` as a generic pattern applicable to any feature.

- `./src/domain` - **Domain layer** (pure business logic, no external dependencies)
  - `./src/domain/common/` - Shared domain logic
    - `models/` - Core entities
    - `errors/` - Shared errors
  - `./src/domain/{feature}/` - Feature domain
    - `models/` - Feature entities
    - `errors/` - Feature errors
    - `{business_rule}/` - Business rules (eg. scoring)

- `./src/application` - **Application layer** (use cases, orchestration)
  - `./src/application/{feature}/` - Feature use cases
    - `{usecase}/` - Use case per subdirectory
    - `{usecase}/index.ts` - Public API exports

- `./src/infrastructure` - **Infrastructure layer** (external services, I/O, validation)
  - `./src/infrastructure/common/` - Shared infrastructure
    - `api/` - Shared validation schemas and types
      - `schemas.ts` - Common Zod schemas (UUID, coordinates, photos)
      - `types.ts` - Type definitions using z.infer
      - `index.ts` - Barrel exports
    - `config/` - Configuration management
    - `database/` - Supabase database infrastructure
      - `types.ts` - Supabase generated Database types
      - `SupabaseClient.ts` - Effect service wrapper
      - `index.ts` - Barrel exports
    - `google-maps/` - Google Maps API client (used by both features)
      - `schemas.ts` - API response validation schemas
      - `types.ts` - Type definitions for external API
    - `openai/` - OpenAI client (used by both features)
    - `http/` - HTTP utilities (validation, response mappers)
    - `runtime.ts` - Effect runtime configuration with all dependencies
  - `./src/infrastructure/{feature}/` - Feature-specific infrastructure
    - `api/` - API contracts (DTOs and validation)
      - `schemas.ts` - Zod schemas with branded type transforms
      - `types.ts` - DTOs derived with z.infer (all have DTO suffix)
      - `mappers.ts` - Convert DTOs to domain types (toDomain functions)
      - `index.ts` - Barrel exports
    - `database/` - Database layer (DAOs, repositories)
    - `cache/` - Effect cache services (if applicable)
    - `clients/` - Browser API clients

- `./src/components` - Components (Astro for static, React for interactive)
  - `./src/components/common/` - Shared components
  - `./src/components/{feature}/` - Feature components
  - `./src/components/ui/` - Shadcn/ui components

- `./src/lib` - Shared utilities
  - `./src/lib/common/` - Shared utilities
  - `./src/lib/{feature}/` - Feature utilities

- `./src/assets` - Static internal assets
- `./public` - Public assets

### Feature Organization Rationale

- **`common/`** - Code used by multiple features or core to the application
- **`{feature}/`** - Everything related to a specific feature
- API routes and pages remain flat for simplicity

## Important Configuration

- **Path aliases**: Use `@/*` for `./src/*` (defined in tsconfig.json)
- **Server output**: Project uses `output: "server"` (SSR mode)
- **Node adapter**: Configured in standalone mode
- **Port**: Development server runs on port 3000
- **Lint-staged**: Automatically runs ESLint on `.ts`, `.tsx`, `.astro` files and Prettier on `.json`, `.css`, `.md` files

### Error Handling

- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions
- Place happy path last in functions
- Use guard clauses for preconditions
- Implement proper error logging and user-friendly messages
- Use feedback from linters to improve the code when making changes.

### Zod Validation & Schemas

- **Schemas** (`infrastructure/*/api/schemas.ts`): Define Zod schemas with `.transform()` to branded types (from domain)
- **DTOs** (`infrastructure/*/api/types.ts`): Derive types using `z.infer<typeof Schema>` - all API types have DTO suffix
- **Barrel exports** (`infrastructure/*/api/index.ts`): Re-export all schemas and types for convenient imports
- Validate using `safeParse()`, wrap in Effect with tagged errors for error handling

### Data Flow Pattern

The architecture enforces clear data flow with strict layer separation:

**1. API Route (infrastructure adapter):**
- Receives raw HTTP request
- Validates using `infrastructure/*/api/schemas.ts` → gets typed DTO
- **Maps DTO to domain type** using `toDomain` mappers from `infrastructure/*/api/mappers`
- Calls use case with domain command/query
- Maps Effect result to HTTP response

**2. Use Case:**
- Receives **domain type** as input
- NO infrastructure dependencies - only domain types
- No validation needed - data is pre-validated and mapped
- Implements business logic using Effect
- Returns domain models or results

**3. Response Mapping:**
- Map domain results to response DTOs if needed
- Use infrastructure response schemas for transforms
- Return HTTP response

**Key Principles:**
- Validation happens ONCE at the infrastructure boundary
- DTO→Domain mapping happens in infrastructure layer (`toDomain` mappers)
- Application layer depends ONLY on domain types

### Astro Guidelines

- Use `export const prerender = false` for API routes
- Use POST, GET (uppercase) for endpoint handlers
- API routes are **thin adapters** with clear responsibilities:
  1. Validate input using infrastructure schemas
  2. Map DTO to domain type using `toDomain` mappers
  3. Call application use case with domain command/query
  4. Map Effect result to HTTP response
- Use Zod for validation (import schemas from `infrastructure/*/api`), wrap in Effect with tagged errors
- Use `toDomain` mappers (from `infrastructure/*/api/mappers`) to convert DTOs to domain types
- Use cases receive **domain types only** (from `domain/*/models/types.ts`)
- Use `Astro.cookies` for server-side cookie management
- Use `import.meta.env` for environment variables
- Leverage View Transitions API for smooth page transitions

### React Guidelines

- Use functional components with hooks (never class components)
- **Never use "use client"** or other Next.js directives
- Extract custom hooks into `src/components/hooks`
- Use React.memo() for expensive components
- Use React.lazy() and Suspense for code-splitting
- Use useCallback for event handlers passed to children
- Use useMemo for expensive calculations
- Use useId() for generating unique IDs for accessibility

### Component Strategy

- Use Astro components (.astro) for static content and layouts
- Use React components (.tsx) only when interactivity is needed

### Tailwind CSS

- Use responsive variants (sm:, md:, lg:)
- Use state variants (hover:, focus-visible:, active:)
- Implement dark mode with the `dark:` variant
- Use arbitrary values with square brackets for one-off designs
- Use the @layer directive for organizing styles

### Accessibility

- Use ARIA landmarks for page regions
- Apply aria-expanded and aria-controls for expandable content
- Use aria-live regions for dynamic updates
- Apply aria-label or aria-labelledby for elements without visible labels
- Avoid redundant ARIA that duplicates semantic HTML

### Backend (Supabase)

- Use supabase from `context.locals` in Astro routes (not direct imports)
- Use SupabaseClient type from `src/db/supabase.client.ts`
- Use Zod schemas to validate data exchanged with backend
- Follow Supabase guidelines for security and performance

### Effect Guidelines

- **Use Effect for server-side logic only** (API routes, use cases, infrastructure services)
- **Use plain async/await in browser components** (React hooks, event handlers call browser API clients from `infrastructure/http/clients`)
- **Always use `Effect.gen`** (generator-style) for effect composition instead of pipe
- **Always yield the service tag first to get the instance**, then call methods on that instance
- **Use tagged errors** (objects with `_tag` field) for better error discrimination
- **Never throw exceptions** - use `Effect.fail` for expected errors and track them in the type system
- **Use Context.Tag + Layer** for dependency injection (see `infrastructure/runtime.ts`)
- **Use branded types** for domain primitives (IDs, emails, etc.)
- **See detailed best practices** in `.cursor/rules/effect.mdc`
