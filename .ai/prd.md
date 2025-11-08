# Product Requirements Document (PRD) - TripGenie

## 1. Product Overview

TripGenie is an AI-powered trip planning application that personalizes travel recommendations based on user preferences. The product addresses the complexity and time investment required in planning engaging trips by leveraging AI to suggest places and destinations where travelers can discover meaningful experiences.

The application operates through two integrated stages:

- Place Discovery: An AI chat interface that provides personalized place and destination recommendations based on selected traveler personas. These places are selected as starting points or exploration hubs chosen for their potential to have interesting nearby attractions - the place itself doesn't need to be a major attraction, but rather a good location from which to discover surrounding points of interest.
- Attraction Planning: An interactive map interface where users explore attractions and restaurants near their selected starting point places, with quality scoring to aid decision-making.

Key differentiators include:

- Persona-based place recommendations supporting multiple traveler types (general tourists, nature lovers, art enthusiasts, foodie travelers, adventure seekers, digital nomads, history buffs, photography enthusiasts)
- Two-stage workflow separating destination selection from attraction discovery
- Quality/diversity/confidence scoring for attractions and restaurants on the map
- Place validation through Google Maps to ensure searchability
- Seamless transition from discovery to planning with export functionality
- Persistent user profiles with saved preferences and trip history

## 2. User Problem

### Primary Problem

Planning engaging and personalized trips is difficult and time-consuming. Travelers struggle with:

- Information overload from multiple sources
- Difficulty finding places that match their specific interests
- Time-consuming research to validate quality and relevance
- Challenges in organizing discoveries into actionable itineraries

### User Pain Points

- Generic travel recommendations that don't account for personal preferences
- Lack of context about why specific places are recommended
- Difficulty transitioning from inspiration to concrete planning
- No centralized location to save and revisit trip plans
- Overwhelming amount of options without quality filtering

### Target Users

The application serves eight primary personas:

- General tourists seeking popular destinations
- Nature lovers interested in outdoor activities
- Art enthusiasts looking for cultural experiences
- Foodie travelers focused on culinary experiences
- Adventure seekers pursuing adrenaline activities
- Digital nomads needing work-friendly environments
- History buffs interested in heritage and monuments
- Photography enthusiasts looking for scenic viewpoints

## 3. Functional Requirements

### 3.1 Authentication and User Management

- Supabase Auth integration for user authentication (required for all access)
- User profile storage including name and email
- Persistent storage of persona selections per user account
- Session management and secure access control

### 3.2 Persona Selection

- Multi-select persona interface (horizontal row on desktop, dropdown on mobile)
- Default "general tourist" persona when none selected
- Even weighting applied when multiple personas are active
- Persistent persona choices across sessions
- Visual feedback for selected personas
- Personas influence place and destination recommendations only
- Attraction and restaurant discovery on the map is not persona-driven

### 3.3 AI Chat Interface

- Natural language input for travel queries
- AI suggests places and destinations only (cities, landmarks, beaches, trails, viewpoints, districts)
- Suggested places are selected as starting points or exploration hubs based on their potential for nearby attraction discovery
- The place itself doesn't need to be a major attraction - it's chosen for what's around it
- These starting point places can be neighborhoods, districts, central areas, or landmarks - all serving as bases for exploration
- All suggested places must be specific, geocodable locations with a valid Google Maps place ID and defined coordinates (latitude and longitude)
- Attractions and restaurants are not suggested in chat
- If users ask about attractions or restaurants, AI directs them to use the map interface
- Concise, actionable list responses by default
- Inline "Show details" expandable sections per suggestion
- Persistent expanded state across chat responses
- Add/remove buttons for itinerary management
- Context-aware responses based on selected personas
- Suggested place names are validated through Google Maps

### 3.4 Place Validation

- Place names are validated through Google Maps when user adds them to itinerary
- Validation ensures suggested places can be located and returns a valid Google Maps place ID and specific coordinates (latitude and longitude)
- Place ID and coordinates are required to display the place on the map and discover nearby attractions
- Error messages displayed if validation fails or place ID and coordinates cannot be obtained
- Failed places are not added to itinerary
- Persona-influenced recommendations apply to place and destination suggestions only

### 3.5 Itinerary Building

- Ordered collection of selected places
- Order suggests a route or visit sequence
- Order is preserved when exporting to map
- Place validation occurs when adding to itinerary
- Add/remove functionality from chat interface
- Real-time itinerary preview
- Show on map functionality
- Automatic timestamp generation for exports

### 3.6 Map Interface

- Interactive map visualization of selected places
- Places from itinerary appear in order on the map
- Discovery of local attractions and restaurants near the starting point places from chat
- This is where users discover why certain places were suggested - exploring the rich surrounding area of attractions and restaurants
- Quality/diversity/confidence scoring for attractions and restaurants only
- Discovery is generic and not influenced by personas
- Visual score badges with explanations for attractions and restaurants
- This is where detailed planning of attractions and restaurants happens
- Place details display
- Existing /map functionality preserved
- Support for imported itineraries

### 3.7 History and Export

- Timestamped export titles (e.g., "Trip Plan - 2025-11-01 14:30")
- History panel in planning interface
- Automatic saving of all changes made on /map view
- Saved content includes selected places and any discovered attractions or restaurants
- Ability to reopen previous map exports with all modifications preserved
- Chronological listing of past trips
- Quick access to saved itineraries with their final state

### 3.8 Logging and Analytics

- Server-side logging for debugging
- Minimal data capture for MVP
- Future integration preparation for Google Analytics
- Error tracking and monitoring

## 4. Product Boundaries

### In Scope for MVP

- Single-user planning flow
- Eight predefined personas with even weighting
- AI chat for place/destination suggestions (not attractions/restaurants) with expandable details
- Place validation through Google Maps
- Basic itinerary management (add/remove) with ordered sequence
- Scoring system for attractions and restaurants on map interface only
- Map export and history
- Supabase authentication
- Desktop and mobile responsive design
- Server-side logging

### Out of Scope for MVP

- Social features (sharing, comments, user profiles beyond basic auth)
- Travel logistics (transportation, reservations, budget tracking)
- Offline mode functionality
- Advanced personalization and learning algorithms
- Third-party authentication providers beyond Supabase
- Custom persona creation
- Research workspaces
- Collaboration features
- Additional preference constraints beyond personas
- Marketing landing pages
- Full analytics implementation

### Technical Constraints

- Requires internet connection
- Supabase-authenticated account mandatory for access
- Limited to predefined persona types
- Prompt adjustments managed via separate mapping file

## 5. User Stories

### US-001

- ID: US-001
- Title: User Authentication via Supabase
- Description: As a user, I want to sign in using Supabase authentication so that my preferences and trip plans are saved securely
- Acceptance Criteria:
  - User can initiate sign-in through Supabase
  - Supabase authentication flow completes successfully
  - User name and email are stored in the system
  - User is redirected to the main planning interface after authentication
  - Unauthenticated users cannot access any application features

### US-002

- ID: US-002
- Title: Select Travel Personas
- Description: As a user, I want to select my travel personas so that place recommendations match my interests
- Acceptance Criteria:
  - Eight persona options are displayed (general tourist, nature lover, art enthusiast, foodie traveler, adventure seeker, digital nomad, history buff, photography enthusiast)
  - User can select multiple personas simultaneously
  - Desktop shows personas in horizontal row layout
  - Mobile shows personas in dropdown format
  - Selected personas are visually highlighted
  - Selections persist across sessions for logged-in users
  - Personas influence place and destination recommendations in chat
  - Attraction and restaurant discovery on map is not persona-driven

### US-003

- ID: US-003
- Title: Default Persona Behavior
- Description: As a user, I want the general tourist persona to be selected by default if I haven't chosen any specific personas
- Acceptance Criteria:
  - General tourist is pre-selected on first visit
  - Deselecting all personas reverts to general tourist
  - Default behavior is consistent across sessions

### US-004

- ID: US-004
- Title: Chat with AI for Place Recommendations
- Description: As a user, I want to chat with an AI assistant to receive personalized place and destination recommendations that serve as starting points for discovering nearby attractions
- Acceptance Criteria:
  - Text input field accepts natural language queries
  - AI responds with places and destinations (cities, landmarks, beaches, trails, etc.)
  - Places are suggested as starting points or exploration hubs chosen for their nearby attraction potential
  - Attractions and restaurants are not suggested in chat
  - If asked about attractions or restaurants, AI directs user to map interface
  - AI responds with concise, actionable lists
  - Responses reflect selected personas
  - Chat history is maintained during session

### US-005

- ID: US-005
- Title: Expand Place Details
- Description: As a user, I want to expand individual place suggestions to see more details and understand why they're recommended as starting points for exploration
- Acceptance Criteria:
  - Each suggestion has a "Show details" button
  - Clicking expands additional information inline
  - Details include description and reasons for recommendation
  - Details include why this place matches selected personas
  - Details emphasize this is a starting point or exploration hub chosen for its nearby attraction potential
  - Details explain that the map interface will reveal attractions and restaurants in the surrounding area
  - Multiple suggestions can be expanded simultaneously

### US-006

- ID: US-006
- Title: Add Place to Itinerary from Chat
- Description: As a user, I want to add recommended places to my itinerary directly from the chat interface
- Acceptance Criteria:
  - Each suggestion has an "Add to itinerary" button
  - Place is validated through Google Maps when added
  - Validation confirms the place exists and retrieves a valid Google Maps place ID and specific coordinates (latitude and longitude)
  - Error message appears if place cannot be validated or place ID and coordinates cannot be obtained
  - Clicking adds the validated place with place ID and coordinates to the current itinerary
  - Visual confirmation appears when place is added
  - Button changes to "Added" state after selection
  - Itinerary count updates in real-time

### US-007

- ID: US-007
- Title: Remove Place from Itinerary
- Description: As a user, I want to remove places from my itinerary if I change my mind
- Acceptance Criteria:
  - Added places show "Remove from itinerary" option
  - Clicking removes the place from the itinerary
  - Visual confirmation of removal
  - Itinerary count updates immediately
  - Place can be re-added if desired

### US-008

- ID: US-008
- Title: View and Reorder Current Itinerary
- Description: As a user, I want to see all places in my current itinerary as an ordered collection
- Acceptance Criteria:
  - Dedicated section shows all selected places
  - Places display name and basic information
  - Places are displayed in order suggesting a visit sequence
  - Count of total places is visible
  - Empty state message when no places selected
  - Itinerary updates in real-time as places are added/removed
  - Newly added places are added at the end of the list
  - We should be able to reorder places by drag and drop
  - Reordering changes affect the sequence on exported map

### US-009

- ID: US-009
- Title: Export Itinerary to Map
- Description: As a user, I want to export my itinerary to an interactive map to discover attractions and restaurants near my selected starting point places
- Acceptance Criteria:
  - "Show on Map" button is available when itinerary has places
  - Clicking creates timestamped export (e.g., "Trip Plan - 2025-11-01 14:30")
  - User is redirected to /map with imported places
  - Export transitions from selecting exploration hubs to discovering their nearby attractions and restaurants
  - All itinerary places appear on the map
  - Places appear on map in the order from itinerary
  - Initial export state is saved to user's history
  - All subsequent changes on /map are automatically persisted to the same history entry

### US-010

- ID: US-010
- Title: View Trip History
- Description: As a user, I want to access my previous trip plans from a history panel with all my modifications preserved
- Acceptance Criteria:
  - History panel accessible from planning interface
  - Shows chronological list of past exports
  - Each entry displays timestamp and current place count (updated as changes are made)
  - Clicking an entry reopens the map with all previously made changes intact
  - Recent trips appear at the top
  - History reflects the final state of each trip, including all additions/removals made on /map

### US-011

- ID: US-011
- Title: Explore Map Interface
- Description: As a user, I want to interact with an interactive map to visualize my selected places and discover nearby attractions and restaurants
- Acceptance Criteria:
  - Map displays all imported places from itinerary with markers
  - Attractions and restaurants are discovered separately near these places
  - Clicking markers shows place details
  - Map supports zoom and pan functionality
  - Current location can be centered if permitted
  - Map maintains existing /map functionality
  - All changes made on the map (adding/removing places) are automatically saved to trip history

### US-012

- ID: US-012
- Title: Auto-Save Map Changes to History
- Description: As a user, I want all my changes on the /map view to be automatically saved so I don't lose my work
- Acceptance Criteria:
  - Changes to the itinerary on /map are saved automatically without user action
  - Adding a place on the map updates the history entry
  - Removing a place on the map updates the history entry
  - Reordering places is persisted
  - Explicit "Save" button needed - all changes are saved once its clicked
  - Visual indicator shows when changes are being saved
  - If user returns to the same trip later, all modifications are preserved

### US-013

- ID: US-013
- Title: Discover Local Attractions and Restaurants on Map
- Description: As a user, I want to discover nearby attractions and restaurants while viewing the map
- Acceptance Criteria:
  - "Suggest nearby" functionality available on map
  - Suggestions based on current map view and places from itinerary
  - Discovery is generic and not influenced by personas
  - Quality/diversity/confidence scores displayed
  - Filters available for attraction types

### US-014

- ID: US-014
- Title: View Attraction and Restaurant Scores on Map
- Description: As a user, I want to see quality scores for attractions and restaurants on the map to make informed decisions
- Acceptance Criteria:
  - Score badges displayed for each attraction and restaurant
  - Scores show quality, diversity, and confidence metrics
  - Click score for detailed explanation
  - Scores only appear in map interface, not in chat
  - Scores apply to attractions and restaurants, not places
  - Visual indicators for score ranges

### US-015

- ID: US-015
- Title: Mobile Responsive Experience
- Description: As a mobile user, I want to access all features with an optimized mobile interface
- Acceptance Criteria:
  - Persona selector uses dropdown on mobile
  - Chat interface adapts to mobile viewport
  - Map is touch-optimized with pinch-zoom
  - Navigation between views is mobile-friendly
  - All buttons and controls are touch-accessible

### US-016

- ID: US-016
- Title: Logout Functionality
- Description: As a user, I want to securely log out of my account
- Acceptance Criteria:
  - Logout option available in user menu
  - Confirms logout action
  - Clears session data
  - Redirects to login page
  - Requires re-authentication to access again

### US-017

- ID: US-017
- Title: Handle AI Chat Errors
- Description: As a user, I want to see helpful error messages if the AI chat encounters issues
- Acceptance Criteria:
  - Error messages display when AI is unavailable
  - Specific messages for timeout errors
  - Retry option provided
  - Errors don't break the interface
  - Previous chat history preserved

### US-018

- ID: US-018
- Title: Empty Itinerary State
- Description: As a new user, I want clear guidance when my itinerary is empty
- Acceptance Criteria:
  - Empty state shows helpful message
  - Suggests starting with chat
  - Provides example queries
  - Export button is disabled when empty
  - Visual indication of empty state

### US-019

- ID: US-019
- Title: Session Persistence
- Description: As a user, I want my current planning session to persist if I accidentally refresh the page
- Acceptance Criteria:
  - Current itinerary persists across refreshes
  - Selected personas maintain state
  - Chat context preserved within session
  - Expanded details remain expanded
  - Map view position saved

### US-020

- ID: US-020
- Title: Quick Persona Switch
- Description: As a user, I want to quickly change my personas to see different recommendations
- Acceptance Criteria:
  - Persona changes take effect immediately
  - No page reload required
  - AI responses adapt to new personas
  - Existing itinerary preserved when personas change
  - Only future suggestions reflect new persona selection
  - Previous suggestions remain visible
  - Clear indication of active personas

### US-021

- ID: US-021
- Title: Loading States
- Description: As a user, I want to see loading indicators while waiting for responses
- Acceptance Criteria:
  - Loading spinner during AI responses
  - Skeleton screens for initial page loads
  - Progress indication for map exports
  - Disabled state for buttons during operations
  - Smooth transitions between states

### US-022

- ID: US-022
- Title: Place Validation and Error Handling
- Description: As a user, I want suggested places validated through Google Maps when I add them so I can trust they exist and have a valid place ID and coordinates for map display
- Acceptance Criteria:
  - Places validated when user adds them to itinerary
  - Validation retrieves a valid Google Maps place ID and specific coordinates (latitude and longitude) for each place
  - Error message displayed if validation fails or place ID and coordinates cannot be obtained
  - Failed places not added to itinerary
  - Successfully validated places with place ID and coordinates can be displayed on the map
  - Place ID and coordinates enable discovery of nearby attractions and restaurants
  - User can choose different suggestion if validation fails

### US-023

- ID: US-023
- Title: Clear Guidance for Attraction/Restaurant Queries
- Description: As a user, I want clear guidance when I ask about attractions or restaurants in chat so I understand where to find that information
- Acceptance Criteria:
  - AI politely explains attractions/restaurants are found on map interface
  - Response suggests adding relevant places to itinerary first
  - User understands the two-stage workflow
  - Helpful and friendly tone maintained

## 6. Success Metrics

### Metrics

- User Adoption: 25+ testers have used the application
- Flow Completion: ≥50% of users complete the full flow (preferences → chat → map)
- Engagement: Average of ≥3 saved places per trip plan

### Future Tracking (Post-MVP)

- Detailed funnel analysis via Google Analytics
- Feature usage heatmaps
- Performance metrics monitoring
- A/B testing for persona combinations
