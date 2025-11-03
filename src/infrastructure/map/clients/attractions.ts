import type { AttractionScore } from "@/domain/map/models";

// API response types
interface SuccessResponse {
  success: true;
  attractions: AttractionScore[];
}

interface ErrorResponse {
  success: false;
  error: string;
}

type APIResponse = SuccessResponse | ErrorResponse;

/**
 * Fetch top scored attractions from backend API
 * Backend handles caching, scoring, and Google API calls
 */
export const fetchTopAttractions = async (lat: number, lng: number): Promise<AttractionScore[]> => {
  const response = await fetch("/api/attractions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lat, lng }),
  });

  const data: APIResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to load attractions");
  }

  return data.attractions;
};

/**
 * Fetch top scored restaurants from backend API
 * Backend handles caching, scoring, and Google API calls
 */
export const fetchTopRestaurants = async (lat: number, lng: number): Promise<AttractionScore[]> => {
  const response = await fetch("/api/restaurants", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lat, lng }),
  });

  const data: APIResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to load restaurants");
  }

  return data.attractions;
};
