import type { PersonaType, Place, SavedTrip } from "@/domain/models";
import { TripId, TripTimestamp, createSavedTrip, updateTripPlaces } from "@/domain/models";

const STORAGE_KEYS = {
  PERSONAS: "trip-planner:personas",
  CURRENT_ITINERARY: "trip-planner:current-itinerary",
  TRIP_HISTORY: "trip-planner:trip-history",
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

// Persona storage
export const savePersonas = (personas: PersonaType[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PERSONAS, JSON.stringify(personas));
  } catch (error) {
    console.error("Failed to save personas:", error);
  }
};

export const loadPersonas = (): PersonaType[] => {
  try {
    const json = localStorage.getItem(STORAGE_KEYS.PERSONAS);
    return safeJsonParse(json, []);
  } catch (error) {
    console.error("Failed to load personas:", error);
    return [];
  }
};

// Current itinerary storage
export const saveCurrentItinerary = (places: Place[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ITINERARY, JSON.stringify(places));
  } catch (error) {
    console.error("Failed to save current itinerary:", error);
  }
};

export const loadCurrentItinerary = (): Place[] => {
  try {
    const json = localStorage.getItem(STORAGE_KEYS.CURRENT_ITINERARY);
    return safeJsonParse(json, []);
  } catch (error) {
    console.error("Failed to load current itinerary:", error);
    return [];
  }
};

export const clearCurrentItinerary = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ITINERARY);
  } catch (error) {
    console.error("Failed to clear current itinerary:", error);
  }
};

// Trip history storage
export const saveTripToHistory = (places: Place[]): string => {
  try {
    const trip = createSavedTrip(places);
    const history = loadTripHistory();

    // Add new trip to the beginning (most recent first)
    history.unshift(trip);

    localStorage.setItem(STORAGE_KEYS.TRIP_HISTORY, JSON.stringify(history));
    return trip.id;
  } catch (error) {
    console.error("Failed to save trip to history:", error);
    return "";
  }
};

export const loadTripHistory = (): SavedTrip[] => {
  try {
    const json = localStorage.getItem(STORAGE_KEYS.TRIP_HISTORY);
    return safeJsonParse(json, []);
  } catch (error) {
    console.error("Failed to load trip history:", error);
    return [];
  }
};

export const loadTripById = (id: string): SavedTrip | null => {
  try {
    const history = loadTripHistory();
    return history.find((trip) => trip.id === id) ?? null;
  } catch (error) {
    console.error("Failed to load trip by ID:", error);
    return null;
  }
};

export const updateTripInHistory = (tripId: string, places: Place[]): void => {
  try {
    const history = loadTripHistory();
    const tripIndex = history.findIndex((trip) => trip.id === tripId);

    if (tripIndex !== -1) {
      const updatedTrip = updateTripPlaces(history[tripIndex], places);
      history[tripIndex] = updatedTrip;
      localStorage.setItem(STORAGE_KEYS.TRIP_HISTORY, JSON.stringify(history));
    }
  } catch (error) {
    console.error("Failed to update trip in history:", error);
  }
};

export const deleteTripFromHistory = (tripId: string): void => {
  try {
    const history = loadTripHistory();
    const filteredHistory = history.filter((trip) => trip.id !== tripId);
    localStorage.setItem(STORAGE_KEYS.TRIP_HISTORY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error("Failed to delete trip from history:", error);
  }
};
