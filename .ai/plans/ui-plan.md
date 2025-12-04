# UI Architecture for TripPlanner

## 1. UI Structure Overview

TripPlanner adopts a modern, app-like architecture using **Astro** for the application shell and **React** for rich interactive islands. The design philosophy emphasizes a clean, premium aesthetic with smooth transitions, following the established style of the existing `/map` and `/plan` views.

The application is divided into two distinct zones:

1.  **Public Zone**: Marketing-focused landing and authentication pages.
2.  **Protected App Zone**: The core application experience, secured by authentication, featuring a persistent navigation shell.

**Core Technologies:**

- **Framework**: Astro 5 (Routing, SSR, SSG) + React 19 (Interactive UI).
- **Styling**: Tailwind CSS 4 + Shadcn/ui (consistent with existing app style).
- **State Management**:
  - **Server State**: React Query (via TRPC or direct fetch) for API data (Single Source of Truth).
  - **Client State**: Zustand for transient UI state (Map viewport, active tab, sidebar visibility).
- **Navigation**: View Transitions API for seamless page loads.

## 2. View List

### 2.1 Welcome View (Landing)

- **Path**: `/`
- **Purpose**: Convert visitors into users by showcasing value proposition.
- **Key Information**: Hero section with value prop, feature highlights, social proof/testimonials.
- **Key Components**: Hero with animated map background, Feature Grid, **Single Primary CTA Button**.
- **UX/Auth**: Public access. Redirects to `/plan` if already logged in.

### 2.2 Login View

- **Path**: `/login`
- **Purpose**: User authentication with email/password or Google OAuth.
- **Key Information**: Email/password fields, Google OAuth button, "Forgot password?" and "Sign up" links, `?redirect=` query parameter handling.
- **Key Components**: `AuthLayout`, `AuthFormInput`, `GoogleOAuthButton`.
- **UX/Auth**: Public access. Redirects to `?redirect` param or `/` after successful login.

### 2.2.5 Signup View

- **Path**: `/signup`
- **Purpose**: User registration with email/password or Google OAuth.
- **Key Information**: Email, password, password confirmation fields, password requirements (8 chars + special char), Google OAuth button, link to `/login`.
- **Key Components**: `AuthLayout`, `AuthFormInput`, `PasswordStrengthIndicator`, `GoogleOAuthButton`.
- **UX/Auth**: Public access. Auto-login and redirect to `/` after successful signup.

### 2.2.6 Password Reset Request View

- **Path**: `/reset-password`
- **Purpose**: Request password reset email.
- **Key Information**: Email field, generic success message (security best practice), link back to `/login`.
- **Key Components**: `AuthLayout`, `AuthFormInput`, `SuccessMessage`.
- **UX/Auth**: Public access. Always shows success message regardless of email existence.

### 2.2.7 Password Reset Confirmation View

- **Path**: `/update-password`
- **Purpose**: Complete password reset with new password.
- **Key Information**: New password and confirmation fields, password strength indicator, token validation (1 hour expiry).
- **Key Components**: `AuthLayout`, `AuthFormInput`, `PasswordStrengthIndicator`, `SuccessMessage`.
- **UX/Auth**: Public access (via email link). Redirects to `/login` after successful reset.

### 2.2.8 OAuth Callback View

- **Path**: `/auth/callback`
- **Purpose**: Handle OAuth provider callbacks (Google).
- **Key Information**: Full-page loading spinner, automatic redirect processing.
- **Key Components**: `LoadingSpinner`, `ErrorMessage`.
- **UX/Auth**: Public access. Automatically redirects to `?redirect` param or `/` after processing.

### 2.2.9 Email Verification Callback (Optional)

- **Path**: `/verify-email`
- **Purpose**: Handle email verification link clicks.
- **Key Information**: Token validation (24 hour expiry), success/error messages.
- **Key Components**: `LoadingSpinner`, `SuccessMessage`, `ErrorMessage`.
- **UX/Auth**: Public access (via email link). Auto-redirect to `/` after verification.

### 2.3 Plan View (Chat) - **COMPLETED**

- **Path**: `/plan`
- **Purpose**: AI-assisted destination discovery and itinerary building.
- **Status**: Existing implementation will be preserved.
- **Layout**: Uses `PlanLayout` (Mobile/Desktop split).

### 2.4 Map View - **COMPLETED**

- **Path**: `/map`
- **Purpose**: Visual exploration of selected places and discovery of nearby attractions/restaurants.
- **Status**: Existing implementation will be preserved.
- **Layout**: Uses `MapLayout`.

### 2.5 Profile View

- **Path**: `/profile`
- **Purpose**: User account management.
- **Key Information**: User details (Name, Email), Password Reset, Default Personas.
- **Key Components**:
  - `UserProfile`: User icon, Name, Email.
  - `SecuritySettings`: Password reset form.
  - `PersonaSettings`: Default persona configuration.
- **UX/Auth**: Protected. Full-screen view on mobile.
- **Note**: Trip history is accessed via the "Trips" button in the global navigation, not this view.

## 3. User Journey Map

### Main Flow: New Trip Planning

1.  **Landing**: User arrives at `/`, clicks the primary "Get Started" button.
2.  **Auth**: User logs in at `/login` -> Redirected to `/plan`.
3.  **Setup**: User selects "Foodie" and "History Buff" personas in `/plan`.
4.  **Discovery**:
    - User types: "I want a weekend trip to Tuscany."
    - AI responds with 3 towns (Siena, San Gimignano, Lucca).
    - User clicks "Add to Itinerary" on Siena and Lucca.
    - _System_: Optimistically adds to itinerary list, validates via API in background.
5.  **Transition**: User clicks "Map" tab (Mobile) or "Show on Map" button.
6.  **Exploration**:
    - View switches to `/map`. Map centers on Siena.
    - User clicks Siena marker -> Opens details.
    - User selects "Attractions" tab -> Sees "Piazza del Campo" (Score: 9.8).
    - User clicks "Add" -> Attraction added to trip.
7.  **Review**: User clicks "Trips" in navigation to see the saved trip.

## 4. Layout and Navigation Structure

### Mobile Layout

- **Top Bar**: Context-dependent (e.g., "Plan Trip", "Map Search").
- **Content Area**: Full height, scrollable.
- **Bottom Navigation**: Fixed bar (standard style, no glassmorphism).
  - **Tabs**:
    1.  **Chat** (`/plan`): Icon: MessageSquare.
    2.  **Map** (`/map`): Icon: Map.
    3.  **Profile**: Icon: User.
  - **Behavior**: Active tab highlighted. Tapping active tab scrolls to top/resets view.
- **User Menu (Mobile - Vaul Drawer)**:
  - **Trigger**: Tap "Profile" tab in bottom navigation
  - **Drawer Menu** (Vaul component):
    - Animated drawer slides up from bottom
    - Max-height: 40vh, rounded top corners
    - Header: User icon (24px) + name + email
    - Menu items (large tap targets, 48px min height):
      1. "View Profile" → Navigate to `/profile` page
      2. "Logout" (red text with LogOut icon) → Logout and redirect to `/`
    - Tap outside or swipe down to close
    - Backdrop dims rest of screen when open
  - **Behavior**:
    - Shows loading skeleton while user data loads
    - Drawer closes after clicking menu item

### Desktop Layout

- **Top Navigation Bar**:
  - **Left**: Logo.
  - **Right**: Nav Links (Plan, Map, Trips), **User Menu** (User icon + Dropdown).
- **User Menu (Desktop)**:
  - **Trigger**: Click user icon (20px, from lucide-react)
  - **Dropdown Menu** (shadcn/ui DropdownMenu component):
    - Right-aligned dropdown
    - Header: User name + email
    - Menu items:
      1. "Profile" → Navigate to `/profile`
      2. "Logout" (red text with LogOut icon) → Logout and redirect to `/`
    - Click outside to close
  - **Behavior**:
    - Clicking user icon opens/closes dropdown
    - Logout clears Supabase session + Zustand auth state
    - Shows loading skeleton while user data loads
- **Content Area**:
  - **Plan**: Split view (Chat left, Itinerary right).
  - **Map**: Full screen map with floating panels.

### Navigation Logic

- **Routing**: Standard browser routing (`/plan`, `/map`).
- **State Persistence**:
  - When switching from Map -> Chat -> Map, the map viewport and selected place are restored from Zustand store.
  - Itinerary data is synced via React Query cache.

### Protected Route Middleware

- **Implementation**: Astro middleware in `src/middleware/index.ts`
  - Checks Supabase session on all requests
  - **Protected routes** (require auth): `/plan`, `/map`, `/profile`
  - **Public routes** (no auth): `/`, `/login`, `/signup`, `/reset-password`, `/update-password`, `/auth/callback`, `/verify-email`
- **Loading Strategy**: Page-specific skeleton loaders
  - `/plan` → Chat skeleton (message bubbles, itinerary skeleton)
  - `/map` → Map skeleton (gray map placeholder + panel skeletons)
  - `/profile` → Profile skeleton (avatar placeholder, form fields)
  - Prevents flash of unauthorized content
  - Auth check completes in <300ms (barely noticeable)
- **Behavior**:
  - Unauthenticated on protected route → `redirect('/login?redirect={current-path}')`
  - Authenticated on auth pages (login/signup) → `redirect('/')` (avoid showing login to logged-in users)
  - Session attached to `context.locals.user` for page access
  - Middleware runs before page render (server-side)
- **Error Handling**:
  - Session validation fails → Clear cookies, redirect to login
  - API errors during check → Assume unauthenticated, redirect to login

## 5. Key Components

### 5.1 Global Components

- `AppShell`: Handles layout, navigation, and auth protection.
- `LoadingSpinner`: Standardized loading indicator.

### 5.2 Plan Components

- **Existing**: `ChatMessage`, `SuggestionCard`, `PersonaBadge` (Reuse existing).

### 5.3 Map Components

- **Existing**: `MapMarker`, `PlaceDetailSheet`, `ScoreBadge` (Reuse existing).

### 5.4 Profile Components

- `PersonaToggle`: Switch/Checkbox for default settings.
- `AuthForm`: Reused for Login/Profile settings where applicable.

### 5.5 Authentication Components

**Shared Layout Components**:

- `AuthLayout`: Centered card wrapper (440px max-width, 32px padding) for all auth pages
  - Reused across: Login, Signup, Password Reset pages
  - Consistent branding header with logo

**Form Components**:

- `AuthFormInput`: Reusable form input with inline error display
  - Props: type, label, error message, value, onChange
  - Shows red error text below field
  - Used for: email, password, password confirmation
- `PasswordStrengthIndicator`: Visual feedback for password requirements
  - Shows: 8 chars minimum + 1 special character requirement
  - Color codes: Red (weak), Yellow (medium), Green (strong)
  - Used in: Signup, Password Reset Confirmation
- `FormErrorMessage`: Inline error message component (red text)
- `GoogleOAuthButton`: Reusable OAuth button
  - Text variants: "Sign in with Google" / "Sign up with Google"
  - Loading state: Spinner + "Redirecting to Google..."
  - Consistent Google branding

**UI Components**:

- `UserMenuDropdown`: Desktop dropdown menu (shadcn/ui DropdownMenu)
  - Trigger: User icon (20px, lucide-react User icon)
  - Header: Name + email
  - Menu items: Profile link, Logout button (red)
- `UserMenuDrawer`: Mobile drawer menu (Vaul)
  - Slides up from bottom, max-height 40vh
  - Header: User icon (24px) + name + email
  - Menu items: View Profile, Logout (red)
- `EmailVerificationBanner`: Dismissible banner for unverified emails
  - Per-session dismiss (Zustand sessionStorage)
  - Shows: "Please verify your email" + "Resend" button
  - Only shown if: email unverified AND not dismissed this session
- `SessionExpiredToast`: Toast notification for expired sessions
  - Message: "Your session has expired. Redirecting to login..."
  - Auto-dismiss after 3 seconds
  - Appears: Top-right corner

**Skeleton Loaders**:

- `ChatSkeleton`: For `/plan` protected route loading
  - Message bubbles + itinerary list skeleton
- `MapSkeleton`: For `/map` protected route loading
  - Gray map placeholder + panel skeletons
- `ProfileSkeleton`: For `/profile` protected route loading
  - Form field skeletons

**Related User Stories**: US-025 through US-035
