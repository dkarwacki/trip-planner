# View Implementation Plan Welcome View

## 1. Overview

The Welcome View serves as the landing page for the application, accessible at the root path (`/`). Its primary goal is to convert visitors into users by showcasing the application's value proposition and explaining the two-stage workflow (Plan & Map).

Key features include:

- **Premium Aesthetic**: Uses a hero section with an animated map background.
- **Clear Call-to-Actions (CTAs)**: Directs users to start planning or exploring the map, enforcing login if necessary.
- **Educational Content**: Explains the "Plan" and "Map" features.

## 2. View Routing

- **Path**: `/`
- **File**: `src/pages/index.astro`
- **Access Control**: Public.
  - Assume user is **Unauthenticated** for now
  - Render the Welcome View.

## 3. Component Structure

```text
src/pages/index.astro (Layout & Entry Point)
└── src/components/welcome/WelcomeView.tsx (Main Container)
    ├── HeroSection.tsx (Title, Subtitle, CTAs, Animated Background)
    ├── FeatureGrid.tsx (Explains 2-stage workflow)
    └── Footer.tsx (Simple footer)
```

## 4. Component Details

### `src/pages/index.astro`

- **Description**: The entry point for the root route.
- **Logic**:
  - Render the `WelcomeView` component wrapped in the main `Layout`.

### `WelcomeView.tsx`

- **Description**: The main container component for the landing page content.
- **Main Elements**:
  - `<main>` container with vertical spacing.
  - Renders `HeroSection`, `FeatureGrid`, and `Footer` in order.
- **Props**: None.

### `HeroSection.tsx`

- **Description**: The visual centerpiece of the page.
- **Main Elements**:
  - **Background**: An animated map pattern (CSS/SVG animation) or a high-quality video/image to evoke travel.
  - **Headline**: "Plan your perfect trip with AI" (or similar from PRD).
  - **Subheadline**: Value proposition text.
  - **Primary CTA**: "Start Planning" button.
    - **Action**: Links to `/login?redirect=/plan`.
    - **Style**: Prominent, high-contrast (Shadcn `Button` size="lg").
  - **Secondary CTA**: "Explore Map" button.
    - **Action**: Links to `/login?redirect=/map`.
    - **Style**: Outline or secondary style (Shadcn `Button` variant="outline" size="lg").
- **Handled Interactions**:
  - Button clicks (standard navigation).

### `FeatureGrid.tsx`

- **Description**: Explains the core functionality.
- **Main Elements**:
  - Grid layout (1 col mobile, 2/3 col desktop).
  - **Cards**:
    1.  **AI Planning**: "Chat with AI to find the perfect starting point."
    2.  **Interactive Map**: "Explore attractions and restaurants near your hub."
    3.  **Personalization**: "Recommendations based on your traveler persona."
- **Props**: None.

## 5. Types

No specific DTOs are required for this view as it is primarily static content.
However, for the `Feature` component (internal to `FeatureGrid`), we might define:

```typescript
interface FeatureItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}
```

## 6. State Management

- **Local State**:
  - The view is largely stateless.
  - `HeroSection` might use simple state or `framer-motion` for entrance animations.
- **Global State**:
  - None required.

## 7. API Integration

- **Auth Check**:
  - **Location**: `src/pages/index.astro` (Frontmatter).
  - **Action**: None for now. Assume user is not logged in.

## 8. User Interactions

| Interaction                | Condition | Outcome                              |
| :------------------------- | :-------- | :----------------------------------- |
| **Load Page (`/`)**        | Always    | Show Welcome View.                   |
| **Click "Start Planning"** | Always    | Navigate to `/login?redirect=/plan`. |
| **Click "Explore Map"**    | Always    | Navigate to `/login?redirect=/map`.  |

## 9. Conditions and Validation

- **Authentication**: Ignored for this iteration.
  - **Assumption**: `/login?redirect=...` handles the redirection logic correctly after login.

## 10. Error Handling

- **Navigation Errors**: Standard browser navigation handling.

## 11. Implementation Steps

1.  **Setup Directory**: Create `src/components/welcome`.
2.  **Create Components**:
    - Implement `HeroSection.tsx` with placeholder map background and Shadcn buttons.
    - Implement `FeatureGrid.tsx` with icons (Lucide-react) and descriptive text.
    - Implement `WelcomeView.tsx` to assemble the sections.
3.  **Update Page**:
    - Modify `src/pages/index.astro`.
    - Replace existing HTML with `<WelcomeView client:load />`.
    - Add TODO comment for future auth check.
4.  **Styling**:
    - Apply Tailwind classes to match the "Premium Aesthetic" (gradients, generous spacing, modern typography).
    - Add animation to the Hero background.
5.  **Verification**:
    - Verify page loads at `/`.
    - Verify "Start Planning" links to `/login?redirect=/plan`.
    - Verify "Explore Map" links to `/login?redirect=/map`.
