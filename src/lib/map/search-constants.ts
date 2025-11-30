/**
 * Constants for map search and discovery functionality
 */

/**
 * Default radius for searching nearby attractions and restaurants (in meters)
 * This is used when fetching places around a location
 */
export const NEARBY_SEARCH_RADIUS_METERS = 5000; // 5km

/**
 * Threshold distance to show "Search this area" button (in meters)
 * Button appears when user pans beyond this distance from last search
 */
export const SEARCH_AREA_BUTTON_SHOW_THRESHOLD_METERS = NEARBY_SEARCH_RADIUS_METERS + 500; // 5.5km

/**
 * Threshold distance to change button to "Start new trip point here" (in meters)
 * When user pans beyond this distance, it suggests starting a new trip point instead of just searching
 */
export const NEW_TRIP_POINT_THRESHOLD_METERS = 20000; // 20km
