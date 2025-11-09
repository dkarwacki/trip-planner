# Supabase Astro Initialization

This document provides a reproducible guide to integrate Supabase with your Astro + Effect project following Clean Architecture principles.

## Prerequisites

- Your project uses Astro 5, TypeScript 5, React 19, Tailwind 4, and Effect 3.18
- Install the `@supabase/supabase-js` package
- Ensure `/supabase/config.toml` exists
- Ensure `/src/infrastructure/common/database/types.ts` exists with correct database type definitions
- Environment variables `SUPABASE_URL` and `SUPABASE_KEY` are defined in `src/env.d.ts`

IMPORTANT: Check prerequisites before performing actions below. If they're not met, stop and ask the user for the fix.

## File Structure and Setup

### 1. Add Supabase Configuration Errors

Add to `/src/domain/common/errors/ConfigErrors.ts`:

```ts
export class MissingSupabaseUrlError {
  readonly _tag = "MissingSupabaseUrlError";
}

export class MissingSupabaseKeyError {
  readonly _tag = "MissingSupabaseKeyError";
}
```

### 2. Update ConfigService

Add Supabase configuration methods to `/src/infrastructure/common/config/ConfigService.ts`:

```ts
// Add to imports
import { MissingSupabaseUrlError, MissingSupabaseKeyError } from "@/domain/common/errors";

// Add to IConfigService interface
export interface IConfigService {
  // ... existing methods ...
  readonly getSupabaseUrl: () => Effect.Effect<string, MissingSupabaseUrlError>;
  readonly getSupabaseKey: () => Effect.Effect<string, MissingSupabaseKeyError>;
}

// Add to ConfigServiceLive Layer.succeed implementation
export const ConfigServiceLive = Layer.succeed(ConfigService, {
  // ... existing methods ...
  getSupabaseUrl: () =>
    Effect.gen(function* () {
      const url = import.meta.env.SUPABASE_URL;

      if (!url) {
        yield* Effect.logError("SUPABASE_URL is not configured");
        return yield* Effect.fail(new MissingSupabaseUrlError());
      }

      return url;
    }),
  getSupabaseKey: () =>
    Effect.gen(function* () {
      const key = import.meta.env.SUPABASE_KEY;

      if (!key) {
        yield* Effect.logError("SUPABASE_KEY is not configured");
        return yield* Effect.fail(new MissingSupabaseKeyError());
      }

      return key;
    }),
});
```

### 3. Create Supabase Client Service

Create `/src/infrastructure/common/database/SupabaseClient.ts`:

```ts
import { Effect, Context, Layer } from "effect";
import { createClient, type SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";
import type { Database } from "./types";
import { ConfigService } from "../config";

export interface ISupabaseClient {
  readonly client: SupabaseClientType<Database>;
}

export class SupabaseClient extends Context.Tag("SupabaseClient")<SupabaseClient, ISupabaseClient>() {}

export const SupabaseClientLive = Layer.effect(
  SupabaseClient,
  Effect.gen(function* () {
    const config = yield* ConfigService;
    const url = yield* config.getSupabaseUrl();
    const key = yield* config.getSupabaseKey();

    const client = createClient<Database>(url, key);

    return { client };
  })
);
```

### 4. Update Database Index Exports

Update `/src/infrastructure/common/database/index.ts` to export the Supabase client:

```ts
/**
 * Database barrel export
 *
 * Re-exports Supabase types and client for convenient importing.
 */

export type { Json, Database, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes } from "./types";
export { Constants } from "./types";
export { SupabaseClient, SupabaseClientLive, type ISupabaseClient } from "./SupabaseClient";
```

### 5. Update Runtime with Supabase Layer

Update `/src/infrastructure/common/runtime.ts`:

```ts
// Add to imports
import { SupabaseClientLive } from "./database";

// Add Supabase layer with config dependency
const SupabaseWithConfig = SupabaseClientLive.pipe(Layer.provide(ConfigServiceLive));

// Add to Layer.mergeAll
export const AppLayer = Layer.mergeAll(
  ConfigServiceLive,
  GoogleMapsWithConfig,
  OpenAIWithConfig,
  SupabaseWithConfig, // Add this line
  AttractionsWithDeps,
  RestaurantsWithDeps,
  PhotoCacheWithConfig,
  TextSearchWithDeps
);
```

### 6. Update Middleware

Update `/src/middleware/index.ts` to provide Supabase via context.locals:

```ts
import { defineMiddleware } from "astro:middleware";
import { Effect } from "effect";
import { AppRuntime } from "@/infrastructure/common/runtime";
import { SupabaseClient } from "@/infrastructure/common/database";

export const onRequest = defineMiddleware(async (context, next) => {
  // Get Supabase client from Effect runtime
  const supabaseService = await Effect.runPromise(
    Effect.provide(SupabaseClient, AppRuntime)
  );

  context.locals.supabase = supabaseService.client;

  return next();
});
```

### 7. Update TypeScript Definitions

Update `src/env.d.ts` to add the Supabase client type to `App.Locals`:

```ts
/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/common/database/types";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
    }
  }
}

// Environment variables already defined in existing file
```

## Usage Patterns

### In API Routes (Astro Endpoints)

Access Supabase via `context.locals.supabase`:

```ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const { data, error } = await locals.supabase
    .from("trips")
    .select("*");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data));
};
```

### In Application Use Cases (Effect-based)

Depend on `SupabaseClient` through Effect's dependency injection:

```ts
import { Effect } from "effect";
import { SupabaseClient } from "@/infrastructure/common/database";

export const getSomeData = Effect.gen(function* () {
  const { client } = yield* SupabaseClient;

  const result = yield* Effect.tryPromise({
    try: () => client.from("trips").select("*"),
    catch: (error) => new DatabaseError(/* ... */),
  });

  if (result.error) {
    return yield* Effect.fail(new DatabaseError(result.error.message));
  }

  return result.data;
});
```

## Notes

- **Server-side only**: Supabase client is configured for server-side use through Effect DI
- **Type safety**: The `Database` type from `types.ts` ensures type-safe database operations
- **Dependency injection**: Use cases can depend on `SupabaseClient` through Effect's Context
- **Error handling**: Config errors are tracked in the type system via Effect
- **Clean Architecture**: Supabase is in the infrastructure layer, domain and application layers remain pure