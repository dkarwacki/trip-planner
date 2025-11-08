<conversation_summary>
<decisions>
MVP targets four personas—general tourists, nature lovers, first-time visitors, art enthusiasts—with even weighting when multiple tags are active.
General tourist is the default persona; selecting any other persona via top-of-chat controls deselects it, and persona choices persist per user profile.
Persona selection UI will use a horizontal row on desktop and a dropdown pattern on mobile.
AI chat returns concise actionable lists by default, with an inline “Show details” quick action on each suggestion that retains its expanded state across responses.
Chat-driven planning relies on dedicated add/remove buttons; supported intents are limited to adding places to the itinerary and removing them.
Existing /map functionality remains unchanged for MVP, keeping focus on enhancing the planning chat experience.
Current quality/diversity/confidence scoring stays in place; persona influence is handled through prompt adjustments defined in a separate persona-to-prompt mapping file.
Itineraries stay as unordered collections; exporting to /map creates timestamped entries, and a history panel in planning will let users reopen prior maps.
Preference capture stays persona-only; research workspaces and additional constraint inputs are excluded from scope.
Users must authenticate via Google OAuth (name and email stored); the app is unavailable without login, and persona selections persist with the account.
Minimal server-side logging will support debugging; full analytics with Google Analytics is deferred.
Delivery will follow milestones of persona selection, then chat enhancements, then itinerary refinements within the one-person hobby project context.
</decisions>
<matched_recommendations>
Define clear weighting rules for multiple personas → Implemented through even weights for all selected persona tags.
Introduce inline quick-action controls for richer AI context → Adopted via per-suggestion “Show details” expanders with persistent state.
Maintain a persona-to-prompt mapping artifact → Confirmed as a separate file managing prompt adjustments.
Persist persona choices to justify authentication → Accepted by storing persona selections with each user profile.
Provide history access for exported maps → Agreed to surface a lightweight history panel in planning.
Capture minimal logs ahead of full analytics → Committed to server-side logging while deferring Google Analytics.
Sequence roadmap milestones → Locked in milestone order of persona selection → chat → itinerary refinements.
</matched_recommendations>
<prd_planning_summary>
Functional requirements center on a logged-in, single-user planning flow: select personas (desktop row/mobile dropdown), receive concise AI suggestions with expandable details, manipulate itineraries via add/remove buttons, export plans to /map with timestamped titles, and revisit them through a history panel. Existing map exploration, scoring, and discovery features remain intact.
Key usage path: user signs in with Google, confirms or modifies persona tags, engages the AI chat to gather suggestions, expands details when needed, adds or removes items from the itinerary, then exports the plan to /map and can later reopen past exports from history.
Success criteria continue to track 25+ testers, ≥50% completion of the preferences → chat → map flow, and average ≥3 saved places. Measurement will rely on upcoming Google Analytics plus interim server-side logging.
Scope boundaries: prompts adapt via a persona mapping file; no research workspace, collaboration, or additional preference constraints; privacy messaging and marketing landing pages remain out of scope for MVP.
</prd_planning_summary>
<unresolved_issues>
Persona-to-prompt mapping content, maintenance process, and exact prompt phrasing still need definition.
Detailed UX specs for the persona selector across breakpoints, the history panel, and export naming workflow require follow-up.
Logging scope and retention policies have not been specified despite the commitment to capture minimal server-side logs.
</unresolved_issues>
</conversation_summary>
