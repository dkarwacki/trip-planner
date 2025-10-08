import { RESTAURANT_TYPES } from "./constants";

export const NEARBY_PLACE_SEARCH_RADIUS = 150;
export const MIN_RATING_COUNT = 10;

const HIGHEST_PRIORITY_TYPES = new Set([
  "tourist_attraction",
  "museum",
  "art_gallery",
  "monument",
  "church",
  "synagogue",
  "mosque",
  "temple",
  "historical_landmark",
  "cultural_center",
  "performing_arts_theater",
]);

const HIGH_PRIORITY_TYPES = new Set([
  "park",
  "national_park",
  "zoo",
  "aquarium",
  "amusement_park",
  "stadium",
  "casino",
]);

const MEDIUM_PRIORITY_TYPES = new Set([
  "shopping_mall",
  "department_store",
  "hotel",
  "lodging",
  "restaurant",
  "cafe",
  "bar",
  "night_club",
]);

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const getTypePriority = (types: string[]): number => {
  for (const type of types) {
    if (HIGHEST_PRIORITY_TYPES.has(type)) return 100;
  }
  for (const type of types) {
    if (HIGH_PRIORITY_TYPES.has(type)) return 75;
  }
  for (const type of types) {
    if (MEDIUM_PRIORITY_TYPES.has(type)) return 50;
  }

  return 25;
};

export const isRestaurantSearch = (types: readonly string[]): boolean => {
  return types.some((t) => (RESTAURANT_TYPES as readonly string[]).includes(t));
};

export const calculatePlaceScore = (
  distance: number,
  types: string[],
  rating?: number,
  userRatingsTotal?: number
): number => {
  const typePriority = getTypePriority(types);
  const ratingScore = (rating || 0) * 10;
  const reviewScore = Math.min((userRatingsTotal || 0) / 10, 50);
  const distanceScore = Math.max(0, 100 - distance);

  return typePriority + ratingScore + reviewScore + distanceScore;
};
