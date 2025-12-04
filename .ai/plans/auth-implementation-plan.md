# Authentication Implementation Specification

This specification details the architecture for implementing user authentication (US-025 to US-035) using Supabase Auth integrated with the existing Astro 5 / React 19 / Effect stack.

## 0. Prerequisites

### 0.1 Core Requirements

1. Use `@supabase/ssr` package (NOT auth-helpers)
2. Use ONLY `getAll` and `setAll` for cookie management
3. NEVER use individual `get`, `set`, or `remove` cookie methods
4. Implement proper session management with middleware based on JWT (Supabase Auth)

### 0.2 Installation

```bash
npm install @supabase/ssr @supabase/supabase-js
```

**Note:** The project already has `@supabase/supabase-js` installed. Ensure `@supabase/ssr` is added for proper SSR cookie handling.

## 1. User Interface Architecture

### 1.1 New Pages and Routes

| Route | Type | Purpose |
|-------|------|---------|
| `/login` | Astro Page | Email/password and Google OAuth login |
| `/signup` | Astro Page | User registration with email/password or Google |
| `/reset-password` | Astro Page | Request password reset email |
| `/update-password` | Astro Page | Set new password (from email link) |
| `/auth/callback` | Astro Page | OAuth and magic link callback handler |
| `/verify-email` | Astro Page | Email verification confirmation |

### 1.2 New Components Structure

**Location:** `src/components/auth/`

```
auth/
  layout/
    AuthLayout.tsx          # Centered card wrapper (440px, 32px padding)
    AuthFormInput.tsx       # Reusable input with inline error
    PasswordStrengthIndicator.tsx  # Visual password requirements
    FormErrorMessage.tsx    # Inline error display
  GoogleOAuthButton.tsx     # OAuth button with loading state
  EmailVerificationBanner.tsx  # Dismissible verification reminder
  SessionExpiredToast.tsx   # Toast for expired sessions
  skeletons/
    ChatSkeleton.tsx        # For /plan loading
    MapSkeleton.tsx         # For /map loading
  user-menu/
    UserMenuDropdown.tsx    # Desktop (shadcn/ui DropdownMenu)
    UserMenuDrawer.tsx      # Mobile (Vaul drawer)
  index.ts
```

**Location:** `src/components/auth/stores/`

```
stores/
  authStore.ts              # Zustand store for client auth state
  types.ts                  # AuthState, AuthUser types
```

### 1.3 Component Responsibilities

**Astro Pages (`.astro`):**
- Render the `AuthLayout` wrapper
- Handle SSR redirect logic (e.g., redirect to `/` if already authenticated)
- Pass initial props to React islands

**React Components (`client:load`):**
- Form state management and validation
- API calls to auth endpoints
- Loading/error states
- Client-side navigation after success

### 1.4 Validation Rules and Error Messages

| Field | Validation | Error Message |
|-------|------------|---------------|
| Email | Valid email format | "Please enter a valid email address" |
| Password | Min 8 chars | "Password must be at least 8 characters" |
| Password | 1 special char | "Password must contain at least 1 special character" |
| Confirm Password | Match password | "Passwords do not match" |
| Generic Auth | Supabase error | "Invalid email or password" |
| OAuth Error | Provider error | "Authentication failed. Please try again." |
| Session Expired | Token invalid | "Your session has expired. Please log in again." |

### 1.5 Key User Scenarios

**Signup Flow:**
1. User enters email, password, confirm password
2. Client validates inputs (inline errors)
3. Submit calls `POST /api/auth/signup`
4. On success: auto-login, redirect to `/`
5. On error: display error message

**Login Flow:**
1. User enters email/password or clicks Google OAuth
2. For email/password: `POST /api/auth/login`
3. For OAuth: redirect to Supabase OAuth URL
4. On success: redirect to `?redirect` param or `/`
5. On session expired: redirect to `/login?expired=true`

**Password Reset Flow:**
1. User enters email on `/reset-password`
2. Submit calls `POST /api/auth/reset-password`
3. Always show generic success (security)
4. User clicks email link -> `/update-password?token=...`
5. User enters new password
6. Submit calls `POST /api/auth/update-password`
7. On success: redirect to `/login?reset=true`

## 2. Backend Logic

### 2.1 API Endpoints Structure

**Location:** `src/pages/api/auth/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/signup` | POST | Create new user account |
| `/api/auth/login` | POST | Email/password authentication |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/reset-password` | POST | Send password reset email |
| `/api/auth/update-password` | POST | Set new password with token |
| `/api/auth/callback` | GET | Handle OAuth/magic link redirects |
| `/api/auth/resend-verification` | POST | Resend verification email |

### 2.2 Domain Layer

**Location:** `src/domain/auth/`

```
auth/
  models/
    User.ts                 # User domain model (id, email, name, emailVerified)
    Session.ts              # Session domain model
    types.ts                # AuthResult, PasswordRequirements
  errors/
    AuthenticationError.ts  # Invalid credentials, expired session
    RegistrationError.ts    # Email already exists, weak password
    PasswordResetError.ts   # Invalid/expired token
    index.ts
  index.ts
```

### 2.3 Infrastructure Layer

**Location:** `src/infrastructure/auth/`

```
auth/
  api/
    schemas.ts              # Zod schemas (SignupSchema, LoginSchema, etc.)
    types.ts                # DTO types (SignupCommandDTO, LoginCommandDTO)
    mappers.ts              # toDomain mappers
    index.ts
  SupabaseAuthClient.ts     # Effect service wrapping Supabase Auth
  index.ts
```

**Zod Schemas (`schemas.ts`):**

```typescript
// Email validation
const EmailSchema = z.string().email("Please enter a valid email address");

// Password validation
const PasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least 1 special character");

// Signup command
export const SignupCommandSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

// Login command
export const LoginCommandSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password is required")
});
```

### 2.4 Application Layer

**Location:** `src/application/auth/`

```
auth/
  SignupUser.ts             # Signup use case
  LoginUser.ts              # Login use case
  LogoutUser.ts             # Logout use case
  ResetPassword.ts          # Request password reset
  UpdatePassword.ts         # Set new password
  index.ts
```

**Note:** No `GetSession` use case needed - session validation is handled by middleware and user data is passed via Astro props.

### 2.5 Error Handling

**Auth-specific errors extend existing pattern:**

```typescript
// src/domain/auth/errors/AuthenticationError.ts
export class AuthenticationError {
  readonly _tag = "AuthenticationError";
  constructor(
    readonly code: "invalid_credentials" | "session_expired" | "oauth_failed",
    readonly message: string
  ) {}
}
```

**Update `response-mappers.ts`** to handle auth errors:
- `AuthenticationError` -> 401 Unauthorized
- `RegistrationError` -> 400 Bad Request (or 409 Conflict for duplicate email)
- `PasswordResetError` -> 400 Bad Request

### 2.6 Replace DEV_USER_ID

All API endpoints currently using `DEV_USER_ID` from `src/utils/consts.ts` must be updated to use `context.locals.user.id`. Affected endpoints:

- `src/pages/api/conversations/*.ts`
- `src/pages/api/trips/*.ts`
- `src/pages/api/personas/*.ts`
- `src/pages/api/plan.ts`

## 3. Authentication System

### 3.1 Supabase Auth Client

**Extend existing SupabaseClient** in `src/infrastructure/common/database/`:

```typescript
// src/infrastructure/auth/SupabaseAuthClient.ts
export interface ISupabaseAuthClient {
  signUp(email: string, password: string): Effect<User, RegistrationError>;
  signInWithPassword(email: string, password: string): Effect<Session, AuthenticationError>;
  signInWithOAuth(provider: "google"): Effect<string, AuthenticationError>; // Returns redirect URL
  signOut(): Effect<void, never>;
  resetPasswordForEmail(email: string): Effect<void, never>;
  updatePassword(newPassword: string): Effect<void, PasswordResetError>;
  getSession(): Effect<Session | null, never>;
  setSession(accessToken: string, refreshToken: string): Effect<Session, AuthenticationError>;
}

export class SupabaseAuthClient extends Context.Tag("SupabaseAuthClient")<
  SupabaseAuthClient,
  ISupabaseAuthClient
>() {}
```

### 3.2 Supabase Server Instance Helper

**Create `src/infrastructure/auth/supabase-server.ts`:**

```typescript
import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "@/infrastructure/common/database/types";

// Security: Proper cookie options (httpOnly, secure, sameSite)
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  // IMPORTANT: Use ONLY getAll and setAll for cookie management
  // DO NOT use individual get/set/remove methods
  const supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return parseCookieHeader(context.headers.get("Cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return supabase;
};
```

### 3.3 Middleware Updates

**Update `src/middleware/index.ts`:**

```typescript
import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "@/infrastructure/auth/supabase-server";

// Public paths - Auth pages and API endpoints
const PUBLIC_PATHS = [
  // Public pages
  "/",
  "/login",
  "/signup",
  "/reset-password",
  "/update-password",
  "/auth/callback",
  "/verify-email",
  // Auth API endpoints
  "/api/auth/signup",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/reset-password",
  "/api/auth/update-password",
  "/api/auth/callback",
  "/api/auth/resend-verification",
];

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    locals.supabase = supabase;

    // IMPORTANT: Always call auth.getUser() - DO NOT skip this call
    // DO NOT use getSession() - use getUser() for security
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      locals.user = {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name,
        emailVerified: user.email_confirmed_at !== null,
      };
    }

    // Check if path is public
    const isPublicPath = PUBLIC_PATHS.includes(url.pathname) || 
                         url.pathname.startsWith("/api/auth/");

    // Redirect unauthenticated users from protected routes
    if (!user && !isPublicPath) {
      return redirect(`/login?redirect=${encodeURIComponent(url.pathname)}`);
    }

    // Redirect authenticated users away from auth pages
    if (user && ["/login", "/signup"].includes(url.pathname)) {
      return redirect("/");
    }

    return next();
  }
);
```

### 3.3 Update Astro Locals Types

**Update `src/env.d.ts`:**

```typescript
declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: {
        id: string;
        email: string;
        name?: string;
        avatar?: string;
        emailVerified: boolean;
      };
    }
  }
}
```

### 3.4 Client-Side Auth Store

**Create `src/components/auth/stores/authStore.ts`:**

The auth store is initialized with user data passed as props from Astro pages (not fetched via API).

```typescript
interface AuthUser {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  emailVerificationDismissed: boolean;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  dismissEmailVerification: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      emailVerificationDismissed: false,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user
      }),
      
      logout: async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        set({ user: null, isAuthenticated: false });
        window.location.href = "/";
      },
      
      dismissEmailVerification: () => set({ emailVerificationDismissed: true })
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ emailVerificationDismissed: state.emailVerificationDismissed })
    }
  )
);
```

### 3.5 Passing User Data from Astro to React

**Data Flow:**
1. Middleware validates session via Supabase client and sets `context.locals.user`
2. Astro pages access `Astro.locals.user` (already validated, no loading state needed)
3. Astro pages pass user as props to React components
4. React components initialize auth store with received props

**Example Astro Page (`src/pages/plan.astro`):**

```astro
---
export const prerender = false;

// User is already validated by middleware - if we reach here, user exists
const user = Astro.locals.user!;
---

<Layout title="Trip Planner">
  <PlanPage client:load user={user} />
</Layout>
```

**Example React Component Initialization:**

```typescript
interface PlanPageProps {
  user: AuthUser;
}

export function PlanPage({ user }: PlanPageProps) {
  const setUser = useAuthStore((state) => state.setUser);
  
  // Initialize store with user from props (runs once on mount)
  useEffect(() => {
    setUser(user);
  }, [user, setUser]);
  
  // Component renders immediately - no loading state needed
  // because middleware already validated the session
  return (
    // ... component content
  );
}
```

**Key Benefits:**
- No API call needed to fetch session (already validated in middleware)
- No loading state for auth - user data is available immediately via SSR props
- Single source of truth: middleware handles all session validation
- React store syncs with server-provided user data on hydration

### 3.6 OAuth Callback Handling

**Create `src/pages/auth/callback.astro`:**

```astro
---
export const prerender = false;

const { supabase } = Astro.locals;
const code = Astro.url.searchParams.get("code");
const redirectTo = Astro.url.searchParams.get("redirect") ?? "/";

if (code) {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return Astro.redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
}

return Astro.redirect(redirectTo);
---
```

### 3.7 Navigation Updates

**Desktop Navigation** - Add `UserMenuDropdown` to existing navigation bar (right side):
- Show user avatar/initials
- Dropdown: Logout button

**Mobile Navigation** - Integrate `UserMenuDrawer` with existing `src/components/common/MobileNavigation.tsx`:
- User icon in navigation triggers Vaul drawer
- Menu: Logout option

### 3.8 SSR Configuration

**IMPORTANT:** All auth pages MUST be server-rendered to properly handle cookies and session management.

The project already has `output: "server"` in `astro.config.mjs`, but each auth page should explicitly include:

```astro
---
export const prerender = false;
---
```

**Pages requiring `prerender = false`:**
- `src/pages/login.astro`
- `src/pages/signup.astro`
- `src/pages/reset-password.astro`
- `src/pages/update-password.astro`
- `src/pages/auth/callback.astro`
- `src/pages/verify-email.astro`

### 3.9 Protected Pages Updates

Update `src/pages/plan.astro` and `src/pages/map.astro`:
- Pass `user` from `Astro.locals` as props to React components
- No loading state needed for auth - middleware handles protection
- React components receive user data immediately via SSR props

**Note:** Skeleton loaders (ChatSkeleton, MapSkeleton) are only needed for data fetching (trips, conversations, etc.), NOT for authentication state.

## 4. Files to Create

| File | Description |
|------|-------------|
| `src/infrastructure/auth/supabase-server.ts` | Supabase server instance helper with proper cookie handling |
| `src/pages/login.astro` | Login page (prerender = false) |
| `src/pages/signup.astro` | Signup page (prerender = false) |
| `src/pages/reset-password.astro` | Password reset request (prerender = false) |
| `src/pages/update-password.astro` | New password form (prerender = false) |
| `src/pages/auth/callback.astro` | OAuth callback handler (prerender = false) |
| `src/pages/verify-email.astro` | Email verification handler (prerender = false) |
| `src/pages/api/auth/*.ts` | Auth API endpoints (7 files) |
| `src/domain/auth/**/*.ts` | Auth domain layer (6 files) |
| `src/infrastructure/auth/**/*.ts` | Auth infrastructure (5 files) |
| `src/application/auth/**/*.ts` | Auth use cases (5 files) |
| `src/components/auth/**/*.tsx` | Auth React components (10+ files) |

## 5. Files to Modify

| File | Changes |
|------|---------|
| `src/middleware/index.ts` | Add session check, route protection, user to locals |
| `src/env.d.ts` | Add `user` to `App.Locals` |
| `src/infrastructure/common/runtime.ts` | Add SupabaseAuthClient to AppLayer |
| `src/infrastructure/common/http/response-mappers.ts` | Handle auth errors |
| `src/pages/api/**/*.ts` | Replace DEV_USER_ID with context.locals.user.id |
| `src/pages/plan.astro` | Pass user from Astro.locals as props to PlanPage |
| `src/pages/map.astro` | Pass user from Astro.locals as props to MapPage |
| `src/components/plan/PlanPage.tsx` | Accept user prop, initialize auth store |
| `src/components/map/MapPlanner.tsx` | Accept user prop, initialize auth store |
| `src/components/common/MobileNavigation.tsx` | Integrate UserMenuDrawer |
| `src/layouts/Layout.astro` | Add desktop navigation header with user menu |

## 6. Security Best Practices

- Set proper cookie options (httpOnly, secure, sameSite) - see `cookieOptions` in supabase-server.ts
- Never expose Supabase URL or keys in client-side components
- Validate all user input server-side using Zod schemas
- Use proper error handling and logging
- Always use `@supabase/ssr` package (NOT `@supabase/auth-helpers-*`)

## 7. Common Pitfalls to Avoid

1. **DO NOT** use individual cookie methods (`get`/`set`/`remove`) - use only `getAll`/`setAll`
2. **DO NOT** import from `@supabase/auth-helpers-nextjs` or similar auth-helpers packages
3. **DO NOT** skip the `auth.getUser()` call in middleware - this validates the JWT token
4. **DO NOT** use `auth.getSession()` - always use `auth.getUser()` for security
5. **DO NOT** modify the cookie handling logic in `createSupabaseServerInstance`
6. **ALWAYS** handle auth state changes properly
7. **ALWAYS** ensure auth pages have `export const prerender = false`

## 8. Implementation Order

1. Domain layer (models, errors)
2. Infrastructure layer (supabase-server.ts, SupabaseAuthClient, schemas)
3. Middleware updates (session, route protection)
4. Auth API endpoints
5. Auth pages (login, signup, reset-password, etc.)
6. Auth React components
7. Navigation updates (user menu)
8. Update existing API endpoints to use real user ID

