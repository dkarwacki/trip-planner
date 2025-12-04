# Google OAuth Authentication Flow

This sequence diagram illustrates the complete Google OAuth authentication flow in the trip-planner application, from user initiation to authenticated session.

## Overview

The flow uses Supabase Auth with server-side rendering (SSR) via Astro. Key components:
- **GoogleOAuthButton** - React component initiating OAuth
- **Supabase SDK** - Client-side auth SDK (dynamically imported)
- **Google OAuth** - External identity provider
- **Callback API** - `/api/auth/callback` endpoint handling code exchange
- **Supabase Server** - Server-side client with httpOnly cookie management

## Sequence Diagram

<mermaid_diagram>

```mermaid
%%{init: {
  'theme': 'dark',
  'themeVariables': {
    'actorBkg': '#1e88e5',
    'actorBorder': '#42a5f5',
    'actorTextColor': '#ffffff',
    'actorLineColor': '#90caf9',
    'signalColor': '#90caf9',
    'signalTextColor': '#ffffff',
    'labelBoxBkgColor': '#263238',
    'labelBoxBorderColor': '#546e7a',
    'labelTextColor': '#ffffff',
    'loopTextColor': '#ffffff',
    'noteBkgColor': '#37474f',
    'noteTextColor': '#ffffff',
    'noteBorderColor': '#546e7a',
    'activationBkgColor': '#424242',
    'activationBorderColor': '#757575',
    'sequenceNumberColor': '#ffd54f'
  }
}}%%

sequenceDiagram
    autonumber
    
    actor User
    participant Browser
    participant OAuthBtn as GoogleOAuthButton
    participant SDK as Supabase SDK
    participant Google as Google OAuth
    participant Callback as /api/auth/callback
    participant Server as Supabase Server
    participant Auth as Supabase Auth

    Note over User, Auth: OAuth Initiation Phase

    User->>+OAuthBtn: Click "Continue with Google"
    OAuthBtn->>OAuthBtn: setIsLoading(true)
    
    OAuthBtn->>+SDK: Dynamic import @supabase/supabase-js
    SDK-->>-OAuthBtn: createClient(url, key)
    
    OAuthBtn->>+SDK: signInWithOAuth({provider: "google"})
    Note right of SDK: redirectTo: /api/auth/callback?redirect=/
    SDK->>SDK: Generate OAuth URL
    SDK-->>-OAuthBtn: OAuth URL
    
    OAuthBtn->>Browser: window.location redirect
    deactivate OAuthBtn

    Note over User, Auth: Google Authentication Phase

    Browser->>+Google: Navigate to OAuth consent page
    Google-->>User: Display consent screen
    
    alt User Authorizes
        User->>Google: Grant access
        Google-->>-Browser: Redirect: /api/auth/callback?code=XXX
    else User Denies
        User->>Google: Deny access
        Google-->>Browser: Redirect: /api/auth/callback?error=access_denied
        Browser->>Callback: GET with error param
        Callback-->>Browser: Redirect to /login?error=...
        Browser-->>User: Show login page with error
    end

    Note over User, Auth: Code Exchange Phase (Happy Path)

    Browser->>+Callback: GET /api/auth/callback?code=XXX&redirect=/
    
    Note over Callback, Server: Middleware creates Supabase server client
    Callback->>+Server: createSupabaseServerInstance(context)
    Server-->>-Callback: supabase client
    
    Callback->>Callback: Extract code, redirect params
    
    Callback->>+Server: exchangeCodeForSession(code)
    Server->>+Auth: Validate authorization code
    Auth->>Auth: Verify code, create session
    Auth-->>-Server: Session tokens (access, refresh)
    
    Note right of Server: setAll() callback sets httpOnly cookies
    Server->>Server: Set session cookies via setAll()
    Server-->>-Callback: Session created
    
    Callback-->>-Browser: HTTP 302 Redirect to destination

    Note over User, Auth: Session Validation Phase

    Browser->>+Callback: GET / (final destination)
    Note over Callback: Middleware intercepts request
    Callback->>+Server: auth.getUser()
    Server->>+Auth: Validate JWT
    Auth-->>-Server: User data
    Server-->>-Callback: User authenticated
    Callback->>Callback: Set locals.user
    Callback-->>-Browser: Render protected page
    Browser-->>User: Display authenticated content
```

</mermaid_diagram>

## Key Implementation Details

### OAuth Initiation (`GoogleOAuthButton.tsx`)

```typescript
const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(supabaseUrl, supabaseKey);

await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/api/auth/callback?redirect=${redirectTo}`,
  },
});
```

### Callback Handler (`/api/auth/callback.ts`)

```typescript
const code = url.searchParams.get("code");
const redirectTo = url.searchParams.get("redirect") ?? "/";

if (code) {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
}

return redirect(redirectTo);
```

### Cookie Security (`supabase-server.ts`)

```typescript
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: import.meta.env.PROD,  // HTTPS only in production
  httpOnly: true,                // Prevents XSS
  sameSite: "lax",              // CSRF protection
};
```

## Security Considerations

1. **httpOnly Cookies**: Session tokens are not accessible via JavaScript (XSS protection)
2. **Server-Side Validation**: `auth.getUser()` validates JWT with Supabase server (not just decoding)
3. **PKCE Flow**: Supabase uses PKCE (Proof Key for Code Exchange) for OAuth security
4. **SameSite Cookies**: `lax` setting provides CSRF protection while allowing OAuth redirects

## Error Scenarios

| Error | Trigger | User Experience |
|-------|---------|-----------------|
| User denies access | User clicks "Deny" on Google consent | Redirected to /login with error message |
| Code exchange fails | Invalid/expired code | Redirected to /login with error message |
| Network error | Connection issues | Loading state remains, console error logged |

## Related Files

- `src/components/auth/GoogleOAuthButton.tsx` - OAuth initiation component
- `src/pages/api/auth/callback.ts` - Code exchange endpoint
- `src/infrastructure/auth/supabase-server.ts` - Server client factory
- `src/middleware/index.ts` - Session validation middleware

