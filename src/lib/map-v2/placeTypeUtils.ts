/**
 * Utility functions for determining place types and their visual indicators
 */

/**
 * Restaurant/food related types from Google Places API
 */
const RESTAURANT_TYPES = [
  "restaurant",
  "cafe",
  "bar",
  "bakery",
  "meal_takeaway",
  "meal_delivery",
  "food",
  "night_club",
];

/**
 * Determine if a place is a restaurant/food establishment
 * @param types - Array of Google Places types
 * @returns true if the place is a restaurant/food establishment
 */
export function isRestaurant(types: string[]): boolean {
  return types.some((type) => RESTAURANT_TYPES.includes(type));
}

/**
 * Determine if a place is an attraction (non-restaurant)
 * @param types - Array of Google Places types
 * @returns true if the place is an attraction (not a restaurant)
 */
export function isAttraction(types: string[]): boolean {
  return !isRestaurant(types);
}

/**
 * Get the place type category for display purposes
 * @param types - Array of Google Places types
 * @returns "restaurant" or "attraction"
 */
export function getPlaceTypeCategory(types: string[]): "restaurant" | "attraction" {
  return isRestaurant(types) ? "restaurant" : "attraction";
}










