# Tech Stack

## Core Framework & Language

- **Astro 5** - Modern web framework with SSR mode
- **React 19** - UI library for interactive components (functional components with hooks)
- **TypeScript 5** - Type-safe JavaScript with strict mode
- **Node.js Adapter** - Standalone deployment mode

## UI & Styling

- **Tailwind CSS 4** - Utility-first CSS framework (via Vite plugin)
- **Shadcn/ui** - Component library (new-york style) built on Radix UI primitives
- **Lucide React** - Icon library
- **Class Variance Authority (CVA)** - Component variant management
- **Vaul** - Mobile drawer component
- **@dnd-kit** - Drag-and-drop functionality for itinerary management

## Backend Architecture

### Clean Architecture (Feature-based)

- **Domain Layer** - Pure business logic (models, errors, scoring algorithms)
- **Application Layer** - Use cases and orchestration
- **Infrastructure Layer** - External services, I/O operations

### Effect Ecosystem

- **Effect 3.18** - Functional effect system for type-safe error handling
- **Server-side only** - Client uses plain async/await

## External Services

- **Google Maps API**
  - Client: `@vis.gl/react-google-maps` for interactive maps
  - Server: Rest calls to Google Maps API
  - Dual API keys: private (server) and public (client)

- **OpenAI** (via OpenRouter)
  - Chat Completion API with JSON mode
  - Tool calling support

## Data & Validation

- **Zod 3.25** - Schema validation for inputs and outputs
  - Input schemas without transforms
  - Output schemas with `.transform()` for branded types
- **Effect.Cache** - Server-side caching for external API responses

## Development Tools

- **ESLint 9** - Linting with flat config
- **Prettier** - Code formatting with Astro support
- **Husky + lint-staged** - Pre-commit hooks

## Testing

- **Vitest** - Unit testing framework
- **Playwright** - End-to-end testing

## Planned Integrations

- **Supabase** - User authentication and database persistence (configured, not yet integrated)
