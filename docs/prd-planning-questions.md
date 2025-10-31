1. Which specific traveler segments (e.g., adventure seekers, families, business travelers) are we prioritizing for launch? Recommendation: Define 1–2 primary personas so onboarding, chat prompts, and recommendations can be tailored to their goals.

I want to expand our target segments to allow users to select multiple personas for trip planning, including general tourists, nature lovers, first-time visitors, and art enthusiasts.

2. How do users currently discover and plan trips, and what pain points push them to seek an AI assistant? Recommendation: Capture qualitative insights from target users to validate the highest-friction stages we must address in MVP.

Users typically discover and plan trips using a mix of online resources—search engines, travel blogs, review platforms (like TripAdvisor, Google Maps), official tourism websites, social media, and sometimes printed guides. This process often involves juggling multiple tabs, manually cross-referencing information, building lists in spreadsheets or notes apps, and struggling to filter recommendations to match their interests, constraints, and group preferences.

3. What level of detail do we expect from the AI chat responses (e.g., quick list vs. rich narratives)? Recommendation: Establish response templates and tone guidelines so the AI output remains consistent and on-brand.

The AI chat should provide concise, actionable lists by default, with an option for users to request richer narratives or context when desired.

4. For the interactive map, which map interactions are essential at MVP (select, filter, drag-and-drop)? Recommendation: Prioritize the minimum interaction set that supports building an itinerary without overwhelming the initial scope.

Its implemented already. You can take a look on @features.md to check whats exactly implemented already.

5. How will the “system oceniania” be calculated—purely AI-driven, based on aggregated data, or user-generated ratings? Recommendation: Choose a transparent scoring model early to avoid user distrust and ensure explainability in recommendations.

There is scoring already implemented based on quality, diversity and confidence.


6. What measurable behaviors define completion of the “preferencje → chat → mapa” flow beyond simply reaching each step? Recommendation: Instrument events that capture depth of engagement (e.g., number of messages, places added, itinerary saved) to validate MVP success criteria.

I want to use google analitics or something similar for that.

7. Are there any non-negotiable constraints around data sources (e.g., Google Places, proprietary datasets) for attractions and restaurants? Recommendation: Confirm data licensing and API limits before committing to features that rely on third-party content.

Its already implemented on top of Google Maps. You can look at @features.md with complete list of features that are already implemented.

8. What is the desired turnaround time for generating suggestions after the user inputs preferences? Recommendation: Set performance benchmarks to guide technical decisions on caching, prefetching, and model selection.

Lets ignore performance for now and focus on functional requirements.

9. Do we envision itinerary collaboration or sharing in the near term, or is it explicitly a single-user experience for the MVP? 

It should be single-user experience.

10. What resources and timeline are available for design, engineering, and AI tuning? Recommendation: Align scope with team capacity by producing a high-level delivery plan that highlights critical path items and dependencies.

Its 1 person hobby project.

1. How should we balance or prioritize AI recommendations when a user selects multiple personas at once (e.g., nature lover + art enthusiast)? Recommendation: Define clear weighting rules for personas so scoring, prompts, and suggestion ordering stay predictable.

Even weights between choosen tags.

2. Where in the user journey should persona selection occur, and what default state should apply if someone skips it? Recommendation: Add a guided onboarding step (with skip handling) that persists persona choices and can be easily revisited in settings.

Default should be general tourists, we want to choose it by checking buttons on the top of the chat

3. Do we need persona-specific adjustments to the existing quality/diversity/confidence scoring model? Recommendation: Review the scoring pipeline to decide whether to add persona multipliers or filters so recommendations reflect the user’s combined interests.

No, lets leave scoring as it is. We can adjust nearby attractions/restaurants ai suggestion prompt based on that.

4. Will users need a workspace to keep external links, notes, or uploaded content while consolidating research? Recommendation: Consider adding a lightweight “Research” section (notes, saved links) to prevent context switching to spreadsheets or other apps.

No lets not do it in this scope.

5. How should the UI let users toggle between default concise lists and the richer narratives they can request from the chat? Recommendation: Introduce a quick-action control (e.g., “Show details”) that expands existing list entries without resetting the conversation.

Quick-action control (e.g., “Show details”) that expands existing list entries without resetting the conversation

6. Which of the /map features already built are mandatory for MVP versus nice-to-have? Recommendation: Create an MVP checklist against docs/map-features.md so we can freeze the essential subset and postpone non-critical capabilities.

/map features should stay as they are and we should focus on chat for planning places part

7. Are itineraries intended to capture day-by-day structures or just an unordered collection of places? Recommendation: Decide now whether to add date/time slots so the itinerary model and UI can evolve correctly (or avoid complexity by staying list-based).

unordered collection of places

8. What constraints (budget, mobility limits, time of day) should the preference flow capture to personalize results beyond personas? Recommendation: Expand the preference form with optional constraint fields and map them to AI prompt parameters.

Lets based on personas only for now.

9. Will the single-user experience require authentication or can we rely on local storage/session persistence for plans? Recommendation: Choose the simplest persistence strategy upfront to avoid rework if/when accounts are introduced later.

Yes, it will require authentication

10. Given this is a one-person hobby project, what are the milestone priorities and acceptable trade-offs? Recommendation: Outline a phased delivery plan (e.g., persona selection → chat improvements → itinerary refinements) to keep scope manageable and progress measurable.

persona selection → chat → itinerary refinements


1. Will persona selections persist per user account or reset each session? Recommendation: Decide whether to store persona choices in the user profile so returning users keep tailored defaults without reselecting.

it will reset each session

2. How should the top-of-chat persona buttons behave visually (toggle chips, checkboxes) and how many can be active at once? Recommendation: Define the interaction pattern and selection limit so the UX and implementation stay aligned.


It should be clear that selecting any persona (other than general tourist) automatically deselects the default general tourist option, to prevent ambiguous or diluted prompts. Only explicitly chosen personas should determine prompt context and feedback.


3. When a user adds personas beyond the default “general tourist,” should that default remain selected or be replaced automatically? Recommendation: Specify the selection rules to avoid ambiguity in prompt generation and UI feedback.

It should be clear that selecting any persona (other than general tourist) automatically deselects the default general tourist option, to prevent ambiguous or diluted prompts. Only explicitly chosen personas should determine prompt context and feedback.

4. Should the “Show details” quick action appear inline with every AI suggestion, or as a global control that expands the entire response? Recommendation: Choose a consistent placement so users immediately understand how to access richer context.

It should be inline with every AI suggestion

5. Which user intents must the chat cover for planning places (e.g., add to itinerary, reorder, remove)? Recommendation: List the must-have chat commands so prompts and system instructions can be scoped precisely.

add to itinerary and remove

6. How do persona combinations translate into prompt adjustments—do we need predefined descriptors or example interests per persona? Recommendation: Create a persona-to-prompt mapping table to keep AI outputs consistent and explainable.

Create a persona-to-prompt mapping table to keep AI outputs consistent and explainable


7. What minimal user information should we store after Google OAuth (name, email, avatar)? Recommendation: Document the data schema now to ensure compliance with Google policies and future privacy needs.

name and email

8. Do we need a contingency plan if Google OAuth fails (e.g., guest mode) or can the app remain inaccessible without login? 
Recommendation: Decide acceptable fallback behavior to prevent blockers during outages or configuration issues.

it should be inaccessible without login

9. Should users manage multiple itineraries/trips, or is there only one active plan per account? Recommendation: Establish the itinerary hierarchy (trip naming, duplication) so data models and UI navigation follow the same mental model.

Yes they should be able to do it, but that should be on the /map level where we should be able to load old maps, from planning we should just have export to map option which will create new places on /map places list

10. Which key analytics events (persona selection, chat actions, itinerary updates) must be tracked once GA is added? Recommendation: Draft an event taxonomy now so instrumentation can be added quickly when analytics work begins.

Lets ignore that for now

1. If persona selections reset every session even after login, what value do we gain from authentication in guiding AI context? Recommendation: Persist persona choices per user profile so the login requirement materially improves personalization rather than forcing repetitive setup.

Ok, lets persist persona choices per user profile

2. How should persona buttons adapt across desktop/mobile (e.g., horizontal row vs. dropdown) while keeping the deselection rules obvious? Recommendation: Define responsive layouts and microcopy now to prevent rework when designing the chat header.

horizontal row vs. dropdown

3. When users expand “Show details” inline, should the expanded state persist across new AI responses or reset each time? Recommendation: Decide on state retention to keep the UX predictable and to limit unnecessary rerendering or clutter.

it should persist

4. Will chat-driven “add/remove” actions rely on natural language commands, dedicated buttons, or both? Recommendation: Specify interaction patterns so system prompts and UI affordances reinforce each other and reduce misinterpretation.

dedicated buttons

5. Who will own creating and maintaining the persona-to-prompt mapping table, and in what format (e.g., JSON config, Effect layer)? Recommendation: Choose a maintainable structure so new personas or prompt tweaks can ship without touching core chat logic.

separated file with map persona to prompt

6. Do we need to inform users what personal data (name, email) we keep post-Google OAuth and offer deletion controls? Recommendation: Draft a minimal privacy notice and account-management plan to stay compliant and earn user trust.

no, its out of the scope

7. If the app is inaccessible without login, will there be a marketing/landing page that explains value before the auth gate? Recommendation: Provide a public-facing overview so prospects understand the product before committing to Google sign-in.

No its out of the scope

8. How will “export to map” handle naming/versioning when it creates new entries on /map—does the user pick a map name or use a timestamped default? Recommendation: Define the export metadata flow to keep multiple itineraries organized and avoid accidental overwrites.

it will use a timestamped default (google text search)

9. Should users see a history list of previously exported /map plans for easy reopening from the planning chat? Recommendation: Surface a lightweight history panel so people can jump back to earlier itineraries without hunting through /map.

Surface a lightweight history panel so people can jump back to earlier itineraries without hunting through /map.

10. Even if analytics is deferred, do we need lightweight logging of chat actions for debugging and product insight? Recommendation: Capture minimal server-side logs (without GA) so we can troubleshoot AI behavior and user flows before formal analytics arrives.

Capture minimal server-side logs (without GA) so we can troubleshoot AI behavior and user flows before formal analytics arrives.