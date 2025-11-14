import type { Place } from "@/domain/common/models";

const STORAGE_KEYS = {
  CURRENT_ITINERARY: "trip-planner:current-itinerary",
} as const;

// Helper to safely parse JSON from localStorage
const safeJsonParse = <T>(json: string | null, fallback: T): T => {
  if (!json) return fallback;

  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error("Failed to parse JSON from localStorage:", error);
    return fallback;
  }
};

// Personas moved to PostgreSQL - see src/infrastructure/plan/clients/personas.ts
// API: GET/PUT /api/personas

// Current itinerary storage
export const saveCurrentItinerary = (places: Place[]): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ITINERARY, JSON.stringify(places));
  } catch (error) {
    console.error("Failed to save current itinerary:", error);
  }
};

export const loadCurrentItinerary = (): Place[] => {
  if (typeof window === "undefined") return [];

  try {
    const json = localStorage.getItem(STORAGE_KEYS.CURRENT_ITINERARY);
    return safeJsonParse(json, []);
  } catch (error) {
    console.error("Failed to load current itinerary:", error);
    return [];
  }
};

export const clearCurrentItinerary = (): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ITINERARY);
  } catch (error) {
    console.error("Failed to clear current itinerary:", error);
  }
};

// Trips moved to PostgreSQL - see src/infrastructure/plan/clients/trips.ts
// API: GET/POST/PUT/DELETE /api/trips

// Conversations moved to PostgreSQL - see src/infrastructure/plan/clients/conversations.ts
// API: GET/POST/PUT/DELETE /api/conversations
