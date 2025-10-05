# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

- `./src` - Source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages (file-based routing)
- `./src/pages/api` - API endpoints
- `./src/middleware/index.ts` - Astro middleware
- `./src/db` - Supabase clients and types
- `./src/types.ts` - Shared types for backend and frontend (Entities, DTOs)
- `./src/components` - Components (Astro for static, React for interactive)
- `./src/components/ui` - Shadcn/ui components
- `./src/lib` - Services and helpers organized by domain
  - `./src/lib/services/{domain}/index.ts` - Server-side service (main entry point)
  - `./src/lib/services/{domain}/client.ts` - Client-side service (browser-only)
  - `./src/lib/services/{domain}/*` - Additional domain-specific modules
- `./src/assets` - Static internal assets
- `./public` - Public assets

## Important Configuration

- **Path aliases**: Use `@/*` for `./src/*` (defined in tsconfig.json)
- **Server output**: Project uses `output: "server"` (SSR mode)
- **Node adapter**: Configured in standalone mode
- **Port**: Development server runs on port 3000
- **Lint-staged**: Automatically runs ESLint on `.ts`, `.tsx`, `.astro` files and Prettier on `.json`, `.css`, `.md` files

## Coding Practices

### Error Handling

- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions
- Place happy path last in functions
- Use guard clauses for preconditions
- Implement proper error logging and user-friendly messages

### Astro Guidelines

- Use `export const prerender = false` for API routes
- Use POST, GET (uppercase) for endpoint handlers
- Use Zod for validation and DTOs: define schemas, use `z.infer<>` for types, wrap in Effect with tagged errors
- Extract logic into services in `src/lib/services`
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

- **Use Effect for business logic and data operations** - Leverage type-safe error handling and composability
- **Always use `Effect.gen`** (generator-style) for effect composition instead of pipe
- **Use tagged errors** (objects with `_tag` field) for better error discrimination
- **Never throw exceptions** - use `Effect.fail` for expected errors and track them in the type system
- **Use `Effect.tryPromise`** when wrapping async operations that might fail
- **Use Effect Streams** for reactive data processing
- **Use branded types** for domain primitives (IDs, emails, etc.)
- **See detailed best practices** in `.cursor/rules/effect.mdc`
