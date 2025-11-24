You are a qualified frontend architect whose task is to create a comprehensive user interface architecture based on the Product Requirements Document (PRD), API plan, and planning session notes. Your goal is to design a user interface structure that effectively meets product requirements, is compatible with API capabilities, and incorporates insights from the planning session.

First, carefully review the following documents:

Product Requirements Document (PRD):
<prd>
@/.ai/prd.md
</prd>

API Plan:
<api_plan>
@/.ai/api-plan.md
</api_plan>

<alredy_implemented_features>
@/docs/map-features.md
@/docs/plan-features.md
</alredy_implemented_features>

Session Notes:
<session_notes>
Global Navigation: Implement a consistent global bottom navigation bar on mobile with "Chat", "Map", and "Profile" tabs.
Routing Structure:
Root (/) is a dedicated Welcome/Landing page.
Dedicated /login page for authentication.
Protected routes: /plan, /map, /profile.
State Persistence: Use a global store (Zustand) to persist exact map state (zoom, center) when switching tabs.
Data Source: The API/Database is the single source of truth.
Optimistic UI: Implement optimistic updates for adding items to the itinerary (immediate UI update with "pending" state).
Loading States: Use standard loading indicators (spinners) instead of skeleton screens.
Notifications: Use Shadcn card-style popups for toasts/notifications to maintain consistency.
Navigation Flow: Reuse the existing "Chat" icon on the map for returning to the plan view (no new "Back to Plan" button).
Mobile Layout: "Profile/History" will be a full-screen view on mobile, not a drawer.
Guest Access: Guests only see the Welcome view; accessing app features requires login.
User Preferences: Allow users to set "Default Personas" in their profile.
<matched_recommendations>

Recommendation: Persist exact map state in a global store (Zustand) for seamless switching. -> Matched Decision #3
Recommendation: Make root path / the dedicated Welcome/Landing page. -> Matched Decision #2
Recommendation: Use a dedicated /login page instead of modals. -> Matched Decision #2
Recommendation: Use full-screen view for "Profile/History" on mobile. -> Matched Decision #9
Recommendation: Implement optimistic updates for itinerary actions. -> Matched Decision #5
Recommendation: Allow users to set "Default Personas" in profile. -> Matched Decision #11
Recommendation: Customize Shadcn/ui with glassmorphism for a "premium" feel. -> Matched (General Aesthetic Decision) </matched_recommendations>
<ui_architecture_planning_summary>

Main UI Architecture Requirements
The application will be built as a modern, app-like web experience using Astro for the application shell and React for interactive islands. The design aesthetic focuses on a "Premium" look with glassmorphism effects (backdrop-blur, semi-transparent backgrounds) and smooth transitions. The architecture prioritizes a seamless flow between the Planning (Chat) and Exploration (Map) modes, ensuring users never feel lost.

Key Views and User Flows
Welcome View (/): A marketing-style landing page with animations to convert visitors.
Login View (/login): A clean, dedicated page for authentication (Supabase Auth).
Plan View (/plan): The core chat interface for AI-assisted planning. On mobile, this is full-screen with a drawer for the itinerary.
Map View (/map): Full-screen interactive map. Users navigate back to planning using a persistent "Chat" icon.
Profile View (/profile): Settings and history management. Full-screen on mobile.
Navigation Strategy:

Mobile: A fixed global bottom navigation bar allows instant switching between Chat, Map, and Profile.
Desktop: Consistent sidebar or header navigation.
API Integration and State Management
Single Source of Truth: All data is fetched from the API.
Client-Side Persistence: Zustand will be used to store transient UI state (Map viewport, active tab, sidebar state) to preserve context when navigating between routes.
Optimistic Updates: Actions like "Add to Itinerary" will immediately update the UI with a temporary state while the API request processes in the background. If it fails, the change is reverted and a Shadcn-style error card is shown.
Responsiveness, Accessibility, and Security
Mobile-First: The global navigation and full-screen views are designed specifically for mobile ergonomics.
Security: The application enforces a strict boundary between public (Welcome, Login) and protected (Plan, Map, Profile) routes. Unauthenticated users are redirected to Login if they attempt to access protected areas.
Accessibility: Standard semantic HTML and ARIA patterns will be used. Loading states will use clear spinners.
</ui_architecture_planning_summary>
</session_notes>

Your task is to create a detailed user interface architecture that includes necessary views, user journey mapping, navigation structure, and key elements for each view. The design should consider user experience, accessibility, and security.

Execute the following steps to complete the task:

1. Thoroughly analyze the PRD, API plan, and session notes.
2. Extract and list key requirements from the PRD.
3. Identify and list main API endpoints and their purposes.
4. Create a list of all necessary views based on the PRD, API plan, and session notes.
5. Determine the main purpose and key information for each view.
6. Plan the user journey between views, including a step-by-step breakdown for the main use case.
7. Design the navigation structure.
8. Propose key user interface elements for each view, considering UX, accessibility, and security.
9. Consider potential edge cases or error states.
10. Ensure the user interface architecture is compatible with the API plan.
11. Review and map all user stories from the PRD to the user interface architecture.
12. Explicitly map requirements to user interface elements.
13. Consider potential user pain points and how the user interface addresses them.

For each main step, work inside <ui_architecture_planning> tags in your thinking block to break down your thought process before moving to the next step. This section can be quite long. It's okay that this section can be quite long.

Present the final user interface architecture in the following Markdown format:

```markdown
# UI Architecture for [Product Name]

## 1. UI Structure Overview

[Provide a general overview of the UI structure]

## 2. View List

[For each view, provide:

- View name
- View path
- Main purpose
- Key information to display
- Key view components
- UX, accessibility, and security considerations]

## 3. User Journey Map

[Describe the flow between views and key user interactions]

## 4. Layout and Navigation Structure

[Explain how users will navigate between views]

## 5. Key Components

[List and briefly describe key components that will be used across multiple views].
```

Focus exclusively on user interface architecture, user journey, navigation, and key elements for each view. Do not include implementation details, specific visual design, or code examples unless they are crucial to understanding the architecture.

The final result should consist solely of the UI architecture in Markdown format in English, which you will save in the .ai/ui-plan.md file. Do not duplicate or repeat any work done in the thinking block.
