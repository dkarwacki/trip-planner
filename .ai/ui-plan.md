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
- **Purpose**: Secure user authentication.
- **Key Information**: Login form (Email/Password, Social Providers), Sign Up toggle.
- **Key Components**: AuthForm (**Supabase Auth UI** or custom), Branding Header.
- **UX/Auth**: Public access. Clean, distraction-free layout.

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
  - `UserProfile`: Avatar, Name, Email.
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
    3.  **Profile** (`/profile`): Icon: User.
  - **Behavior**: Active tab highlighted. Tapping active tab scrolls to top/resets view.

### Desktop Layout

- **Top Navigation Bar**:
  - **Left**: Logo.
  - **Right**: Nav Links (Plan, Map, Trips), **Profile Button** (Avatar/Icon).
- **Content Area**:
  - **Plan**: Split view (Chat left, Itinerary right).
  - **Map**: Full screen map with floating panels.

### Navigation Logic

- **Routing**: Standard browser routing (`/plan`, `/map`).
- **State Persistence**:
  - When switching from Map -> Chat -> Map, the map viewport and selected place are restored from Zustand store.
  - Itinerary data is synced via React Query cache.

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
