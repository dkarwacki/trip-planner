# Trip Planner

A modern trip planning application built with Astro, React, and TypeScript following Clean Architecture principles.

## Tech Stack

### Core

- [Astro](https://astro.build/) v5 - Modern web framework with SSR mode
- [React](https://react.dev/) v19 - UI library for interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4 - Utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - Component library built on Radix UI

### Backend & Data

- [Effect](https://effect.website/) - Functional effect system for type-safe error handling
- [Supabase](https://supabase.com/) - Authentication and database
- [Zod](https://zod.dev/) - Schema validation

### External Services

- Google Maps API - Interactive maps and place data
- OpenAI (via OpenRouter) - AI-powered trip planning chat

### Testing

- [Vitest](https://vitest.dev/) - Unit testing framework
- [Playwright](https://playwright.dev/) - End-to-end testing
- [Testing Library](https://testing-library.com/) - React component testing utilities

## Prerequisites

- Node.js v22+ (see `.nvmrc`)
- npm
- Supabase CLI (for local development)

## Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
cd trip-planner
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Start the development server:

```bash
npm run dev
```

This will start both Supabase and the Astro dev server.

## Available Scripts

### Development

- `npm run dev` - Start development server (Supabase + Astro)
- `npm run dev:astro` - Start only Astro dev server
- `npm run dev:supabase` - Start only Supabase
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

### Testing

- `npm run test` - Run unit tests in watch mode
- `npm run test:run` - Run unit tests once
- `npm run test:watch` - Run unit tests in watch mode
- `npm run test:ui` - Open Vitest UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run E2E tests
- `npm run test:e2e:ui` - Open Playwright UI
- `npm run test:e2e:debug` - Debug E2E tests
- `npm run test:e2e:report` - View E2E test report

## Project Structure

The project follows **Clean Architecture** principles with feature-based organization:

```
src/
├── domain/                 # Domain layer (pure business logic)
│   ├── common/            # Shared domain logic
│   ├── auth/              # Authentication domain
│   ├── map/               # Map feature domain
│   └── plan/              # Trip planning domain
├── application/           # Application layer (use cases)
│   ├── map/               # Map use cases
│   └── plan/              # Planning use cases
├── infrastructure/        # Infrastructure layer (external services)
│   ├── common/            # Shared infrastructure
│   ├── auth/              # Auth infrastructure
│   ├── map/               # Map API clients, cache
│   └── plan/              # Planning infrastructure
├── components/            # UI components
│   ├── ui/                # Shadcn/ui components
│   ├── common/            # Shared components
│   ├── auth/              # Auth components
│   ├── map/               # Map feature components
│   └── plan/              # Planning feature components
├── pages/                 # Astro pages
│   └── api/               # API endpoints
├── layouts/               # Astro layouts
├── lib/                   # Shared utilities
├── middleware/            # Astro middleware
└── styles/                # Global styles

tests/
├── setup.ts               # Vitest global setup
├── vitest.d.ts            # TypeScript declarations
├── domain/                # Domain layer tests
├── application/           # Use case tests
└── infrastructure/        # Infrastructure tests

e2e/
├── pages/                 # Page objects
└── *.spec.ts              # E2E test files
```

## Testing

### Unit Tests (Vitest)

Tests are located in `tests/` mirroring the source structure (`domain/`, `application/`, `infrastructure/`), or co-located with components using `*.test.tsx` pattern.

```bash
# Run tests
npm run test:run

# Run with coverage
npm run test:coverage
```

### E2E Tests (Playwright)

E2E tests use the Page Object Model pattern. Page objects are in `e2e/pages/`.

```bash
# Run E2E tests (starts dev server automatically)
npm run test:e2e

# Open Playwright UI for debugging
npm run test:e2e:ui
```

## License

MIT
