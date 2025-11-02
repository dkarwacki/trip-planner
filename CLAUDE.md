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

The project follows **Clean Architecture** principles with clear separation of concerns:

- `./src` - Source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages (file-based routing)
- `./src/pages/api` - API endpoints (call application use cases)
- `./src/middleware/index.ts` - Astro middleware
- `./src/components` - Components (Astro for static, React for interactive)
- `./src/components/ui` - Shadcn/ui components

### Clean Architecture Layers

- `./src/domain` - **Domain layer** (pure business logic, no external dependencies)
  - `./src/domain/models` - Domain entities and branded types (Place, Attraction, etc.)
  - `./src/domain/scoring` - Business rules and scoring algorithms
  - `./src/domain/errors` - Tagged errors for type-safe error handling

- `./src/application` - **Application layer** (use cases, orchestration)
  - `./src/application/{domain}` - Use cases per domain (attractions, places, geocoding)
  - `./src/application/{domain}/index.ts` - Public API exports
  - `./src/application/{domain}/inputs.ts` - Zod schemas for input validation
  - `./src/application/{domain}/outputs.ts` - Zod schemas for output validation with transforms

- `./src/infrastructure` - **Infrastructure layer** (external services, I/O)
  - `./src/infrastructure/google-maps` - Google Maps API client implementation
  - `./src/infrastructure/cache` - Caching services (Effect Cache)
  - `./src/infrastructure/config` - Configuration management
  - `./src/infrastructure/http` - HTTP utilities (validation, response mappers, browser clients)
  - `./src/infrastructure/db` - Supabase clients and types
  - `./src/infrastructure/runtime.ts` - Effect runtime configuration with all dependencies

- `./src/lib` - Shared utilities (utils.ts)
- `./src/assets` - Static internal assets
- `./public` - Public assets

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

- **Input schemas** (`inputs.ts`): Validate incoming data without transforms
- **Output schemas** (`outputs.ts`): Validate external data + use `.transform()` to convert to branded types

### Astro Guidelines

- Use `export const prerender = false` for API routes
- Use POST, GET (uppercase) for endpoint handlers
- API routes are **thin adapters**: validate input → call application use case → map response
- Use Zod for validation (schemas in `application/*/inputs.ts` and `application/*/outputs.ts`), wrap in Effect with tagged errors
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
- **Use tagged errors** (objects with `_tag` field) for better error discrimination
- **Never throw exceptions** - use `Effect.fail` for expected errors and track them in the type system
- **Use Context.Tag + Layer** for dependency injection (see `infrastructure/runtime.ts`)
- **Use branded types** for domain primitives (IDs, emails, etc.)
- **See detailed best practices** in `.cursor/rules/effect.mdc`
