import { RESTAURANT_TYPES } from "./constants";

export const NEARBY_PLACE_SEARCH_RADIUS = 150;
export const MIN_RATING_COUNT = 10;

export const isRestaurantSearch = (types: readonly string[]): boolean => {
  return types.some((t) => (RESTAURANT_TYPES as readonly string[]).includes(t));
};

/**
 * Combines types from multiple personas and deduplicates them
 * @param personaTypes - Array of persona type arrays to combine
 * @returns Deduplicated array of place types
 *
 * @example
 * // For a user who is both Nature Lover and Photography Enthusiast
 * const combinedTypes = combinePersonaTypes(
 *   NATURE_LOVER_TYPES,
 *   PHOTOGRAPHY_ENTHUSIAST_TYPES
 * );
 */
export const combinePersonaTypes = (...personaTypes: readonly (readonly string[])[]): string[] => {
  const allTypes = personaTypes.flat();
  return Array.from(new Set(allTypes));
};
